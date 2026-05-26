"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getCitasForWeek, getPacientesList, cancelarCita, createCita } from '@/app/actions/citas';
import { getMedicos, getBoxes } from '@/app/actions/infraestructura';

interface PacienteData {
  id: string;
  nombre: string;
  apellido: string;
  contacto?: string | null;
}

interface MedicoData {
  id: string;
  especialidad: string;
  numColegiatura: string;
  user: {
    nombre: string;
  };
}

interface BoxData {
  id: string;
  nombre: string;
  tipo: string;
}

interface CitaData {
  id: string;
  fechaHora: Date | string;
  motivo: string;
  estado: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    contacto?: string | null;
  };
  medico?: {
    id: string;
    especialidad: string;
    user: {
      nombre: string;
    };
  } | null;
  box?: {
    id: string;
    nombre: string;
  } | null;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Helper to get the Monday of the current week from a given Date
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  // adjust when day is sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function AgendaPage() {
  // Calendar State
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');

  // Data State
  const [citas, setCitas] = useState<CitaData[]>([]);
  const [medicos, setMedicos] = useState<MedicoData[]>([]);
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [pacientes, setPacientes] = useState<PacienteData[]>([]);

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: string } | null>(null);
  const [selectedCita, setSelectedCita] = useState<CitaData | null>(null);

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    pacienteId: '',
    medicoId: '',
    boxId: '',
    motivo: ''
  });

  // Calculate the dates for Lunes - Viernes based on the current Monday
  const weekDays = React.useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(currentMonday.getTime());
      day.setDate(currentMonday.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentMonday]);

  // Load static resources once (doctors, boxes, patients)
  useEffect(() => {
    async function loadResources() {
      try {
        const [medicosRes, boxesRes, pacientesRes] = await Promise.all([
          getMedicos(),
          getBoxes(),
          getPacientesList()
        ]);

        if (medicosRes.data) setMedicos(medicosRes.data as any);
        if (boxesRes.data) setBoxes(boxesRes.data as any);
        if (pacientesRes.data) setPacientes(pacientesRes.data as any);
      } catch (err) {
        console.error("Error loading resources:", err);
      }
    }
    loadResources();
  }, []);

  // Fetch appointments whenever the week or the selected doctor changes
  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCitasForWeek(currentMonday.toISOString(), selectedDoctorId);
      if (res.data) {
        setCitas(res.data as any);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [currentMonday, selectedDoctorId]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(currentMonday.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(currentMonday.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Check if an appointment matches a given day and hour
  const findCitaForSlot = (day: Date, hourStr: string): CitaData | undefined => {
    return citas.find(c => {
      const cDate = new Date(c.fechaHora);
      const sameDay = cDate.getFullYear() === day.getFullYear() &&
        cDate.getMonth() === day.getMonth() &&
        cDate.getDate() === day.getDate();

      const cTime = cDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return sameDay && cTime.startsWith(hourStr.substring(0, 2));
    });
  };

  // Grid Cell Click Actions
  const handleCellClick = (day: Date, hourStr: string) => {
    // 13:00 is a standard rest block
    if (hourStr === '13:00') {
      alert('El bloque de las 13:00 corresponde a la colación y pausa médica.');
      return;
    }

    const existingCita = findCitaForSlot(day, hourStr);
    if (existingCita) {
      setSelectedCita(existingCita);
      setIsDetailModalOpen(true);
      return;
    }

    // Pre-fill booking form
    setSelectedSlot({ date: day, hour: hourStr });
    setFormData({
      pacienteId: '',
      medicoId: selectedDoctorId !== 'ALL' ? selectedDoctorId : (medicos[0]?.id || ''),
      boxId: boxes[0]?.id || '',
      motivo: ''
    });
    setPatientSearch('');
    setErrorMessage(null);
    setIsBookingModalOpen(true);
  };

  // Submit Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacienteId) {
      setErrorMessage("Por favor, seleccione un paciente registrado.");
      return;
    }
    if (!formData.medicoId) {
      setErrorMessage("Por favor, seleccione un médico.");
      return;
    }
    if (!formData.boxId) {
      setErrorMessage("Por favor, asigne un consultorio/box.");
      return;
    }
    if (formData.motivo.length < 5) {
      setErrorMessage("Por favor, detalle el motivo (mínimo 5 caracteres).");
      return;
    }
    if (!selectedSlot) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      // Calculate target Date
      const targetDate = new Date(selectedSlot.date);
      const [h, m] = selectedSlot.hour.split(':');
      targetDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      const fData = new FormData();
      fData.append("pacienteId", formData.pacienteId);
      fData.append("medicoId", formData.medicoId);
      fData.append("boxId", formData.boxId);
      fData.append("motivo", formData.motivo);
      fData.append("fechaHora", targetDate.toISOString());

      const res = await createCita(fData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        // Success
        setIsBookingModalOpen(false);
        fetchCitas();
      }
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMessage("Ocurrió un error inesperado al guardar la cita.");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Appointment
  const handleCancelCita = async () => {
    if (!selectedCita) return;
    const confirmCancel = window.confirm("¿Está seguro de que desea cancelar esta cita?");
    if (!confirmCancel) return;

    setActionLoading(true);
    try {
      const res = await cancelarCita(selectedCita.id);
      if (res.error) {
        alert(res.error);
      } else {
        setIsDetailModalOpen(false);
        fetchCitas();
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Error al intentar cancelar la cita.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Patients
  const filteredPacientes = pacientes.filter(p =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.contacto && p.contacto.includes(patientSearch))
  );

  // Stats
  const totalDisponibles = React.useMemo(() => {
    let count = 0;
    weekDays.forEach(day => {
      HORAS.forEach(hour => {
        if (hour !== '13:00' && !findCitaForSlot(day, hour)) {
          count++;
        }
      });
    });
    return count;
  }, [weekDays, citas]);

  const totalOcupados = citas.length;
  const totalPausas = 5; // 1 per day

  // Format date range title
  const dateRangeTitle = React.useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[4];
    if (!start || !end) return '';

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const format = new Intl.DateTimeFormat('es-ES', options);

    return `Semana del ${format.format(start)} al ${format.format(end)}, ${start.getFullYear()}`;
  }, [weekDays]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Filters and Navigation Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left Side: Week Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevWeek} title="Semana Anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Ant.
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleCurrentWeek}>
            Hoy / Actual
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleNextWeek} title="Semana Siguiente">
            Sig.
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0 0.5rem', color: 'var(--secondary-color)' }}>
            {dateRangeTitle}
          </h2>
        </div>

        {/* Right Side: Doctor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-light)' }}>
            Médico:
          </span>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{
              padding: '0.4rem 2rem 0.4rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">🔍 Todos los Médicos</option>
            {medicos.map(med => (
              <option key={med.id} value={med.id}>
                {med.user.nombre} ({med.especialidad})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Disponible', count: totalDisponibles, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: '2px solid #10b981' },
            { label: 'Ocupado', count: totalOcupados, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '2px solid #ef4444' },
            { label: 'Pausa', count: totalPausas, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: '2px solid #f59e0b' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: item.bg, border: item.border, display: 'inline-block' }} />
              <span style={{ color: 'var(--secondary-color)' }}>{item.label} ({item.count})</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--secondary-light)', fontWeight: 600 }}>
          💡 Clic en celdas verdes (Libres) para reservar
        </div>
      </div>

      {/* Calendar Grid Wrapper */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '1rem' }}>
            <div className="logo-icon" style={{ animation: 'spin 1.5s linear infinite', backgroundColor: 'transparent', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', width: '40px', height: '40px' }} />
            <span style={{ color: 'var(--secondary-light)', fontWeight: 600, fontSize: '0.9rem' }}>Cargando agenda de citas...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, minmax(150px, 1fr))', minWidth: '850px' }}>

              {/* Header Row */}
              <div className="calendar-header-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>Hora</div>
              {weekDays.map((day, idx) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div
                    key={idx}
                    className="calendar-header-cell"
                    style={{
                      backgroundColor: isToday ? 'var(--primary-light)' : 'var(--bg-app)',
                      color: isToday ? 'var(--primary-color)' : 'var(--secondary-color)',
                      borderBottom: isToday ? '3px solid var(--primary-color)' : '2px solid var(--border-color)',
                      fontWeight: 800
                    }}
                  >
                    <div>{DIAS[idx]}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                      {day.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                );
              })}

              {/* Hours Grid */}
              {HORAS.map(hora => (
                <React.Fragment key={hora}>
                  {/* Hour Column */}
                  <div className="calendar-hour-cell">{hora}</div>

                  {/* Day Columns */}
                  {weekDays.map((day, dIdx) => {
                    const existingCita = findCitaForSlot(day, hora);
                    const isPause = hora === '13:00';

                    let cellClass = 'calendar-cell-available';
                    let label = 'Libre';
                    let info = '';

                    if (isPause) {
                      cellClass = 'calendar-cell-pause';
                      label = 'Pausa';
                      info = 'Colación del Staff';
                    } else if (existingCita) {
                      cellClass = 'calendar-cell-occupied';
                      label = 'Reservado';
                      info = `${existingCita.paciente.nombre} ${existingCita.paciente.apellido}`;
                    }

                    const cellId = `${dIdx}-${hora}`;

                    return (
                      <div
                        key={cellId}
                        className={`calendar-cell ${cellClass}`}
                        style={{
                          cursor: isPause ? 'not-allowed' : 'pointer',
                          opacity: hoveredCell === cellId ? 0.85 : 1,
                          height: '75px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleCellClick(day, hora)}
                        onMouseEnter={() => setHoveredCell(cellId)}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={existingCita ? `Paciente: ${info}\nMotivo: ${existingCita.motivo}\nBox: ${existingCita.box?.nombre || '-'}` : isPause ? 'Pausa' : 'Disponible para agendar'}
                      >
                        <span className="calendar-cell-status" style={{ fontSize: '0.625rem' }}>{label}</span>
                        {info && (
                          <span
                            className="calendar-cell-info"
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              color: 'var(--secondary-color)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '2px',
                              textAlign: 'center'
                            }}
                          >
                            {info}
                          </span>
                        )}
                        {existingCita?.box && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--secondary-light)', textAlign: 'center', fontWeight: 600 }}>
                            📍 {existingCita.box.nombre}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', border: '1px solid rgba(2,132,199,0.2)', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        <span>Las citas agendadas son verificadas contra conflictos de horario (Overbooking) de consultorio de manera automática.</span>
      </div>

      {/* ========================================================= */}
      {/* 1. MODAL: AGENDAR CITA                                    */}
      {/* ========================================================= */}
      {isBookingModalOpen && selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            width: '90%',
            maxWidth: '520px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>
                  Agendar Cita Médica
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                  📅 {selectedSlot.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedSlot.hour} hs
                </span>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-light)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-critico)',
                color: 'var(--color-critico)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Paciente Registrado (Search dropdown) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary-light)' }}>
                  Paciente Registrado *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o teléfono..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                    }}
                  />
                  {formData.pacienteId && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'var(--bg-estable)',
                      color: 'var(--color-estable)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Seleccionado
                    </span>
                  )}
                </div>

                {/* Dropdown list */}
                {isPatientDropdownOpen && patientSearch.trim() !== '' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    zIndex: 10000,
                    marginTop: '4px'
                  }}>
                    {filteredPacientes.map(pac => (
                      <div
                        key={pac.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, pacienteId: pac.id }));
                          setPatientSearch(`${pac.nombre} ${pac.apellido}`);
                          setIsPatientDropdownOpen(false);
                        }}
                        style={{
                          padding: '0.6rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.825rem',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-app)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{pac.nombre} {pac.apellido}</span>
                        {pac.contacto && <span style={{ fontSize: '0.7rem', color: 'var(--secondary-light)' }}>📞 {pac.contacto}</span>}
                      </div>
                    ))}
                    {filteredPacientes.length === 0 && (
                      <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--secondary-light)', textAlign: 'center' }}>
                        No se encontraron pacientes registrados.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Medico Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary-light)' }}>
                  Médico Tratante *
                </label>
                <select
                  value={formData.medicoId}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicoId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="" disabled>Seleccione un médico</option>
                  {medicos.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.user.nombre} ({med.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Box (Consultorio) Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary-light)' }}>
                  Consultorio Asignado (Box) *
                </label>
                <select
                  value={formData.boxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, boxId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="" disabled>Seleccione un consultorio</option>
                  {boxes.map(box => (
                    <option key={box.id} value={box.id}>
                      {box.nombre} ({box.tipo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Motivo Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary-light)' }}>
                  Motivo de la Cita *
                </label>
                <textarea
                  placeholder="Detalle el motivo o síntomas principales del paciente..."
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ minWidth: '120px' }}
                >
                  {actionLoading ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL: DETALLES DE CITA / CANCELAR CITA                 */}
      {/* ========================================================= */}
      {isDetailModalOpen && selectedCita && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            width: '90%',
            maxWidth: '480px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>
                  Detalles de la Cita
                </h3>
                <span className="badge badge-pendiente" style={{ marginTop: '4px' }}>
                  {selectedCita.estado}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-light)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              {/* Paciente */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Paciente
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary-color)' }}>
                  👤 {selectedCita.paciente.nombre} {selectedCita.paciente.apellido}
                </span>
                {selectedCita.paciente.contacto && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', display: 'block', marginLeft: '1.1rem' }}>
                    📞 {selectedCita.paciente.contacto}
                  </span>
                )}
              </div>

              {/* Medico */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Médico Asignado
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                  🩺 {selectedCita.medico ? selectedCita.medico.user.nombre : 'No asignado'}
                </span>
                {selectedCita.medico?.especialidad && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', display: 'block', marginLeft: '1.2rem', fontWeight: 600 }}>
                    {selectedCita.medico.especialidad}
                  </span>
                )}
              </div>

              {/* Box */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Consultorio / Box
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--secondary-color)' }}>
                  📍 {selectedCita.box ? selectedCita.box.nombre : 'No asignado'}
                </span>
              </div>

              {/* Fecha y Hora */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Fecha y Hora
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  ⏰ {new Date(selectedCita.fechaHora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} hs
                </span>
              </div>

              {/* Motivo */}
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Motivo de la Cita
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', margin: 0, fontWeight: 500 }}>
                  {selectedCita.motivo}
                </p>
              </div>

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelCita}
                disabled={actionLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                Cancelar Cita
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Anim Keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
