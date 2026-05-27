"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCitasToday, completarCita } from '@/app/actions/citas';

interface PatientStatusState {
  id: string; // Cita ID
  pacienteId: string;
  pacienteNombre: string;
  horaLlegada: string;
  medicoAsignado: string;
  motivo: string;
  estado: 'ESPERA' | 'CONSULTA' | 'ATENDIDO' | 'FACTURADO';
}

const COLUMNAS = [
  {
    id: 'ESPERA' as const,
    label: 'En Espera',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    ),
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    id: 'CONSULTA' as const,
    label: 'En Consulta',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
    ),
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'ATENDIDO' as const,
    label: 'Atendido',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    ),
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#a7f3d0',
  },
  {
    id: 'FACTURADO' as const,
    label: 'Facturado',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    color: '#8b5cf6',
    bg: '#faf5ff',
    border: '#ddd6fe',
  },
];

export default function AtencionPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<PatientStatusState[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch today's appointments and sync with localStorage states
  const syncAppointmentsWithQueue = useCallback(async () => {
    try {
      const res = await getCitasToday();
      if (res.data) {
        // Load tracked intermediate states from localStorage
        const storedStatesRaw = localStorage.getItem('waiting-room-states-v1');
        const storedStates: Record<string, PatientStatusState['estado']> = storedStatesRaw
          ? JSON.parse(storedStatesRaw)
          : {};

        const mapped: PatientStatusState[] = (res.data as any[]).map(cita => {
          const cDate = new Date(cita.fechaHora);
          const timeStr = cDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const medicoName = cita.medico?.user?.nombre || 'No asignado';

          let estado: PatientStatusState['estado'] = 'ESPERA';

          if (cita.estado === 'COMPLETADA') {
            estado = 'FACTURADO';
          } else if (storedStates[cita.id]) {
            // Restore intermediate states from localStorage
            estado = storedStates[cita.id];
          }

          return {
            id: cita.id,
            pacienteId: cita.pacienteId,
            pacienteNombre: `${cita.paciente.nombre} ${cita.paciente.apellido}`,
            horaLlegada: timeStr,
            medicoAsignado: medicoName,
            motivo: cita.motivo,
            estado
          };
        });

        setPacientes(mapped);
      }
    } catch (error) {
      console.error("Error syncing queue:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncAppointmentsWithQueue();
  }, [syncAppointmentsWithQueue]);

  // Advance a patient through the Kanban column stages
  const avanzar = async (id: string, currentEstado: PatientStatusState['estado']) => {
    const orden: PatientStatusState['estado'][] = ['ESPERA', 'CONSULTA', 'ATENDIDO', 'FACTURADO'];
    const idx = orden.indexOf(currentEstado);
    if (idx >= orden.length - 1) return;

    const nextEstado = orden[idx + 1];

    if (nextEstado === 'FACTURADO') {
      // 1. Finalize in database first
      const confirmBilling = window.confirm("¿Confirmar facturación y finalización de la atención médica?");
      if (!confirmBilling) return;

      setActionLoadingId(id);
      try {
        const res = await completarCita(id);
        if (res.error) {
          alert(res.error);
          return;
        }

        // 2. Success: Update local state & clear from localStorage intermediate states
        setPacientes(prev =>
          prev.map(p => (p.id === id ? { ...p, estado: 'FACTURADO' } : p))
        );

        const storedStatesRaw = localStorage.getItem('waiting-room-states-v1');
        if (storedStatesRaw) {
          const storedStates = JSON.parse(storedStatesRaw);
          delete storedStates[id];
          localStorage.setItem('waiting-room-states-v1', JSON.stringify(storedStates));
        }

        // Sync with backend to ensure perfect consistency
        syncAppointmentsWithQueue();
      } catch (err) {
        console.error("Error finalizing appointment:", err);
        alert("Ocurrió un error al facturar la cita.");
      } finally {
        setActionLoadingId(null);
      }
    } else {
      // Intermediate states: ESPERA -> CONSULTA -> ATENDIDO (Save locally to persist on refresh)
      setPacientes(prev =>
        prev.map(p => {
          if (p.id !== id) return p;

          // Save state change in localStorage
          const storedStatesRaw = localStorage.getItem('waiting-room-states-v1');
          const storedStates = storedStatesRaw ? JSON.parse(storedStatesRaw) : {};
          storedStates[id] = nextEstado;
          localStorage.setItem('waiting-room-states-v1', JSON.stringify(storedStates));

          return { ...p, estado: nextEstado };
        })
      );
    }
  };

  // View Clinical History (Navigate to patient profile detail)
  const verHistoria = (pacienteId: string) => {
    router.push(`/pacientes/${pacienteId}`);
  };

  // Stats calculation
  const totalEspera = pacientes.filter(p => p.estado === 'ESPERA').length;
  const totalConsulta = pacientes.filter(p => p.estado === 'CONSULTA').length;
  const totalAtendidos = pacientes.filter(p => p.estado === 'ATENDIDO').length;
  const totalFacturados = pacientes.filter(p => p.estado === 'FACTURADO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Summary KPI Cards row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { count: totalEspera, label: 'En Espera', bg: '#fffbeb', color: '#f59e0b', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
          { count: totalConsulta, label: 'En Consulta', bg: '#eff6ff', color: '#3b82f6', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
          { count: totalAtendidos, label: 'Atendidos', bg: '#f0fdf4', color: '#10b981', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> },
          { count: totalFacturados, label: 'Facturados', bg: '#faf5ff', color: '#8b5cf6', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> }
        ].map((item, idx) => (
          <div key={idx} className="card" style={{ flex: 1, minWidth: '180px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary-color)', lineHeight: 1 }}>{item.count}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', fontWeight: 600 }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '1rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <div className="logo-icon" style={{ animation: 'spin 1.5s linear infinite', backgroundColor: 'transparent', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', width: '40px', height: '40px' }} />
          <span style={{ color: 'var(--secondary-light)', fontWeight: 600, fontSize: '0.9rem' }}>Cargando sala de espera...</span>
        </div>
      ) : (
        <div className="kanban-board">
          {COLUMNAS.map(col => {
            const tarjetas = pacientes.filter(p => p.estado === col.id);
            return (
              <div key={col.id} className="kanban-column" style={{ borderTop: `3.5px solid ${col.color}`, backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>

                {/* Column Header */}
                <div className="kanban-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="kanban-column-title" style={{ color: col.color, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.icon}
                    {col.label}
                  </span>
                  <span className="kanban-column-count" style={{ backgroundColor: col.bg, color: col.color, border: `1px solid ${col.border}`, fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                    {tarjetas.length}
                  </span>
                </div>

                {/* Card List container */}
                <div className="kanban-card-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {tarjetas.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      color: 'var(--secondary-light)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(248, 250, 252, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      Sin pacientes en esta etapa
                    </div>
                  )}
                  {tarjetas.map(p => {
                    const isCardLoading = actionLoadingId === p.id;
                    return (
                      <div
                        key={p.id}
                        className="kanban-card"
                        style={{
                          borderLeft: `3.5px solid ${col.color}`,
                          backgroundColor: 'white',
                          border: '1px solid var(--border-color)',
                          borderLeftWidth: '3.5px',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          boxShadow: 'var(--shadow-sm)',
                          opacity: isCardLoading ? 0.6 : 1,
                          pointerEvents: isCardLoading ? 'none' : 'auto',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        {/* Patient Name */}
                        <div className="kanban-card-patient" style={{ fontWeight: 750, fontSize: '0.875rem', color: 'var(--secondary-color)' }}>
                          {p.pacienteNombre}
                        </div>

                        {/* Meta Info */}
                        <div className="kanban-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.725rem', color: 'var(--secondary-light)', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Hora programada: {p.horaLlegada}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            Médico: {p.medicoAsignado}
                          </span>
                          <span style={{ fontStyle: 'italic', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            💬 {p.motivo}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="kanban-card-actions" style={{ display: 'flex', gap: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.6rem', marginTop: '0.2rem', justifyContent: 'space-between' }}>
                          {col.id !== 'FACTURADO' ? (
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', fontWeight: 700 }}
                              onClick={() => avanzar(p.id, p.estado)}
                            >
                              {col.id === 'ESPERA' ? '🩺 Iniciar Consulta' : col.id === 'CONSULTA' ? '✅ Finalizar' : '💳 Facturar'}
                            </button>
                          ) : (
                            <span className="badge badge-completada" style={{ fontSize: '0.65rem', padding: '2px 8px', fontWeight: 700 }}>
                              Cita Billed
                            </span>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', fontWeight: 700 }}
                            onClick={() => verHistoria(p.pacienteId)}
                          >
                            📂 Ver Historia
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Styled Anim Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
