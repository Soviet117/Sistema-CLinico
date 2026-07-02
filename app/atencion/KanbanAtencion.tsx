"use client";

import React, { useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { updateEstadoCita } from '@/app/actions/agenda';

type CitaKanban = {
  id: string;
  pacienteId: string;
  medicoId: string;
  pacienteNombre: string;
  medicoAsignado: string;
  motivo: string;
  estado: string;
  rawInicioISO: string;
  saldoPendiente: number;
};

interface Props {
  citasIniciales: CitaKanban[];
}

const COLUMNAS = [
  {
    id: 'PROGRAMADA',
    label: 'En Espera',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    ),
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    id: 'EN_CURSO',
    label: 'En Consulta',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
    ),
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'COMPLETADA',
    label: 'Atendido',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    ),
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#a7f3d0',
  },
  {
    id: 'PENDIENTE_PAGO',
    label: 'Pendiente de Pago',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    ),
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  }
];

export default function KanbanAtencion({ citasIniciales }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (isoString: string) => {
    if (!mounted) return '...';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [optimisticCitas, addOptimisticCita] = useOptimistic(
    citasIniciales,
    (state, { id, nuevoEstado }: { id: string, nuevoEstado: string }) =>
      state.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c)
  );

  const [isPending, startTransition] = useTransition();

  const avanzar = (cita: CitaKanban) => {
    let nuevoEstado = '';
    if (cita.estado === 'PROGRAMADA') nuevoEstado = 'EN_CURSO';
    else if (cita.estado === 'EN_CURSO') nuevoEstado = 'COMPLETADA';
    else return;

    startTransition(async () => {
      addOptimisticCita({ id: cita.id, nuevoEstado });
      const res = await updateEstadoCita(cita.id, nuevoEstado);
      if (!res.success) {
        alert(res.message);
        router.refresh();
        return;
      }

      if (nuevoEstado === 'EN_CURSO') {
        router.push(`/nueva-historia?patientId=${cita.pacienteId}&medicoId=${cita.medicoId}&citaId=${cita.id}`);
      }
    });
  };

  const retroceder = (id: string, estadoActual: string) => {
    let nuevoEstado = '';
    if (estadoActual === 'COMPLETADA') nuevoEstado = 'EN_CURSO';
    else if (estadoActual === 'PENDIENTE_PAGO') nuevoEstado = 'EN_CURSO';
    else if (estadoActual === 'EN_CURSO') nuevoEstado = 'PROGRAMADA';
    else return;

    startTransition(async () => {
      addOptimisticCita({ id, nuevoEstado });
      await updateEstadoCita(id, nuevoEstado);
    });
  };

  const verHistoria = (nombre: string) => {
    alert(`Ver Historia Clínica de: ${nombre}\n(Funcionalidad en desarrollo)`);
  };

  const totalEspera = optimisticCitas.filter(p => p.estado === 'PROGRAMADA').length;
  const totalConsulta = optimisticCitas.filter(p => p.estado === 'EN_CURSO').length;
  const totalAtendido = optimisticCitas.filter(p => p.estado === 'COMPLETADA').length;
  const totalPendientePago = optimisticCitas.filter(p => p.estado === 'PENDIENTE_PAGO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Resumen de estado */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '180px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-color)', lineHeight: 1 }}>{totalEspera}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', fontWeight: 500 }}>En Espera</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '180px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-color)', lineHeight: 1 }}>{totalConsulta}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', fontWeight: 500 }}>En Consulta</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '180px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-color)', lineHeight: 1 }}>{totalAtendido}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', fontWeight: 500 }}>Atendidos Hoy</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '180px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-color)', lineHeight: 1 }}>{totalPendientePago}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', fontWeight: 500 }}>Por Cobrar</div>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="kanban-board">
        {COLUMNAS.map(col => {
          const tarjetas = optimisticCitas.filter(p => p.estado === col.id).sort((a, b) => new Date(a.rawInicioISO).getTime() - new Date(b.rawInicioISO).getTime());

          return (
            <div key={col.id} className="kanban-column" style={{ borderTop: `3px solid ${col.color}` }}>
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>
                  {col.icon}
                  {col.label}
                </span>
                <span className="kanban-column-count" style={{ backgroundColor: col.bg, color: col.color, border: `1px solid ${col.border}` }}>
                  {tarjetas.length}
                </span>
              </div>

              <div className="kanban-card-list">
                {tarjetas.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: 'var(--secondary-light)',
                    fontSize: '0.8rem',
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    Sin pacientes
                  </div>
                )}
                {tarjetas.map(p => (
                  <div key={p.id} className="kanban-card" style={{ borderLeft: `3px solid ${col.color}` }}>
                    <div className="kanban-card-patient">{p.pacienteNombre}</div>
                    <div className="kanban-card-meta">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '3px' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        Hora Citada: {formatTime(p.rawInicioISO)}
                      </span>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '3px' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        {p.medicoAsignado}
                      </span>
                      <span style={{ fontStyle: 'italic' }}>{p.motivo}</span>
                      {p.estado === 'PENDIENTE_PAGO' && (
                        <span style={{ color: '#dc2626', fontWeight: 800 }}>
                          Saldo: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(p.saldoPendiente)}
                        </span>
                      )}
                    </div>
                    <div className="kanban-card-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {col.id !== 'PROGRAMADA' && col.id !== 'COMPLETADA' && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', flex: 1, color: 'var(--secondary-light)', borderColor: 'var(--border-color)' }}
                          onClick={() => retroceder(p.id, p.estado)}
                          disabled={isPending}
                        >
                          Deshacer
                        </button>
                      )}

                      {col.id === 'PENDIENTE_PAGO' ? (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', flex: 2, backgroundColor: col.color, borderColor: col.color }}
                          onClick={() => router.push('/facturacion')}
                          disabled={isPending}
                        >
                          Ir a Caja
                        </button>
                      ) : col.id !== 'COMPLETADA' && (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', flex: 2, backgroundColor: col.color, borderColor: col.color }}
                          onClick={() => avanzar(p)}
                          disabled={isPending}
                        >
                          {col.id === 'PROGRAMADA' ? 'Iniciar Consulta' : 'Finalizar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
