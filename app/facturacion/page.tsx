import React from 'react';
import Card from '@/components/Card';
import { getFacturacionDashboardData } from '@/app/actions/facturacion';

const formatCLP = (val: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

export default async function FacturacionPage() {
  const { data, error } = await getFacturacionDashboardData();

  if (error || !data) {
    return (
      <div className="card text-center p-8">
        <h2 style={{ color: 'var(--color-critico)' }}>Error cargando datos de facturación</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { stats, facturas } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs financieros */}
      <div className="kpi-grid">
        {/* Ingreso Total del Día */}
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCLP(stats.ingresosHoy)}</span>
            <span className="kpi-label">Ingresos del Día</span>
            <span className="kpi-trend up" style={{ color: '#10b981' }}>Hoy 21/05/2026</span>
          </div>
        </div>

        {/* Consultas */}
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCLP(stats.desgloseHoy.consultas)}</span>
            <span className="kpi-label">Consultas</span>
            <span className="kpi-trend" style={{ color: 'var(--secondary-light)' }}>Cobrado hoy</span>
          </div>
        </div>

        {/* Procedimientos */}
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCLP(stats.desgloseHoy.procedimientos)}</span>
            <span className="kpi-label">Procedimientos</span>
            <span className="kpi-trend" style={{ color: 'var(--secondary-light)' }}>Cobrado hoy</span>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-critico)', color: 'var(--color-critico)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{formatCLP(stats.cuentasPorCobrar)}</span>
            <span className="kpi-label">Cuentas por Cobrar</span>
            <span className="kpi-trend down" style={{ color: 'var(--color-critico)' }}>Pendiente de pago</span>
          </div>
        </div>
      </div>

      {/* Desglose + Tasa de pago */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Tabla de Facturas */}
        <Card title="Últimas Facturas del Día" subtitle="Registro de transacciones de la jornada actual">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
              ({facturas.length} registros)
            </span>
          </div>
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paciente</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-color)' }}>{f.id}</td>
                    <td style={{ fontWeight: 600 }}>{f.pacienteName}</td>
                    <td>
                      <span className={`badge ${
                        f.categoria === 'Consulta' ? 'badge-estable' :
                        f.categoria === 'Procedimiento' ? 'badge-observacion' : 'badge-pendiente'
                      }`}>
                        {f.categoria}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--secondary-color)' }}>{formatCLP(f.monto)}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{f.metodoPago}</td>
                    <td>
                      <span className={`badge ${f.estado === 'PAGADA' ? 'badge-estable' : 'badge-critico'}`}>
                        {f.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <form action={async () => {
                        "use server";
                        // Future implementation for downloading or paying
                      }}>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                        >
                          Ver
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Panel lateral: métricas de pago */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Tasa de Pago" subtitle="Porcentaje de cobro en ventanilla">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Barra visual de tasa */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--secondary-color)' }}>Cobrado</span>
                  <span style={{ color: '#10b981' }}>{stats.tasaPagoVentanilla}</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: stats.tasaPagoVentanilla, height: '100%', backgroundColor: '#10b981', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', textAlign: 'center' }}>
                {stats.totalPagadas} de {stats.totalFacturas} facturas cobradas en su totalidad
              </div>
            </div>
          </Card>

          <Card title="Desglose por Categoría" subtitle="Distribución del ingreso diario">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {[
                { label: 'Consultas', valor: stats.desgloseHoy.consultas, color: '#3b82f6' },
                { label: 'Procedimientos', valor: stats.desgloseHoy.procedimientos, color: '#8b5cf6' },
                { label: 'Laboratorio', valor: stats.desgloseHoy.laboratorio, color: '#10b981' },
              ].map(item => {
                const pct = Math.round((item.valor / stats.ingresosHoy) * 100);
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--secondary-color)' }}>{item.label}</span>
                      <span style={{ color: item.color }}>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
