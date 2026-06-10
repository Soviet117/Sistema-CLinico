"use server";

import { prisma } from "@/lib/prisma";

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  medicoId?: string;
  estadoCita?: string;
  estadoPago?: string;
  especialidadId?: string;
}

export async function getReporteCitas(filtros: FiltrosReporte) {
  try {
    const whereClause: any = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereClause.fechaHoraInicio = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    } else if (filtros.fechaInicio) {
      whereClause.fechaHoraInicio = { gte: new Date(filtros.fechaInicio) };
    }

    if (filtros.medicoId && filtros.medicoId !== "ALL") {
      whereClause.medicoId = filtros.medicoId;
    }

    if (filtros.estadoCita && filtros.estadoCita !== "ALL") {
      whereClause.estado = filtros.estadoCita;
    }

    const citas = await prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        medico: {
          include: { user: { select: { nombre: true } }, especialidad: { select: { nombre: true } } }
        },
      },
      orderBy: { fechaHoraInicio: 'desc' },
    });

    const totalCitas = citas.length;
    const citasCompletadas = citas.filter(c => c.estado === 'COMPLETADA').length;
    const citasCanceladas = citas.filter(c => c.estado === 'CANCELADA').length;

    const tasaCancelacion = totalCitas > 0 ? ((citasCanceladas / totalCitas) * 100).toFixed(1) : 0;

    const mappedData = citas.map(c => ({
      id: c.id,
      fecha: c.fechaHoraInicio.toLocaleDateString(),
      hora: c.fechaHoraInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paciente: `${c.paciente.nombre} ${c.paciente.apellido}`,
      medico: c.medico.user?.nombre || "N/A",
      especialidad: c.medico.especialidad?.nombre || "N/A",
      estado: c.estado,
      motivo: c.motivo,
    }));

    return {
      data: mappedData,
      kpis: {
        total: totalCitas,
        completadas: citasCompletadas,
        canceladas: citasCanceladas,
        tasaCancelacion: `${tasaCancelacion}%`
      },
      error: null
    };

  } catch (error) {
    console.error("Error fetching reporte citas:", error);
    return { data: [], kpis: null, error: "Error obteniendo reporte de citas" };
  }
}

export async function getReporteHistorias(filtros: FiltrosReporte) {
  try {
    const whereClause: any = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereClause.fecha = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    }

    if (filtros.medicoId && filtros.medicoId !== "ALL") {
      whereClause.medicoId = filtros.medicoId;
    }

    const historias = await prisma.historiaClinica.findMany({
      where: whereClause,
      include: {
        paciente: { select: { nombre: true, apellido: true } },
        medico: { include: { user: { select: { nombre: true } } } },
      },
      orderBy: { fecha: 'desc' },
    });

    const totalAtenciones = historias.length;

    const mappedData = historias.map(h => ({
      id: h.id,
      fecha: h.fecha.toLocaleDateString(),
      paciente: `${h.paciente.nombre} ${h.paciente.apellido}`,
      medico: h.medico.user?.nombre || "N/A",
      motivo: h.motivo,
      diagnostico: h.diagnostico || "Sin diagnóstico",
    }));

    return {
      data: mappedData,
      kpis: {
        totalAtenciones
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching reporte historias:", error);
    return { data: [], kpis: null, error: "Error obteniendo reporte de historias" };
  }
}

export async function getReporteFinanciero(filtros: FiltrosReporte) {
  try {
    const whereClause: any = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      whereClause.fechaEmision = {
        gte: new Date(filtros.fechaInicio),
        lte: new Date(filtros.fechaFin),
      };
    }

    if (filtros.estadoPago && filtros.estadoPago !== "ALL") {
      whereClause.estadoPago = filtros.estadoPago;
    }

    const facturas = await prisma.factura.findMany({
      where: whereClause,
      include: {
        paciente: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaEmision: 'desc' },
    });

    const ingresosTotales = facturas
      .filter(f => f.estadoPago === 'PAGADO')
      .reduce((sum, f) => sum + Number(f.montoTotal), 0);

    const montosPendientes = facturas
      .filter(f => f.estadoPago === 'PENDIENTE')
      .reduce((sum, f) => sum + Number(f.montoTotal), 0);

    const mappedData = facturas.map(f => ({
      id: f.id,
      fecha: f.fechaEmision.toLocaleDateString(),
      paciente: `${f.paciente.nombre} ${f.paciente.apellido}`,
      monto: `$${Number(f.montoTotal).toFixed(2)}`,
      estadoPago: f.estadoPago,
      metodoPago: f.metodoPago || "N/A",
      categoria: f.categoria,
    }));

    return {
      data: mappedData,
      kpis: {
        ingresosTotales: `$${ingresosTotales.toFixed(2)}`,
        montosPendientes: `$${montosPendientes.toFixed(2)}`,
        totalFacturas: facturas.length
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching reporte financiero:", error);
    return { data: [], kpis: null, error: "Error obteniendo reporte financiero" };
  }
}

// Opciones para los filtros
export async function getOpcionesFiltros() {
  try {
    const medicos = await prisma.medico.findMany({
      include: { user: { select: { nombre: true } } }
    });

    return {
      medicos: medicos.map(m => ({ value: m.id, label: m.user?.nombre || "Desconocido" }))
    };
  } catch (e) {
    return { medicos: [] };
  }
}
