"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Obtener título y subtítulo dinámico según la ruta
  let title = "Dashboard General";
  let subtitle = "Resumen de actividad clínica y KPIs";

  if (pathname === '/pacientes') {
    title = "Listado de Pacientes";
    subtitle = "Gestión de pacientes registrados en el sistema";
  } else if (pathname.startsWith('/pacientes/')) {
    title = "Ficha e Historia Clínica";
    subtitle = "Evolución y antecedentes detallados del paciente";
  } else if (pathname === '/nueva-historia') {
    title = "Nueva Historia Clínica";
    subtitle = "Formulario de registro de consulta y examen médico";
  } else if (pathname === '/ejecutivo') {
    title = "Dashboard Ejecutivo (EIS)";
    subtitle = "KPIs estratégicos e indicadores financieros de la clínica";
  } else if (pathname === '/atencion') {
    title = "Sala de Espera (Kanban)";
    subtitle = "Flujo de atención y estado operativo de consultas";
  } else if (pathname === '/agenda') {
    title = "Agenda de Consultas";
    subtitle = "Calendario semanal de citas y disponibilidad médica";
  } else if (pathname === '/facturacion') {
    title = "Módulo de Facturación y Caja";
    subtitle = "Gestión de ingresos, facturación diaria y cuentas por cobrar";
  } else if (pathname === '/medicos') {
    title = "Médicos y Consultorios";
    subtitle = "Planificación del personal y estado de boxes de consulta";
  }

  return (
    <div className="app-wrapper">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="main-content">
        <Header
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          title={title}
          subtitle={subtitle}
        />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
