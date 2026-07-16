"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getRolePermissions } from '@/app/actions/usuarios';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODULE_KEY_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/ejecutivo': 'ejecutivo',
  '/atencion': 'atencion',
  '/agenda': 'agenda',
  '/facturacion': 'facturacion',
  '/medicos': 'medicos',
  '/pacientes': 'pacientes',
  '/nueva-historia': 'nueva-historia',
  '/ejecutivo/reportes': 'reportes',
  '/configuracion': 'configuracion',
};

const MODULE_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
  dashboard: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    label: 'Dashboard General'
  },
  ejecutivo: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    label: 'Dashboard Ejecutivo'
  },
  atencion: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    label: 'Sala de Espera'
  },
  agenda: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    label: 'Agenda Semanal'
  },
  facturacion: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    label: 'Facturacion'
  },
  medicos: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    label: 'Medicos y Boxes'
  },
  pacientes: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: 'Pacientes'
  },
  nuevaHistoria: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    label: 'Nueva Historia'
  },
  reportes: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    label: 'Reportes'
  },
  configuracion: {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    label: 'Configuracion'
  },
};

const MENU_ITEMS: { path: string; moduleKey: string; moduleId: string }[] = [
  { path: '/', moduleKey: 'dashboard', moduleId: 'dashboard' },
  { path: '/ejecutivo', moduleKey: 'ejecutivo', moduleId: 'ejecutivo' },
  { path: '/atencion', moduleKey: 'atencion', moduleId: 'atencion' },
  { path: '/agenda', moduleKey: 'agenda', moduleId: 'agenda' },
  { path: '/facturacion', moduleKey: 'facturacion', moduleId: 'facturacion' },
  { path: '/medicos', moduleKey: 'medicos', moduleId: 'medicos' },
  { path: '/pacientes', moduleKey: 'pacientes', moduleId: 'pacientes' },
  { path: '/nueva-historia', moduleKey: 'nueva-historia', moduleId: 'nuevaHistoria' },
  { path: '/ejecutivo/reportes', moduleKey: 'reportes', moduleId: 'reportes' },
  { path: '/configuracion', moduleKey: 'configuracion', moduleId: 'configuracion' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [allowedModules, setAllowedModules] = useState<string[]>([]);

  useEffect(() => {
    if (user?.rol) {
      getRolePermissions(user.rol).then(setAllowedModules);
    }
  }, [user?.rol]);

  const userInitials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const filteredItems = MENU_ITEMS.filter(item => {
    if (item.moduleKey === 'configuracion' && user?.rol !== 'ADMIN') return false;
    return allowedModules.includes(item.moduleKey);
  });

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--primary-color)" />
              <path d="M20 8v24M8 20h24" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2.5" fill="none" />
            </svg>
            <span className="logo-text">Silvestre Clinic Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            const mod = MODULE_LABELS[item.moduleId] || { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: item.moduleKey };
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{mod.icon}</span>
                <span className="nav-label">{mod.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userInitials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.nombre || 'Usuario'}</span>
              <span className="sidebar-user-role">{user?.rol || ''}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
