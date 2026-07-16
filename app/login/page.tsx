"use client";

import { useState, FormEvent } from 'react';
import { login } from '@/app/actions/auth';
import { useTheme } from '@/components/ThemeProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    localStorage.setItem('current_user_id', result.user.id);
    window.location.href = '/';
  };

  return (
    <div className="login-page">
      <div className="login-bg-decoration">
        <div className="login-bg-circle login-bg-circle--1" />
        <div className="login-bg-circle login-bg-circle--2" />
        <div className="login-bg-circle login-bg-circle--3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--primary-color)" />
              <path d="M20 8v24M8 20h24" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2.5" fill="none" />
            </svg>
            <span className="login-logo-text">Silvestre Clinic Manager</span>
          </div>
          <h1 className="login-title">Sistema de Gestión Clínica</h1>
          <p className="login-subtitle">Inicia sesión para acceder al panel</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email" className="login-label">Correo electrónico</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="silvestre@clinica.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">Contraseña</label>
            <div className="login-input-wrapper">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          <p className="login-recover">
            ¿Olvidaste tu contraseña?{' '}
            <button
              type="button"
              className="login-recover-link"
              onClick={() => alert('Funcionalidad de recuperación de cuenta en desarrollo.')}
            >
              Recuperar cuenta
            </button>
          </p>
        </form>

        <div className="login-footer">
          <p>Silvestre Clinic Manager v1.0</p>
        </div>
      </div>
    </div>
  );
}
