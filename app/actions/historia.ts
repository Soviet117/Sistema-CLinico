"use server";

import { prisma } from "@/lib/prisma";
import { HistoriaClinicaSchema } from "@/lib/validations/historia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = {
  errors?: {
    pacienteId?: string[];
    nombre?: string[];
    apellido?: string[];
    fechaNacimiento?: string[];
    genero?: string[];
    tipoSangre?: string[];
    contacto?: string[];
    alergias?: string[];
    antecedentes?: string[];
    presionArt?: string[];
    pulso?: string[];
    temperatura?: string[];
    peso?: string[];
    motivo?: string[];
    sintomas?: string[];
    diagnostico?: string[];
    tratamiento?: string[];
    doctorId?: string[];
    precioFinal?: string[];
    _form?: string[];
  };
  message?: string | null;
};

export async function createHistoriaClinica(prevState: FormState, formData: FormData): Promise<FormState> {
  // Convert FormData to an object for Zod validation
  const rawData = {
    citaId: formData.get("citaId"),
    pacienteId: formData.get("pacienteId"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    genero: formData.get("genero"),
    tipoSangre: formData.get("tipoSangre"),
    contacto: formData.get("contacto"),
    alergias: formData.get("alergias"),
    antecedentes: formData.get("antecedentes"),
    presionArt: formData.get("presionArt"),
    pulso: formData.get("pulso"),
    temperatura: formData.get("temperatura"),
    peso: formData.get("peso"),
    motivo: formData.get("motivo"),
    sintomas: formData.get("sintomas"),
    diagnostico: formData.get("diagnostico"),
    tratamiento: formData.get("tratamiento"),
    doctorId: formData.get("doctorId"),
    precioFinal: formData.get("precioFinal"),
  };

  // Validar con Zod
  const validatedFields = HistoriaClinicaSchema.safeParse(rawData);

  // Si la validación falla, retornar los errores para mostrarlos en el UI
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Por favor corrija los errores en el formulario.",
    };
  }

  const data = validatedFields.data;
  let estadoCierre: "COMPLETADA" | "PENDIENTE_PAGO" | null = null;

  try {
    // Verificar si el médico existe
    let activeMedico = await prisma.medico.findUnique({
      where: { id: data.doctorId }
    });

    if (!activeMedico) {
       // Buscar cualquier médico activo
       activeMedico = await prisma.medico.findFirst({ 
         where: { estado: 'ACTIVO' }
       });
       if (!activeMedico) {
         throw new Error("No hay médicos activos en el sistema para asignar esta historia.");
       }
    }

    // Utilizar una transacción para asegurar integridad referencial
    await prisma.$transaction(async (tx) => {
      let finalPacienteId = data.pacienteId;

      // 1. Manejo de 'Nuevo Paciente'
      if (finalPacienteId === "new") {
        const newPaciente = await tx.paciente.create({
          data: {
            nombre: data.nombre!,
            apellido: data.apellido!,
            fechaNacimiento: new Date(data.fechaNacimiento!),
            genero: data.genero as any, // Mapeado desde el enum
            tipoSangre: data.tipoSangre || null,
            contacto: data.contacto || null,
            alergias: data.alergias || null,
            antecedentes: data.antecedentes || null,
          },
        });
        finalPacienteId = newPaciente.id;
      } else {
        // Si el paciente ya existe, actualizamos su información de contacto si ha cambiado.
        const existingPaciente = await tx.paciente.findUnique({
          where: { id: finalPacienteId },
          select: { contacto: true }
        });
        
        if (existingPaciente) {
          const currentContact = existingPaciente.contacto || "";
          const newContact = data.contacto || "";
          if (currentContact !== newContact) {
            await tx.paciente.update({
              where: { id: finalPacienteId },
              data: {
                contacto: data.contacto || null
              }
            });
          }
        }
      }

      // 2. Crear Historia Clínica asociada
      await tx.historiaClinica.create({
        data: {
          pacienteId: finalPacienteId,
          medicoId: activeMedico.id, // ID del Médico verificado
          motivo: data.motivo,
          sintomas: data.sintomas,
          diagnostico: data.diagnostico,
          planTratamiento: data.tratamiento,
          presion: data.presionArt,
          pulso: data.pulso,
          temperatura: data.temperatura,
          peso: data.peso,
        },
      });

      // 3. Actualizar la factura y cerrar la cita solo si no queda saldo pendiente.
      if (data.citaId) {
        // FACTURACIÓN: Actualizar la factura existente creada en Agenda
        // Se permite modificar el precio base de la especialidad usando 'precioFinal'
        const precioFinalNumber = data.precioFinal;

        let facturaActualizada = await tx.factura.findUnique({
          where: { citaId: data.citaId }
        });

        if (precioFinalNumber !== undefined && precioFinalNumber !== null) {
          if (facturaActualizada) {
            facturaActualizada = await tx.factura.update({
              where: { citaId: data.citaId },
              data: {
                montoBase: precioFinalNumber,
                montoTotal: precioFinalNumber, // Set total as new modified base
              }
            });
          }
        }

        if (facturaActualizada) {
          const adelantoValidado = facturaActualizada.estadoAdelanto === 'VALIDADO'
            ? Number(facturaActualizada.montoAdelanto)
            : 0;
          const saldoPendiente = facturaActualizada.estadoPago === 'PAGADO'
            ? 0
            : Math.max(Number(facturaActualizada.montoTotal) - adelantoValidado, 0);

          const nuevoEstado = saldoPendiente > 0 ? 'PENDIENTE_PAGO' : 'COMPLETADA';
          await tx.cita.update({
            where: { id: data.citaId },
            data: { estado: nuevoEstado }
          });
          estadoCierre = nuevoEstado;
        } else {
          await tx.cita.update({
            where: { id: data.citaId },
            data: { estado: 'COMPLETADA' }
          });
          estadoCierre = 'COMPLETADA';
        }
      } else {
        // FLUJO PACIENTE "DE FRENTE": No hay cita previa
        // 1. Encontrar un Box disponible para la especialidad del médico
        const medicoDetalle = await tx.medico.findUnique({
          where: { id: activeMedico.id },
          include: { especialidad: true }
        });

        let boxId = "";
        const boxEspecialidad = await tx.box.findFirst({
          where: { especialidadId: medicoDetalle?.especialidadId }
        });

        if (boxEspecialidad) {
          boxId = boxEspecialidad.id;
        } else {
          // Fallback a cualquier box si no hay uno específico
          const anyBox = await tx.box.findFirst();
          if (anyBox) boxId = anyBox.id;
          else throw new Error("No hay consultorios (boxes) en el sistema para asignar esta atención.");
        }

        const adminUser = await tx.user.findFirst();
        if (!adminUser) throw new Error("Sistema sin usuarios administrativos.");

        const now = new Date();

        // 2. Crear Cita "Fantasma" pendiente de pago hasta que caja cobre
        const nuevaCita = await tx.cita.create({
          data: {
            pacienteId: finalPacienteId,
            medicoId: activeMedico.id,
            boxId: boxId,
            motivo: data.motivo,
            fechaHoraInicio: now,
            fechaHoraFin: now,
            usuarioId: adminUser.id,
            estado: 'PENDIENTE_PAGO'
          }
        });
        estadoCierre = 'PENDIENTE_PAGO';

        // 3. Crear Factura desde cero por el monto total
        const precioFinal = data.precioFinal !== undefined && data.precioFinal !== null 
                              ? data.precioFinal 
                              : (medicoDetalle?.especialidad?.precioBase || 0);

        await tx.factura.create({
          data: {
            montoBase: precioFinal,
            montoAdelanto: 0,
            montoTotal: precioFinal,
            estadoPago: 'PENDIENTE',
            citaId: nuevaCita.id,
            pacienteId: finalPacienteId,
            categoria: 'Consulta'
          }
        });
      }
    });

  } catch (error) {
    console.error("Error creating historia clinica:", error);
    return {
      message: "Ocurrió un error en el servidor al guardar la historia clínica.",
      errors: {
        _form: ["Hubo un problema de base de datos. Inténtalo más tarde."]
      }
    };
  }

  // Redirigir en caso de éxito
  // Si la historia vino de una cita, volvemos a la Sala de Espera para seguir el flujo
  if (data.citaId) {
    revalidatePath("/atencion");
    revalidatePath("/agenda");
    revalidatePath("/facturacion");
    redirect(estadoCierre === "PENDIENTE_PAGO" ? "/facturacion" : "/atencion");
  } else {
    revalidatePath("/pacientes");
    revalidatePath("/facturacion");
    redirect(estadoCierre === "PENDIENTE_PAGO" ? "/facturacion" : "/pacientes");
  }
}
