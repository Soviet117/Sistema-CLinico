import React from 'react';
import Card from '@/components/Card';

export const dynamic = 'force-dynamic';
import { DonutChart, HorizontalBarChart, RevenueExecutiveChart } from '@/components/ClinicalCharts';
import { getExecutiveKPIs, getRevenueEvolution, getSpecialtyProfitability, getMedicoEfficiency, getBoxOccupancy } from '@/app/actions/dashboard';

export default async function DashboardEjecutivoPage() {
  const [kpi, revenue, rentabilidad, medicos, boxes] = await Promise.all([
    getExecutiveKPIs(),
    getRevenueEvolution(),
    getSpecialtyProfitability(),
    getMedicoEfficiency(),
    getBoxOccupancy()
  ]);

  // Transform box occupancy data into DonutChart's OccupancyDataPoint format
  const totalBoxes = boxes.data.length;
  const ocupados = boxes.data.filter(b => b.estadoReal === 'OCUPADO' || b.estadoReal === 'MANTENIMIENTO').length;
  const disponibles = totalBoxes - ocupados;
  const ocupacionDonut = totalBoxes > 0 ? [
    { nombre: 'Ocupado', porcentaje: Math.round((ocupados / totalBoxes) * 100), color: 'var(--primary-color)' },
    { nombre: 'Disponible', porcentaje: Math.round((disponibles / totalBoxes) * 100), color: '#e2e8f0' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* 1. KPIs Estratégicos */}
      <section className="kpi-grid" aria-label="Indicadores estratégicos">
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-estable)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.ingresoMensual}</span>
            <span className="kpi-label">Ingresos del Mes</span>
            <span className="kpi-trend up" style={{ color: 'var(--color-estable)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              Facturación real
            </span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.pacientesUnicos}</span>
            <span className="kpi-label">Pacientes Registrados</span>
            <span className="kpi-trend up">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              Total en BD
            </span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-critico)', color: 'var(--color-critico)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.cancelacionesRate}</span>
            <span className="kpi-label">Tasa Cancelación</span>
            <span className="kpi-trend down" style={{ color: 'var(--color-estable)' }}>
              Mes actual
            </span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-observacion)', color: 'var(--color-observacion)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.retencionRate}</span>
            <span className="kpi-label">Retención de Pacientes</span>
            <span className="kpi-trend up" style={{ color: 'var(--color-observacion)' }}>
              Con citas vs registrados
            </span>
          </div>
        </div>
      </section>

      {/* 2. Gráficas Estratégicas */}
      <section className="charts-row" aria-label="Análisis estratégico de finanzas y espacio">
        <div style={{ flex: 1.5 }}>
          <Card
            title="Evolución de Ingresos (Últimos 6 Meses)"
            subtitle="Facturación histórica acumulada por la clínica en millones de pesos"
          >
            <div style={{ marginTop: '1rem', height: '220px' }}>
              <RevenueExecutiveChart data={revenue} />
            </div>
          </Card>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card
            title="Ocupación Física de Boxes"
            subtitle="Porcentaje de uso de consultorios hoy"
          >
            <div style={{ height: '140px', display: 'flex', alignItems: 'center' }}>
              <DonutChart data={ocupacionDonut} />
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Rentabilidad Especialidades & Eficiencia Médica */}
      <section className="grid-2" aria-label="Rendimiento del personal y servicios">
        <Card
          title="Top Especialidades Más Rentables"
          subtitle="Distribución de la facturación según la especialidad de consulta"
        >
          <div style={{ marginTop: '0.5rem' }}>
            <HorizontalBarChart data={rentabilidad} />
          </div>
        </Card>

        <Card
          title="Eficiencia de Atención Médica"
          subtitle="Tiempo promedio de consulta y pacientes atendidos"
        >
          <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th style={{ textAlign: 'center' }}>Pacientes Atendidos</th>
                  <th style={{ textAlign: 'center' }}>Tiempo Promedio</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((medico, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{medico.nombre}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{medico.especialidad}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{medico.pacientesAtendidos}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: medico.tiempoPromedio <= 18 ? 'var(--color-estable)' : 'var(--color-observacion)'
                        }}
                      >
                        {medico.tiempoPromedio} min
                      </span>
                    </td>
                  </tr>
                ))}
                {medicos.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary-light)' }}>
                      No hay datos de atención médica registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

    </div>
  );
}
