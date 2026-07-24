import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PatientDetailClient from './PatientDetailClient';
import PatientTabsClient from './PatientTabsClient';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.paciente.findUnique({
    where: { id },
    include: {
      historiasClinicas: {
        orderBy: { fecha: 'desc' },
        include: {
          medico: {
            include: { user: true }
          }
        }
      },
      citas: {
        orderBy: { fechaHoraInicio: 'desc' },
      }
    }
  });

  if (!patient) {
    notFound();
  }

  const historiasClinicasSerializadas = patient.historiasClinicas.map(h => ({
    ...h,
    fecha: h.fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }),
    pulso: h.pulso ? Number(h.pulso) : null,
    temperatura: h.temperatura ? Number(h.temperatura) : null,
    peso: h.peso ? Number(h.peso) : null,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  }));

  const citasSerializadas = patient.citas.map(c => ({
    ...c,
    fechaHora: c.fechaHoraInicio.toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const patientSerialized = {
    ...patient,
    historiasClinicas: historiasClinicasSerializadas,
    citas: citasSerializadas,
  };

  return (
    <>
      <PatientDetailClient patient={patientSerialized} />
      <PatientTabsClient historias={historiasClinicasSerializadas} citas={citasSerializadas} patientName={`${patient.nombre} ${patient.apellido}`} />
    </>
  );
}
