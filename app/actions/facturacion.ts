"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Acción para actualizar el precio del catálogo (Administradores)
export async function updatePrecioEspecialidad(id: string, nuevoPrecio: number) {
  try {
    await prisma.especialidad.update({
      where: { id },
      data: { precioBase: nuevoPrecio },
    });
    // Se asume que habrá una ruta /caja o /catalogo
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar precio de especialidad:", error);
    return { success: false, error: "Error al actualizar precio" };
  }
}

// Acción para que el cajero registre el pago de una factura
export async function registrarPagoFactura(facturaId: string, metodoPago: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA") {
  try {
    await prisma.factura.update({
      where: { id: facturaId },
      data: { 
        estadoPago: 'PAGADO', 
        metodoPago: metodoPago 
      },
    });
    revalidatePath("/caja");
    return { success: true };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: "Error al registrar pago de factura" };
  }
}
