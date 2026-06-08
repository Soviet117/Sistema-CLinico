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
    revalidatePath("/facturacion");
    return { success: true };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: "Error al registrar pago de factura" };
  }
}

// Obtener todas las facturas del día y estadísticas
export async function getFacturacionDashboardData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const facturas = await prisma.factura.findMany({
      where: {
        createdAt: {
          gte: today,
        }
      },
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    let ingresosHoy = 0;
    let cuentasPorCobrar = 0;
    let desglose = { consultas: 0, procedimientos: 0, laboratorio: 0 };
    let facturasPagadas = 0;

    const formattedFacturas = facturas.map(f => {
      const montoTotal = Number(f.montoTotal) || 0;
      const montoAdelanto = Number(f.montoAdelanto) || 0;
      
      // Calculate earnings and receivables based on payment state and advance payments
      if (f.estadoPago === 'PAGADA') {
        ingresosHoy += montoTotal;
        facturasPagadas++;
      } else if (f.estadoPago === 'PENDIENTE') {
        ingresosHoy += montoAdelanto; // Adelantos cobrados hoy
        cuentasPorCobrar += (montoTotal - montoAdelanto);
      }

      // Desglose
      if (f.categoria === 'Consulta') desglose.consultas += (f.estadoPago === 'PAGADA' ? montoTotal : montoAdelanto);
      else if (f.categoria === 'Procedimiento') desglose.procedimientos += (f.estadoPago === 'PAGADA' ? montoTotal : montoAdelanto);
      else desglose.laboratorio += (f.estadoPago === 'PAGADA' ? montoTotal : montoAdelanto);

      return {
        id: f.id,
        pacienteName: `${f.paciente.nombre} ${f.paciente.apellido}`,
        categoria: f.categoria,
        montoTotal,
        montoAdelanto,
        metodoPago: f.metodoPago || 'N/A',
        estado: f.estadoPago,
      };
    });

    const tasaPago = facturas.length > 0 ? Math.round((facturasPagadas / facturas.length) * 100) : 0;

    return {
      success: true,
      data: {
        facturas: formattedFacturas,
        stats: {
          ingresosHoy,
          cuentasPorCobrar,
          desgloseHoy: desglose,
          tasaPagoVentanilla: `${tasaPago}%`,
          totalPagadas: facturasPagadas,
          totalFacturas: facturas.length
        }
      }
    };

  } catch (error) {
    console.error("Error al obtener datos de facturación:", error);
    return { success: false, data: null, error: "No se pudieron cargar los datos" };
  }
}
