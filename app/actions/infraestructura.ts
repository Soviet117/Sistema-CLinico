"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMedicos() {
  try {
    const medicos = await prisma.medico.findMany({
      include: {
        user: true,
        especialidad: true,
      },
      orderBy: {
        user: { nombre: 'asc' }
      }
    });
    return { data: medicos, error: null };
  } catch (error) {
    console.error("Error fetching medicos:", error);
    return { data: [], error: "No se pudieron obtener los médicos" };
  }
}

export async function createMedico(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const especialidadId = formData.get("especialidadId") as string;
  const numColegiatura = formData.get("numColegiatura") as string;

  if (!nombre || !email || !especialidadId || !numColegiatura) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    // 1. Validar si ya existe la colegiatura o email
    const existingMedico = await prisma.medico.findUnique({ where: { numColegiatura } });
    if (existingMedico) {
      return { error: "El número de colegiatura ya está registrado" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "El correo electrónico ya está en uso" };
    }

    // 2. Crear User y Medico
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          passwordHash: "dummy-password", // En producción usar bcrypt
          rol: "DOCTOR"
        }
      });

      await tx.medico.create({
        data: {
          especialidadId,
          numColegiatura,
          userId: user.id
        }
      });
    });

    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error creating medico:", error);
    return { error: "Error en el servidor al registrar el médico" };
  }
}

export async function toggleMedicoEstado(medicoId: string, currentState: "ACTIVO" | "INACTIVO") {
  try {
    const newState = currentState === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    await prisma.medico.update({
      where: { id: medicoId },
      data: { estado: newState }
    });
    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error toggling medico state:", error);
    return { error: "No se pudo cambiar el estado del médico" };
  }
}

export async function deleteMedico(medicoId: string) {
  try {
    // Buscar el médico y su user
    const medico = await prisma.medico.findUnique({
      where: { id: medicoId }
    });

    if (!medico) {
      return { error: "Médico no encontrado" };
    }

    // Usamos transacción para borrar ambos
    await prisma.$transaction(async (tx) => {
      await tx.medico.delete({ where: { id: medicoId } });
      await tx.user.delete({ where: { id: medico.userId } });
    });

    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting medico:", error);
    // Si tiene historias clínicas, fallará por onDelete: Restrict
    return { error: "No se puede eliminar un médico con historias clínicas registradas. Desactívelo en su lugar." };
  }
}

export async function getBoxes() {
  try {
    const boxes = await prisma.box.findMany({
      include: {
        especialidad: true,
      },
      orderBy: { nombre: 'asc' }
    });
    return { data: boxes, error: null };
  } catch (error) {
    console.error("Error fetching boxes:", error);
    return { data: [], error: "No se pudieron obtener los consultorios" };
  }
}

export async function createBox(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const tipo = formData.get("tipo") as string;
  const capacidad = parseInt(formData.get("capacidad") as string || "1", 10);
  const especialidadId = formData.get("especialidadId") as string;

  if (!nombre || !tipo || !especialidadId) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    const existing = await prisma.box.findUnique({ where: { nombre } });
    if (existing) {
      return { error: "Ya existe un consultorio con ese nombre" };
    }

    await prisma.box.create({
      data: {
        nombre,
        tipo,
        capacidad,
        estado: "DISPONIBLE",
        especialidadId,
      }
    });

    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error creating box:", error);
    return { error: "Error en el servidor al registrar el consultorio" };
  }
}

export async function deleteBox(boxId: string) {
  try {
    await prisma.box.delete({ where: { id: boxId } });
    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting box:", error);
    return { error: "No se puede eliminar el consultorio si está asociado a citas o historias clínicas." };
  }
}

export async function updateBoxState(boxId: string, newState: "DISPONIBLE" | "OCUPADO" | "MANTENIMIENTO") {
  try {
    await prisma.box.update({
      where: { id: boxId },
      data: { estado: newState }
    });
    revalidatePath("/medicos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating box:", error);
    return { success: false, error: "No se pudo actualizar el estado del consultorio" };
  }
}

export async function createEspecialidad(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const precioBase = parseFloat(formData.get("precioBase") as string || "0");

  if (!nombre || isNaN(precioBase) || precioBase < 0) {
    return { error: "El nombre y un precio base válido son obligatorios" };
  }

  try {
    const existing = await prisma.especialidad.findUnique({ where: { nombre } });
    if (existing) {
      return { error: "Ya existe esta especialidad en el catálogo" };
    }

    await prisma.especialidad.create({
      data: {
        nombre,
        precioBase
      }
    });

    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error creating especialidad:", error);
    return { error: "Error en el servidor al crear la especialidad" };
  }
}

export async function deleteEspecialidad(especialidadId: string) {
  try {
    await prisma.especialidad.delete({ where: { id: especialidadId } });
    revalidatePath("/medicos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting especialidad:", error);
    return { error: "No se puede eliminar la especialidad si tiene médicos o boxes vinculados a ella." };
  }
}

