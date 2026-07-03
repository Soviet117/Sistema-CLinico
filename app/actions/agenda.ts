"use server";

import { prisma } from "@/lib/prisma";
import { CitaSchema } from "@/lib/validations/citas";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type FormStateAgenda = {
  errors?: {
    pacienteId?: string[];
    medicoId?: string[];
    boxId?: string[];
    motivo?: string[];
    fechaHoraInicio?: string[];
    fechaHoraFin?: string[];
    montoAdelanto?: string[];
    metodoAdelanto?: string[];
    observacionPago?: string[];
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
    montoAdelanto: formData.get("montoAdelanto"),
    metodoAdelanto: formData.get("metodoAdelanto") || undefined,
    observacionPago: formData.get("observacionPago") || undefined,
  };

  const validatedFields = CitaSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Por favor corrija los errores en el formulario.",
      success: false
    };
  }

  const { pacienteId, medicoId, boxId, motivo, fechaHoraInicio, fechaHoraFin, montoAdelanto, metodoAdelanto, observacionPago } = validatedFields.data;

  const start = new Date(fechaHoraInicio);
  const end = new Date(fechaHoraFin);
  const comprobante = formData.get("comprobanteAdelanto");
  const comprobanteFile = comprobante instanceof File && comprobante.size > 0 ? comprobante : null;

  if (comprobanteFile) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(comprobanteFile.type)) {
      return {
        message: "El comprobante debe ser una imagen JPG/PNG/WebP o PDF.",
        errors: { _form: ["Formato de comprobante inválido."] },
        success: false
      };
    }

    if (comprobanteFile.size > 5 * 1024 * 1024) {
      return {
        message: "El comprobante no debe superar los 5 MB.",
        errors: { _form: ["Archivo demasiado grande."] },
        success: false
      };
    }
  }

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
    const nuevaCita = await prisma.cita.create({
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

    // 3. Crear Factura PENDIENTE con adelanto y obtener precio base
    const boxDetalle = await prisma.box.findUnique({
      where: { id: boxId },
      include: { especialidad: true }
    });

    const precioBase = boxDetalle?.especialidad?.precioBase || 0;
    const adelantoNum = Number(montoAdelanto) || 0;
    let comprobanteUrl: string | null = null;

    if (comprobanteFile) {
      const extension = path.extname(comprobanteFile.name).toLowerCase() || ".jpg";
      const uploadDir = path.join(process.cwd(), "public", "uploads", "comprobantes");
      const fileName = `${nuevaCita.id}-${Date.now()}${extension}`;
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), Buffer.from(await comprobanteFile.arrayBuffer()));
      comprobanteUrl = `/uploads/comprobantes/${fileName}`;
    }

    const estadoAdelanto =
      adelantoNum <= 0
        ? "NO_REQUIERE"
        : metodoAdelanto === "EFECTIVO"
          ? "VALIDADO"
          : comprobanteUrl
            ? "COMPROBANTE_ENVIADO"
            : "PENDIENTE";

    await prisma.factura.create({
      data: {
        montoBase: precioBase,
        montoAdelanto: adelantoNum,
        montoTotal: precioBase, // Initially total is just the base price, wait, or wait until historia? No, total is base price for now.
        estadoPago: 'PENDIENTE',
        metodoAdelanto: metodoAdelanto || null,
        estadoAdelanto,
        comprobanteUrl,
        observacionPago: observacionPago || null,
        fechaComprobante: comprobanteUrl ? new Date() : null,
        fechaValidacion: estadoAdelanto === "VALIDADO" ? new Date() : null,
        validadoPorId: estadoAdelanto === "VALIDADO" ? adminUser.id : null,
        citaId: nuevaCita.id,
        pacienteId: finalPacienteId,
        categoria: 'Consulta',
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
  revalidatePath("/facturacion");
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
        box: { select: { id: true, nombre: true } },
        factura: { select: { montoTotal: true, montoAdelanto: true, estadoPago: true, estadoAdelanto: true } }
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
    if (nuevoEstado === "COMPLETADA") {
      const factura = await prisma.factura.findUnique({
        where: { citaId },
        select: { montoTotal: true, montoAdelanto: true, estadoPago: true, estadoAdelanto: true }
      });

      if (factura && factura.estadoPago !== "PAGADO") {
        const adelantoValidado = factura.estadoAdelanto === "VALIDADO" ? Number(factura.montoAdelanto) : 0;
        const saldo = Math.max(Number(factura.montoTotal) - adelantoValidado, 0);
        if (saldo > 0) {
          await prisma.cita.update({
            where: { id: citaId },
            data: { estado: "PENDIENTE_PAGO" }
          });
          revalidatePath("/agenda");
          revalidatePath("/atencion");
          revalidatePath("/facturacion");
          return { success: false, message: "La cita tiene saldo pendiente. Debe pasar por caja antes de completarse." };
        }
      }
    }

    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: nuevoEstado }
    });
    revalidatePath("/agenda");
    revalidatePath("/atencion");
    revalidatePath("/facturacion");
    return { success: true, message: `Cita actualizada a ${nuevoEstado}.` };
  } catch (error) {
    console.error("Error updating cita:", error);
    return { success: false, message: "Error al actualizar el estado de la cita." };
  }
}
