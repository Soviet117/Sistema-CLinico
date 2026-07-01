"use client";

import { useTheme } from '@/components/ThemeProvider';

export default function ConfiguracionPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Personalización y administración del sistema</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Apariencia</h3>
        </div>
        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>Modo Oscuro</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--secondary-light)' }}>
                Alternar entre tema claro y oscuro
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: theme === 'dark' ? 'var(--primary-color)' : 'var(--border-color)',
                transition: 'background-color 0.2s ease'
              }}
              aria-label="Alternar modo oscuro"
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: theme === 'dark' ? '27px' : '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Próximamente</h3>
        </div>
        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--secondary-light)', fontSize: '0.9rem' }}>
          <p>- Gestión de usuarios y roles</p>
          <p>- Visibilidad de módulos en el menú</p>
          <p>- Preferencias generales del sistema</p>
        </div>
      </div>
    </div>
  );
}
