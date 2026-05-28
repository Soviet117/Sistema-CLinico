import React from 'react';
import { getMedicos, getBoxes } from '@/app/actions/infraestructura';
import { prisma } from '@/lib/prisma';
import MedicosManager from './MedicosManager';

export default async function MedicosPage() {
  const medicosRes = await getMedicos();
  const boxesRes = await getBoxes();

  // Obtener especialidades del catálogo para poblar los formularios
  const especialidades = await prisma.especialidad.findMany({
    orderBy: { nombre: 'asc' }
  });

  // Mapear tipos correctos para la interfaz
  const medicos = (medicosRes.data || []).map((m: any) => ({
    id: m.id,
    especialidad: m.especialidad?.nombre || "Sin Especialidad",
    numColegiatura: m.numColegiatura,
    estado: m.estado,
    user: {
      nombre: m.user?.nombre || "Médico Sin Nombre",
      email: m.user?.email || "",
    }
  }));

  const boxes = (boxesRes.data || []).map((b: any) => ({
    id: b.id,
    nombre: b.nombre,
    capacidad: b.capacidad,
    tipo: `${b.tipo} (${b.especialidad?.nombre || 'Sin Especialidad'})`,
    estado: b.estado
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary-color)', margin: '0 0 0.25rem 0' }}>
          Gestión de Personal e Infraestructura
        </h1>
        <p style={{ color: 'var(--secondary-light)', margin: 0, fontSize: '0.9rem' }}>
          Administre el equipo médico de la clínica y la asignación de consultorios físicos (boxes).
        </p>
      </div>

      <MedicosManager medicos={medicos} boxes={boxes} especialidades={especialidades.map(e => ({
        id: e.id,
        nombre: e.nombre,
        precioBase: Number(e.precioBase)
      }))} />
    </div>
  );
}
