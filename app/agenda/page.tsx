import React from 'react';
import { prisma } from '@/lib/prisma';
import AgendaCalendario from '@/components/AgendaCalendario';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  // Configurar las fechas de la semana actual
  const today = new Date();
  const currentDay = today.getDay() || 7; // Lunes = 1, Domingo = 7
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 13); // Ampliar a 14 días para cubrir días movidos a la próxima semana
  sunday.setHours(23, 59, 59, 999);

  // Consultas Paralelas Optimizadas a la Base de Datos
  const [citas, medicos, boxes, pacientes] = await Promise.all([
    prisma.cita.findMany({
      where: {
        fechaHoraInicio: { gte: monday },
        fechaHoraFin: { lte: sunday },
        estado: { not: 'CANCELADA' }
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        medico: { select: { id: true, user: { select: { nombre: true } } } },
        box: { select: { id: true, nombre: true } },
        factura: { select: { montoTotal: true, montoAdelanto: true, estadoPago: true, estadoAdelanto: true } }
      },
      orderBy: { fechaHoraInicio: 'asc' }
    }),
    prisma.medico.findMany({
      where: { estado: 'ACTIVO' },
      include: { user: { select: { nombre: true } } }
    }),
    prisma.box.findMany({
      where: { estado: 'DISPONIBLE' }
    }),
    prisma.paciente.findMany({
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: 'asc' }
    })
  ]);

  const citasSerialized = citas.map(cita => ({
    ...cita,
    factura: cita.factura ? {
      ...cita.factura,
      montoTotal: Number(cita.factura.montoTotal),
      montoAdelanto: Number(cita.factura.montoAdelanto),
    } : null,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-title-container" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h1>Agenda Semanal Integral</h1>
        <p>Gestión de disponibilidad de consultorios (Boxes) y médicos</p>
      </div>

      <AgendaCalendario 
        citasIniciales={citasSerialized}
        medicos={medicos}
        boxes={boxes}
        pacientes={pacientes}
      />
    </div>
  );
}
