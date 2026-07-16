"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import { getPacientes, getPacienteDetallePDF } from '@/app/actions/pacientes';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  // Paginación
  const [skip, setSkip] = useState(0);
  const take = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounce logic para no bombardear el servidor
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPacientes();
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, genderFilter, skip]);

  // Si cambia un filtro, regresar a la primera página
  const handleFilterChange = (setter: any, value: string) => {
    setter(value);
    setSkip(0);
  };

  const fetchPacientes = () => {
    startTransition(async () => {
      setError(null);
      const res = await getPacientes({
        query: searchTerm,
        estado: statusFilter,
        genero: genderFilter,
        skip,
        take,
      });

      if (res.error) {
        setError(res.error);
        setPacientes([]);
      } else {
        setPacientes(res.data);
        setTotalRecords(res.total);
      }
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('estable')) return 'badge badge-estable';
    if (s.includes('observación') || s.includes('observacion')) return 'badge badge-observacion';
    if (s.includes('crítico') || s.includes('critico')) return 'badge badge-critico';
    return 'badge';
  };

  const handleQuickAction = (action: string, name: string) => {
    alert(`[Simulación] Acción "${action}" iniciada para el paciente: ${name}. Funcionalidad en desarrollo.`);
  };

  const exportarPDF = async (pacienteBase: any) => {
    try {
      const detalle = await getPacienteDetallePDF(pacienteBase.id);
      if (!detalle) throw new Error("No se pudo obtener el detalle");

      const printWindow = window.open('', '', 'height=800,width=800');
      if (!printWindow) {
        alert('Por favor permita las ventanas emergentes (pop-ups) para imprimir el reporte');
        return;
      }

      printWindow.document.write('<html><head><title>Historia Clínica - ' + detalle.nombre + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write('body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #334155; }');
      printWindow.document.write('.header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 2rem; }');
      printWindow.document.write('.title { font-size: 1.5rem; font-weight: bold; color: #0f172a; margin: 0; }');
      printWindow.document.write('.subtitle { font-size: 1rem; color: #64748b; }');
      printWindow.document.write('.section { margin-bottom: 1.5rem; }');
      printWindow.document.write('.section-title { font-size: 1.2rem; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1rem; }');
      printWindow.document.write('.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }');
      printWindow.document.write('.field { margin-bottom: 0.5rem; }');
      printWindow.document.write('.label { font-weight: bold; color: #475569; font-size: 0.875rem; display: block; text-transform: uppercase; letter-spacing: 0.05em; }');
      printWindow.document.write('.value { font-size: 1rem; color: #0f172a; }');
      printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }');
      printWindow.document.write('th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }');
      printWindow.document.write('th { background-color: #f8fafc; font-weight: bold; color: #475569; }');
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');

      printWindow.document.write('<div class="header">');
      printWindow.document.write('<h1 class="title">Historia Clínica Completa</h1>');
      printWindow.document.write('<p class="subtitle">Silvestre Clinic Manager</p>');
      printWindow.document.write('</div>');

      printWindow.document.write('<div class="section">');
      printWindow.document.write('<h2 class="section-title">1. Datos Personales del Paciente</h2>');
      printWindow.document.write('<div class="grid">');
      printWindow.document.write('<div class="field"><span class="label">ID de Paciente</span><span class="value">#' + detalle.id + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Nombre Completo</span><span class="value">' + detalle.nombre + ' ' + detalle.apellido + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Género</span><span class="value">' + detalle.genero + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Tipo de Sangre</span><span class="value">' + (detalle.tipoSangre || 'No especificado') + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Contacto</span><span class="value">' + (detalle.contacto || 'No especificado') + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Antecedentes Médicos</span><span class="value">' + (detalle.antecedentes || 'Sin antecedentes reportados') + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Alergias</span><span class="value">' + (detalle.alergias || 'Ninguna reportada') + '</span></div>');
      printWindow.document.write('<div class="field"><span class="label">Estado Clínico</span><span class="value">' + (detalle.estadoClinico || 'No evaluado') + '</span></div>');
      printWindow.document.write('</div>');
      printWindow.document.write('</div>');

      printWindow.document.write('<div class="section">');
      printWindow.document.write('<h2 class="section-title">2. Historial de Consultas Previas</h2>');

      if (detalle.historiasClinicas && detalle.historiasClinicas.length > 0) {
        detalle.historiasClinicas.forEach((hc: any, index: number) => {
          const date = new Date(hc.fecha).toLocaleString();
          const docName = hc.medico?.user?.nombre ? 'Dr. ' + hc.medico.user.nombre : 'No asignado';
          
          printWindow.document.write('<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; page-break-inside: avoid;">');
          printWindow.document.write('<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">');
          printWindow.document.write('<h3 style="margin: 0; font-size: 1.1rem; color: #0f172a;">Consulta ' + (detalle.historiasClinicas.length - index) + '</h3>');
          printWindow.document.write('<div style="text-align: right;"><span style="font-weight: bold; font-size: 0.95rem;">' + date + '</span><br/><span style="color: #64748b; font-size: 0.85rem;">' + docName + '</span></div>');
          printWindow.document.write('</div>');

          printWindow.document.write('<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background-color: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #f1f5f9;">');
          printWindow.document.write('<div><span class="label" style="font-size: 0.75rem;">Presión</span><span class="value" style="font-weight: 500;">' + (hc.presion || 'N/A') + '</span></div>');
          printWindow.document.write('<div><span class="label" style="font-size: 0.75rem;">Pulso</span><span class="value" style="font-weight: 500;">' + (hc.pulso ? hc.pulso + ' lpm' : 'N/A') + '</span></div>');
          printWindow.document.write('<div><span class="label" style="font-size: 0.75rem;">Temperatura</span><span class="value" style="font-weight: 500;">' + (hc.temperatura ? hc.temperatura + ' °C' : 'N/A') + '</span></div>');
          printWindow.document.write('<div><span class="label" style="font-size: 0.75rem;">Peso</span><span class="value" style="font-weight: 500;">' + (hc.peso ? hc.peso + ' kg' : 'N/A') + '</span></div>');
          printWindow.document.write('</div>');

          printWindow.document.write('<div style="margin-bottom: 1rem;">');
          printWindow.document.write('<span class="label">Motivo de Consulta</span>');
          printWindow.document.write('<p style="margin: 0.25rem 0 0 0; color: #1e293b; font-size: 0.95rem;">' + (hc.motivo || 'No especificado') + '</p>');
          printWindow.document.write('</div>');

          printWindow.document.write('<div style="margin-bottom: 1rem;">');
          printWindow.document.write('<span class="label">Síntomas</span>');
          printWindow.document.write('<p style="margin: 0.25rem 0 0 0; color: #1e293b; font-size: 0.95rem;">' + (hc.sintomas || 'No especificados') + '</p>');
          printWindow.document.write('</div>');

          printWindow.document.write('<div style="margin-bottom: 1rem;">');
          printWindow.document.write('<span class="label">Diagnóstico</span>');
          printWindow.document.write('<p style="margin: 0.25rem 0 0 0; color: #0f172a; font-weight: 600; font-size: 1rem;">' + (hc.diagnostico || 'No especificado') + '</p>');
          printWindow.document.write('</div>');

          printWindow.document.write('<div>');
          printWindow.document.write('<span class="label">Plan de Tratamiento</span>');
          printWindow.document.write('<p style="margin: 0.25rem 0 0 0; color: #1e293b; font-size: 0.95rem; white-space: pre-wrap;">' + (hc.planTratamiento || 'No especificado') + '</p>');
          printWindow.document.write('</div>');

          printWindow.document.write('</div>');
        });
      } else {
        printWindow.document.write('<p style="color: #64748b; font-style: italic;">No hay consultas registradas para este paciente.</p>');
      }
      printWindow.document.write('</div>');

      printWindow.document.write('<div class="section" style="margin-top: 3rem; text-align: center; color: #94a3b8; font-size: 0.8rem;">');
      printWindow.document.write('<p>Generado el ' + new Date().toLocaleString() + '</p>');
      printWindow.document.write('<p>Este documento es confidencial y de uso exclusivo médico.</p>');
      printWindow.document.write('</div>');

      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (e) {
      alert("Ocurrió un error al generar el PDF del historial clínico.");
    }
  };

  const totalPages = Math.ceil(totalRecords / take) || 1;
  const currentPage = Math.floor(skip / take) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Cabecera y Controles de Búsqueda */}
      <Card>
        <div className="search-filter-row" style={{ margin: 0 }}>
          {/* Buscador */}
          <div className="search-box-wrapper">
            <svg className="search-box-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              placeholder="Buscar por nombre, id o contacto..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="filter-group">
            {/* Filtro de Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label htmlFor="status-select" className="detail-label" style={{ marginBottom: 0 }}>Estado:</label>
              <select
                id="status-select"
                className="form-control"
                style={{ padding: '0.4rem 0.75rem', width: '150px', fontSize: '0.8rem' }}
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="Estable">Estable</option>
                <option value="En Observación">En Observación</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>

            {/* Filtro de Género */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '1rem' }}>
              <label htmlFor="gender-select" className="detail-label" style={{ marginBottom: 0 }}>Género:</label>
              <select
                id="gender-select"
                className="form-control"
                style={{ padding: '0.4rem 0.75rem', width: '130px', fontSize: '0.8rem' }}
                value={genderFilter}
                onChange={(e) => handleFilterChange(setGenderFilter, e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Pacientes */}
      <Card title={`Pacientes Registrados (${totalRecords})`} subtitle="Gestión e historial clínico completo de los usuarios">

        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ position: 'relative', minHeight: '300px' }}>
          {isPending && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.6)', zIndex: 10,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Cargando datos...</div>
            </div>
          )}

          {pacientes.length === 0 && !isPending && !error ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--secondary-light)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>No se encontraron pacientes</p>
              <p style={{ fontSize: '0.85rem' }}>Prueba modificando los filtros de búsqueda o registra uno nuevo.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Paciente</th>
                    <th>Edad / Género</th>
                    <th>Contacto</th>
                    <th>Última Consulta</th>
                    <th>Estado Clínico</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id}>
                      <td style={{ fontWeight: 700, color: 'var(--secondary-light)' }}>#{paciente.id.substring(0, 4)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: paciente.genero === 'Masculino' ? '#e0f2fe' : '#fce7f3',
                            color: paciente.genero === 'Masculino' ? '#0369a1' : '#be185d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {paciente.nombre.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{paciente.nombre}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)' }}>Sangre: {paciente.tipoSangre}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{paciente.edad} años</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-light)' }}>{paciente.genero}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{paciente.contacto}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{paciente.ultimaConsulta}</td>
                      <td>
                        <span className={getStatusBadgeClass(paciente.estado)}>
                          {paciente.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell" style={{ justifyContent: 'center' }}>
                          <Link
                            href={`/pacientes/${paciente.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.35rem 0.75rem' }}
                            title="Ver Historia del Paciente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                          </Link>

                          <Link
                            href={`/nueva-historia?patientId=${paciente.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem' }}
                            title="Nueva Consulta"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          </Link>

                          <button
                            onClick={() => exportarPDF(paciente)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem', color: 'var(--color-observacion)' }}
                            title="Exportar Historia a PDF"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalRecords > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--secondary-light)' }}>
              Mostrando {pacientes.length} de {totalRecords} pacientes (Página {currentPage} de {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={skip === 0 || isPending}
                onClick={() => setSkip(Math.max(0, skip - take))}
              >
                Anterior
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={skip + take >= totalRecords || isPending}
                onClick={() => setSkip(skip + take)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
