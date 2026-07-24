import React from 'react';
import { prisma } from '@/lib/prisma';
import AgendaCalendario from '@/components/AgendaCalendario';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const today = new Date();
  const currentDay = today.getDay() || 7;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 13);
  sunday.setHours(23, 59, 59, 999);

  const [citas, medicos, especialidades, pacientes] = await Promise.all([
    prisma.cita.findMany({
      where: {
        fechaHoraInicio: { gte: monday },
        fechaHoraFin: { lte: sunday },
        estado: { not: 'CANCELADA' }
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        medico: { select: { id: true, user: { select: { nombre: true } } } },
        box: { select: { id: true, nombre: true, especialidad: { select: { id: true, nombre: true } } } },
        factura: { select: { montoTotal: true, estadoPago: true } }
      },
      orderBy: { fechaHoraInicio: 'asc' }
    }),
    prisma.medico.findMany({
      where: { estado: 'ACTIVO' },
      include: { user: { select: { nombre: true } } }
    }),
    prisma.especialidad.findMany({
      include: {
        boxes: {
          where: { estado: 'DISPONIBLE' },
          select: { id: true, nombre: true }
        }
      },
      orderBy: { nombre: 'asc' }
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
    } : null,
  }));

  const especialidadesSerialized = especialidades.map(esp => ({
    ...esp,
    precioBase: Number(esp.precioBase),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-title-container" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h1>Agenda Semanal Integral</h1>
        <p>Gestión de disponibilidad de especialidades y médicos</p>
      </div>

      <AgendaCalendario 
        citasIniciales={citasSerialized}
        medicos={medicos}
        especialidades={especialidadesSerialized}
        pacientes={pacientes}
      />
    </div>
  );
}
