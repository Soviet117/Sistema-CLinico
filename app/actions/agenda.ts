"use server";

import { prisma } from "@/lib/prisma";
import { CitaSchema } from "@/lib/validations/citas";
import { revalidatePath } from "next/cache";

export type FormStateAgenda = {
  errors?: {
    pacienteId?: string[];
    medicoId?: string[];
    boxId?: string[];
    motivo?: string[];
    fechaHoraInicio?: string[];
    fechaHoraFin?: string[];
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function createCita(prevState: FormStateAgenda, formData: FormData): Promise<FormStateAgenda> {
  const rawData = {
    pacienteId: formData.get("pacienteId"),
    medicoId: formData.get("medicoId"),
    boxId: formData.get("boxId"),
    motivo: formData.get("motivo"),
    fechaHoraInicio: formData.get("fechaHoraInicio"),
    fechaHoraFin: formData.get("fechaHoraFin"),
  };

  const validatedFields = CitaSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Por favor corrija los errores en el formulario.",
      success: false
    };
  }

  const { pacienteId, medicoId, boxId, motivo, fechaHoraInicio, fechaHoraFin } = validatedFields.data;
  
  const start = new Date(fechaHoraInicio);
  const end = new Date(fechaHoraFin);

  try {
    // 1. Verificar Overbooking (Condición de Carrera / Disponibilidad)
    const conflicto = await prisma.cita.findFirst({
      where: {
        estado: { not: "CANCELADA" },
        OR: [
          { medicoId: medicoId },
          { boxId: boxId }
        ],
        AND: [
          { fechaHoraInicio: { lt: end } },
          { fechaHoraFin: { gt: start } }
        ]
      },
      include: {
        medico: { select: { user: { select: { nombre: true } } } },
        box: { select: { nombre: true } }
      }
    });

    if (conflicto) {
      const isDoctor = conflicto.medicoId === medicoId;
      const resourceName = isDoctor ? conflicto.medico?.user?.nombre : conflicto.box?.nombre;
      return {
        message: `Conflicto de horario: El ${isDoctor ? 'médico' : 'box'} '${resourceName || 'seleccionado'}' ya tiene un compromiso en ese rango.`,
        errors: { _form: ["Se ha detectado solapamiento. Por favor, elija otro horario."] },
        success: false
      };
    }

    // Identificar el usuario creador (simulado hasta tener módulo Auth completo)
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
      throw new Error("Sistema sin usuarios administrativos.");
    }

    let finalPacienteId = pacienteId;

    // Crear paciente rápido si es nuevo
    if (pacienteId === "new") {
      const nuevoPaciente = await prisma.paciente.create({
        data: {
          nombre: formData.get("nuevoPacienteNombre") as string,
          apellido: formData.get("nuevoPacienteApellido") as string,
          fechaNacimiento: new Date(formData.get("nuevoPacienteFechaNac") as string),
          genero: formData.get("nuevoPacienteGenero") as any,
        }
      });
      finalPacienteId = nuevoPaciente.id;
    }

    // 2. Crear Cita
    await prisma.cita.create({
      data: {
        pacienteId: finalPacienteId,
        medicoId,
        boxId,
        motivo,
        fechaHoraInicio: start,
        fechaHoraFin: end,
        usuarioId: adminUser.id,
      }
    });
    
  } catch (error) {
    console.error("Error creating cita:", error);
    return {
      message: "Ocurrió un error en el servidor al guardar la cita.",
      errors: { _form: ["Problema interno. Inténtalo más tarde."] },
      success: false
    };
  }

  revalidatePath("/agenda");
  return { success: true, message: "Cita programada con éxito." };
}

export async function getAgenda(startDate: Date, endDate: Date, filterMedicoId?: string, filterBoxId?: string) {
  try {
    const queryWhere: any = {
      fechaHoraInicio: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filterMedicoId) queryWhere.medicoId = filterMedicoId;
    if (filterBoxId) queryWhere.boxId = filterBoxId;

    const citas = await prisma.cita.findMany({
      where: queryWhere,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        medico: { select: { id: true, user: { select: { nombre: true } } } },
        box: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaHoraInicio: 'asc' }
    });

    return { data: citas, error: null };
  } catch (error) {
    console.error("Error fetching agenda:", error);
    return { data: [], error: "Error al cargar la agenda." };
  }
}
export async function updateEstadoCita(citaId: string, nuevoEstado: any) {
  try {
    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: nuevoEstado }
    });
    revalidatePath("/agenda");
    return { success: true, message: `Cita actualizada a ${nuevoEstado}.` };
  } catch (error) {
    console.error("Error updating cita:", error);
    return { success: false, message: "Error al actualizar el estado de la cita." };
  }
}
