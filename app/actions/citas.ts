"use server";

import { prisma } from "@/lib/prisma";
import { CitaSchema } from "@/lib/validations/citas";
import { revalidatePath } from "next/cache";

export async function getCitasForWeek(startDateStr: string, medicoId?: string) {
  try {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    // Calcular el fin de la semana (Viernes 23:59:59)
    // Asumiendo que startDate es Lunes, sumamos 5 días para obtener el Sábado 00:00:00 (límite exclusivo)
    const endDate = new Date(startDate.getTime());
    endDate.setDate(startDate.getDate() + 5);

    const whereClause: any = {
      fechaHora: {
        gte: startDate,
        lt: endDate
      },
      estado: { in: ['PROGRAMADA', 'COMPLETADA'] }
    };

    if (medicoId && medicoId !== 'ALL') {
      whereClause.medicoId = medicoId;
    }

    const citas = await prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: true,
        medico: {
          include: {
            user: true
          }
        },
        box: true
      },
      orderBy: {
        fechaHora: 'asc'
      }
    });

    return { data: citas, error: null };
  } catch (error) {
    console.error("Error fetching citas:", error);
    return { data: [], error: "No se pudieron obtener las citas" };
  }
}

export async function getPacientesList() {
  try {
    const pacientes = await prisma.paciente.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        contacto: true,
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    return { data: pacientes, error: null };
  } catch (error) {
    console.error("Error fetching pacientes list:", error);
    return { data: [], error: "No se pudieron obtener los pacientes" };
  }
}

export async function cancelarCita(citaId: string) {
  try {
    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'CANCELADA' }
    });
    
    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling cita:", error);
    return { error: "No se pudo cancelar la cita" };
  }
}

export async function createCita(formData: FormData) {
  const rawData = {
    pacienteId: formData.get("pacienteId"),
    medicoId: formData.get("medicoId"),
    boxId: formData.get("boxId"),
    motivo: formData.get("motivo"),
    fechaHora: formData.get("fechaHora") as string,
  };

  const parsed = CitaSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: "Datos inválidos", fields: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const targetDate = new Date(data.fechaHora);

  try {
    // 1. Verificación de Overbooking (Validación cruzada con la BD)
    // Buscamos si el Box ya tiene una cita en ese rango de tiempo (ej. +/- 30 mins)
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const startRange = new Date(targetDate.getTime() - thirtyMinutesInMs);
    const endRange = new Date(targetDate.getTime() + thirtyMinutesInMs);

    const conflictingCita = await prisma.cita.findFirst({
      where: {
        boxId: data.boxId,
        estado: { in: ['PROGRAMADA', 'COMPLETADA'] }, // Omitimos las canceladas
        fechaHora: {
          gte: startRange,
          lt: endRange,
        }
      }
    });

    if (conflictingCita) {
      return { 
        error: "Overbooking: Este Consultorio (Box) ya está reservado o en uso cerca de esa hora.",
        conflictingCita
      };
    }

    // Resolver usuarioId dinámicamente para evitar violaciones de clave foránea
    let usuarioId = "TODO-CURRENT-USER";
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      usuarioId = firstUser.id;
    } else {
      const defaultUser = await prisma.user.create({
        data: {
          email: "esteban.peralta@example.com",
          passwordHash: "dummy-password",
          rol: "DOCTOR",
          nombre: "Dr. Esteban Peralta"
        }
      });
      usuarioId = defaultUser.id;
    }

    // 2. Insertar cita
    const newCita = await prisma.cita.create({
      data: {
        pacienteId: data.pacienteId,
        medicoId: data.medicoId,
        boxId: data.boxId,
        usuarioId: usuarioId,
        motivo: data.motivo,
        fechaHora: targetDate,
        estado: 'PROGRAMADA',
      }
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    
    return { success: true, data: newCita };
  } catch (error) {
    console.error("Error creating cita:", error);
    return { error: "Ocurrió un error en el servidor al agendar la cita." };
  }
}

export async function getCitasToday() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const citas = await prisma.cita.findMany({
      where: {
        fechaHora: {
          gte: startOfDay,
          lt: endOfDay
        },
        estado: { in: ['PROGRAMADA', 'COMPLETADA'] }
      },
      include: {
        paciente: true,
        medico: {
          include: {
            user: true
          }
        },
        box: true
      },
      orderBy: {
        fechaHora: 'asc'
      }
    });

    return { data: citas, error: null };
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    return { data: [], error: "No se pudieron obtener las citas de hoy" };
  }
}

export async function completarCita(citaId: string) {
  try {
    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'COMPLETADA' }
    });

    revalidatePath("/atencion");
    revalidatePath("/agenda");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error completing appointment:", error);
    return { error: "No se pudo marcar la cita como completada" };
  }
}


