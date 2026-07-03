export interface ExamenMock {
  fecha: string;
  tipo: string;
  resultado: string;
  estado: 'Normal' | 'Alterado';
}

export interface RecetaMock {
  medicamento: string;
  dosis: string;
  duracion: string;
}

export interface HistoriaClinicaMock {
  id: number;
  fecha: string;
  motivo: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  presionArt?: string;
  pulso?: number;
  temperatura?: number;
  peso?: number;
  medico: string;
}

export interface PacienteMock {
  id: number;
  nombre: string;
  edad: number;
  genero: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoSangre: string;
  alergias: string;
  diabetes: boolean;
  hipertension: boolean;
  antecedentes: string;
  ultimaConsulta: string;
  estado: 'Estable' | 'En Observación' | 'Crítico';
  historiasClinicas: HistoriaClinicaMock[];
  examenes: ExamenMock[];
  recetas: RecetaMock[];
}

export interface CitaMock {
  id: number;
  pacienteNombre: string;
  pacienteId: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  medico: string;
}

export interface EspecialidadStat {
  nombre: string;
  cantidad: number;
  color: string;
}

export interface EvolucionMensual {
  mes: string;
  pacientes: number;
}

// ----------------------------------------------------
// NUEVOS TIPOS MIS + EIS
// ----------------------------------------------------
export interface KanbanPaciente {
  id: number;
  pacienteNombre: string;
  horaLlegada: string;
  medicoAsignado: string;
  motivo: string;
  estado: 'ESPERA' | 'CONSULTA' | 'ATENDIDO' | 'FACTURADO';
}

export interface CeldaCalendario {
  id: string;
  dia: string; // Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
  hora: string; // 08:00 a 18:00
  estado: 'Disponible' | 'Ocupado' | 'Pausa médica';
  info?: string;
}

export interface FacturaMock {
  id: string;
  pacienteName: string;
  monto: number;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  estado: 'PAGADA' | 'PENDIENTE';
  fecha: string;
  categoria: 'Consulta' | 'Procedimiento' | 'Laboratorio';
}

export interface IngresoMensual {
  mes: string;
  monto: number;
}

export interface RentabilidadEspecialidad {
  especialidad: string;
  ingresos: number;
  color: string;
}

export interface OcupacionConsultorio {
  nombre: string;
  porcentaje: number;
  color: string;
}

export interface EficienciaMedico {
  nombre: string;
  especialidad: string;
  tiempoPromedio: number; // en minutos
  pacientesAtendidos: number;
  satisfaccion: number; // escala 1-5
}

export interface MedicoMock {
  id: number;
  nombre: string;
  especialidad: string;
  consultorio: string;
  turno: 'Mañana' | 'Tarde';
  estado: 'Activo' | 'Inactivo';
}

export interface ConsultorioMock {
  id: number;
  nombre: string;
  estado: 'Libre' | 'Ocupado';
  medicoActual?: string;
}

// ----------------------------------------------------
// DATOS MOCK EXPANDIDOS
// ----------------------------------------------------

export const mockPacientes: PacienteMock[] = [
  {
    id: 1,
    nombre: "Alejandro Silva Torres",
    edad: 45,
    genero: "Masculino",
    email: "alejandro.silva@email.com",
    telefono: "+56 9 8765 4321",
    direccion: "Av. Las Condes 8900, Santiago",
    tipoSangre: "O+",
    alergias: "Penicilina, Polen",
    diabetes: false,
    hipertension: true,
    antecedentes: "Hipertensión arterial diagnosticada en 2021. Padre con antecedentes de infarto agudo de miocardio.",
    ultimaConsulta: "2026-05-18",
    estado: "Estable",
    historiasClinicas: [
      {
        id: 101,
        fecha: "2026-05-18",
        motivo: "Control de rutina por hipertensión arterial",
        sintomas: "Cefalea leve ocasional por las mañanas. No refiere dolor precordial ni disnea.",
        diagnostico: "Hipertensión esencial controlada. Fatiga leve por estrés laboral.",
        tratamiento: "Continuar con Losartán 50mg cada 12 hrs. Reducir consumo de sodio. Control de presión diario.",
        presionArt: "125/82 mmHg",
        pulso: 72,
        temperatura: 36.5,
        peso: 82.4,
        medico: "Dra. Sofía Mendoza (Cardiología)"
      },
      {
        id: 102,
        fecha: "2026-02-10",
        motivo: "Palpitaciones y mareos",
        sintomas: "Refiere latidos rápidos tras situaciones de estrés en el trabajo. Leve inestabilidad al levantarse rápido.",
        diagnostico: "Palpitaciones secundarias a estrés emocional y cafeína.",
        tratamiento: "Disminuir consumo de café a 1 taza al día. Practicar técnicas de relajación. Mantener Losartán.",
        presionArt: "135/88 mmHg",
        pulso: 88,
        temperatura: 36.6,
        peso: 83.1,
        medico: "Dra. Sofía Mendoza (Cardiología)"
      }
    ],
    examenes: [
      { fecha: "2026-05-15", tipo: "Perfil Lipídico", resultado: "Colesterol Total: 210 mg/dL (Alto), Triglicéridos: 165 mg/dL", estado: "Alterado" },
      { fecha: "2026-05-15", tipo: "Electrocardiograma (ECG)", resultado: "Ritmo sinusal normal. Sin signos de isquemia aguda.", estado: "Normal" },
      { fecha: "2026-02-08", tipo: "Hemograma Completo", resultado: "Glóbulos blancos: 6500/uL, Hematocrito: 44%, Plaquetas: 240k", estado: "Normal" }
    ],
    recetas: [
      { medicamento: "Losartán Potásico 50mg", dosis: "1 tableta cada 12 horas, vía oral", duracion: "Permanente (3 meses)" },
      { medicamento: "Atorvastatina 20mg", dosis: "1 tableta cada noche antes de dormir", duracion: "30 días" }
    ]
  },
  {
    id: 2,
    nombre: "Camila Rojas Valenzuela",
    edad: 28,
    genero: "Femenino",
    email: "camila.rojas@email.com",
    telefono: "+56 9 1234 5678",
    direccion: "Providencia 1245, Dpto 402, Santiago",
    tipoSangre: "A-",
    alergias: "Ninguna conocida",
    diabetes: false,
    hipertension: false,
    antecedentes: "Asma bronquial en la infancia, sin crisis recientes. Apendicectomía en 2018.",
    ultimaConsulta: "2026-05-20",
    estado: "En Observación",
    historiasClinicas: [
      {
        id: 201,
        fecha: "2026-05-20",
        motivo: "Dificultad respiratoria y tos seca persistente",
        sintomas: "Disnea de esfuerzo y sibilancias audibles tras resfriado común hace 4 días. Tos empeora en la noche.",
        diagnostico: "Exacerbación asmática leve desencadenada por infección viral respiratoria.",
        tratamiento: "Salbutamol 2 inhalaciones cada 6 hrs por 5 días. Budesonida 200mcg cada 12 hrs. Reposo relativo.",
        presionArt: "115/70 mmHg",
        pulso: 80,
        temperatura: 37.2,
        peso: 58.2,
        medico: "Dr. Carlos Valdivia (Broncopulmonar)"
      }
    ],
    examenes: [
      { fecha: "2026-05-20", tipo: "Espirometría de Control", resultado: "FVC: 85%, FEV1: 72% (Obstrucción leve reversible)", estado: "Alterado" },
      { fecha: "2026-05-20", tipo: "Radiografía de Tórax", resultado: "Campos pulmonares hiperinsuflados. Sin condensaciones focales.", estado: "Normal" }
    ],
    recetas: [
      { medicamento: "Salbutamol Inhalador 100mcg", dosis: "2 inhalaciones ante crisis o cada 6 horas", duracion: "5 días" },
      { medicamento: "Budesonida Inhalador 200mcg", dosis: "2 inhalaciones cada 12 horas", duracion: "60 días" }
    ]
  },
  {
    id: 3,
    nombre: "María Loreto Gómez",
    edad: 67,
    genero: "Femenino",
    email: "marialoreto.g@email.com",
    telefono: "+56 9 7654 3210",
    direccion: "Los Leones 450, Providencia",
    tipoSangre: "AB+",
    alergias: "Sulfamidas, Aspirina",
    diabetes: true,
    hipertension: true,
    antecedentes: "Diabetes Mellitus tipo 2 diagnosticada hace 10 años. Artrosis de rodilla derecha.",
    ultimaConsulta: "2026-05-15",
    estado: "Estable",
    historiasClinicas: [
      {
        id: 301,
        fecha: "2026-05-15",
        motivo: "Revisión de exámenes y dolor de rodilla",
        sintomas: "Dolor en rodilla derecha al caminar trayectos largos. Hemoglobina glicosilada dentro del rango esperado.",
        diagnostico: "Diabetes Mellitus Tipo 2 controlada con fármacos. Gonartrosis grado II derecha.",
        tratamiento: "Mantener Metformina 850mg post-almuerzo y cena. Celecoxib 200mg diario en caso de dolor severo. Derivar a Kinesiología.",
        presionArt: "120/78 mmHg",
        pulso: 68,
        temperatura: 36.3,
        peso: 71.5,
        medico: "Dr. Ricardo Bascuñán (Geriatría/Medicina General)"
      },
      {
        id: 302,
        fecha: "2025-11-20",
        motivo: "Control trimestral de diabetes",
        sintomas: "Parestesias leves en dedos del pie izquierdo durante la noche. Polidipsia moderada.",
        diagnostico: "Diabetes Mellitus con control subóptimo. Sospecha de neuropatía diabética incipiente.",
        tratamiento: "Ajustar Metformina a 1000mg en la cena. Solicitar perfil lipídico y microalbuminuria. Cuidado estricto de pies.",
        presionArt: "130/80 mmHg",
        pulso: 74,
        temperatura: 36.4,
        peso: 73.0,
        medico: "Dr. Ricardo Bascuñán (Geriatría/Medicina General)"
      }
    ],
    examenes: [
      { fecha: "2026-05-10", tipo: "Hemoglobina Glicosilada (HbA1c)", resultado: "HbA1c: 6.8% (Buen control para rango de edad)", estado: "Normal" },
      { fecha: "2026-05-10", tipo: "Creatinina en Sangre", resultado: "Creatinina: 0.9 mg/dL, Filtración glomerular: 72 mL/min", estado: "Normal" },
      { fecha: "2025-11-18", tipo: "Microalbuminuria en Orina", resultado: "Microalbúmina: 45 mg/24h (Microalbuminuria leve)", estado: "Alterado" }
    ],
    recetas: [
      { medicamento: "Metformina Clorhidrato 850mg", dosis: "1 tableta después del almuerzo y 1 después de la cena", duracion: "Permanente" },
      { medicamento: "Celecoxib 200mg", dosis: "1 tableta al día ante dolor severo de rodilla", duracion: "15 días (SOS)" }
    ]
  },
  {
    id: 4,
    nombre: "Joaquín Martínez Castro",
    edad: 12,
    genero: "Masculino",
    email: "padre.martinez@email.com",
    telefono: "+56 9 9988 7766",
    direccion: "Vitacura 3400, Vitacura",
    tipoSangre: "O-",
    alergias: "Proteína de leche de vaca (superada), Polvo de habitación",
    diabetes: false,
    hipertension: false,
    antecedentes: "Nacido de término. Desarrollo psicomotor adecuado. Vacunas al día.",
    ultimaConsulta: "2026-05-10",
    estado: "Estable",
    historiasClinicas: [
      {
        id: 401,
        fecha: "2026-05-10",
        motivo: "Control de niño sano y evaluación de crecimiento",
        sintomas: "Sintomatología ausente. Paciente activo, realiza actividad física escolar sin problemas.",
        diagnostico: "Desarrollo pondoestatural adecuado para la edad. Curva de crecimiento normal.",
        tratamiento: "Alimentación equilibrada. Limitar pantallas. Fomentar deportes. Próximo control en un año.",
        presionArt: "105/62 mmHg",
        pulso: 82,
        temperatura: 36.7,
        peso: 41.2,
        medico: "Dra. Carolina Ríos (Pediatría)"
      }
    ],
    examenes: [
      { fecha: "2026-05-08", tipo: "Orina Completa", resultado: "Densidad: 1.018, Proteínas: Negativo, Glucosa: Negativo", estado: "Normal" }
    ],
    recetas: [
      { medicamento: "Vitamina D3 800 UI", dosis: "4 gotas al día con el desayuno", duracion: "60 días" }
    ]
  },
  {
    id: 5,
    nombre: "Roberto Muñoz Fuentes",
    edad: 53,
    genero: "Masculino",
    email: "roberto.munoz@email.com",
    telefono: "+56 9 5544 3322",
    direccion: "Gran Avenida 5400, San Miguel",
    tipoSangre: "B+",
    alergias: "Ninguna conocida",
    diabetes: true,
    hipertension: true,
    antecedentes: "Tabaquismo activo (5 cigarrillos al día). Obesidad grado I.",
    ultimaConsulta: "2026-05-21",
    estado: "Crítico",
    historiasClinicas: [
      {
        id: 501,
        fecha: "2026-05-21",
        motivo: "Dolor abdominal agudo y náuseas",
        sintomas: "Dolor intenso tipo cólico en hipocondrio derecho irradiado a escápula, iniciado tras ingesta de comida grasa. Vómitos.",
        diagnostico: "Colecistitis aguda litiásica. Obesidad grado I.",
        tratamiento: "Hospitalización inmediata. Régimen cero. Hidratación parenteral. Antibióticos EV. Evaluar colecistectomía de urgencia.",
        presionArt: "142/90 mmHg",
        pulso: 95,
        temperatura: 38.1,
        peso: 89.5,
        medico: "Dr. Esteban Peralta (Urgencias / Cirugía General)"
      }
    ],
    examenes: [
      { fecha: "2026-05-21", tipo: "Ecografía Abdomen Superior", resultado: "Vesícula biliar distendida con múltiples cálculos de 5-15mm. Pared engrosada (6mm).", estado: "Alterado" },
      { fecha: "2026-05-21", tipo: "Perfil Hepático y Amilasa", resultado: "Bilirrubina total: 1.8 mg/dL (Leve alza), Amilasa: 85 UI/L (Normal)", estado: "Alterado" }
    ],
    recetas: [
      { medicamento: "Ceftriaxona sódica 1g", dosis: "1g endovenoso cada 12 horas (Hospitalario)", duracion: "7 días" },
      { medicamento: "Ketoprofeno 100mg", dosis: "100mg endovenoso lento cada 8 horas ante dolor", duracion: "SOS" }
    ]
  }
];

export const mockCitas: CitaMock[] = [
  { id: 1, pacienteNombre: "Alejandro Silva Torres", pacienteId: 1, fecha: "2026-05-21", hora: "09:00", motivo: "Chequeo Presión Arterial", estado: "COMPLETADA", medico: "Dra. Sofía Mendoza" },
  { id: 2, pacienteNombre: "Roberto Muñoz Fuentes", pacienteId: 5, fecha: "2026-05-21", hora: "10:30", motivo: "Dolor Abdominal Fuerte", estado: "EN_CURSO", medico: "Dr. Esteban Peralta" },
  { id: 3, pacienteNombre: "María Loreto Gómez", pacienteId: 3, fecha: "2026-05-21", hora: "11:45", motivo: "Receta de Medicamentos", estado: "PENDIENTE", medico: "Dr. Ricardo Bascuñán" },
  { id: 4, pacienteNombre: "Camila Rojas Valenzuela", pacienteId: 2, fecha: "2026-05-21", hora: "14:15", motivo: "Control Broncopulmonar", estado: "PENDIENTE", medico: "Dr. Carlos Valdivia" }
];

export const mockDashboardStats = {
  totalPacientes: mockPacientes.length,
  citasHoy: mockCitas.length,
  citasCompletadasHoy: mockCitas.filter(c => c.estado === 'COMPLETADA').length,
  citasPendientesHoy: mockCitas.filter(c => c.estado === 'PENDIENTE').length,
  totalHistoriasClinicas: mockPacientes.reduce((acc, p) => acc + p.historiasClinicas.length, 0),
  tasaOcupacionCitas: "85%",
};

export const mockEspecialidadesStats: EspecialidadStat[] = [
  { nombre: "Medicina General", cantidad: 12, color: "#3b82f6" },
  { nombre: "Cardiología", cantidad: 8, color: "#ef4444" },
  { nombre: "Pediatría", cantidad: 7, color: "#10b981" },
  { nombre: "Broncopulmonar", cantidad: 5, color: "#06b6d4" },
  { nombre: "Endocrinología", cantidad: 4, color: "#8b5cf6" },
  { nombre: "Otras", cantidad: 6, color: "#6b7280" }
];

export const mockEvolucionMensual: EvolucionMensual[] = [
  { mes: "Ene", pacientes: 18 },
  { mes: "Feb", pacientes: 25 },
  { mes: "Mar", pacientes: 32 },
  { mes: "Abr", pacientes: 40 },
  { mes: "May", pacientes: 54 }
];

// ----------------------------------------------------
// MOCK DATA PARA ATENCIÓN (KANBAN)
// ----------------------------------------------------
export const mockKanbanAtencion: KanbanPaciente[] = [
  { id: 1, pacienteNombre: "Francisco Ortiz Lagos", horaLlegada: "08:15", medicoAsignado: "Dr. Ricardo Bascuñán", motivo: "Consulta Crónica", estado: "ESPERA" },
  { id: 2, pacienteNombre: "Gabriela Pinto Soto", horaLlegada: "08:28", medicoAsignado: "Dra. Carolina Ríos", motivo: "Control Fiebre Infantil", estado: "ESPERA" },
  { id: 3, pacienteNombre: "Andrés Delgado Cruces", horaLlegada: "07:50", medicoAsignado: "Dr. Jaime Vergara", motivo: "Examen de Tiroides", estado: "CONSULTA" },
  { id: 4, pacienteNombre: "Alejandro Silva Torres", horaLlegada: "09:02", medicoAsignado: "Dra. Sofía Mendoza", motivo: "Chequeo Presión", estado: "ATENDIDO" },
  { id: 5, pacienteNombre: "Lorena Valdés Soto", horaLlegada: "07:30", medicoAsignado: "Dr. Carlos Valdivia", motivo: "Kinesiología Post-resfriado", estado: "FACTURADO" }
];

// ----------------------------------------------------
// MOCK DATA PARA AGENDA (CALENDARIO)
// ----------------------------------------------------
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const horasDia = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const generarCalendario = (): CeldaCalendario[] => {
  const celdas: CeldaCalendario[] = [];
  let idCounter = 1;
  
  diasSemana.forEach(dia => {
    horasDia.forEach(hora => {
      // Simular algunos ocupados y pausas
      let estado: 'Disponible' | 'Ocupado' | 'Pausa médica' = 'Disponible';
      let info = '';
      
      const seed = Math.random();
      if (hora === '13:00') {
        estado = 'Pausa médica';
        info = 'Colación del Staff';
      } else if (seed < 0.3) {
        estado = 'Ocupado';
        info = seed < 0.15 ? 'Paciente Agendado' : 'Consulta Reservada';
      }
      
      celdas.push({
        id: `celda-${idCounter++}`,
        dia,
        hora,
        estado,
        info
      });
    });
  });
  return celdas;
};

export const mockCalendarioCitas = generarCalendario();

// ----------------------------------------------------
// MOCK DATA PARA FACTURACIÓN (MIS FINANCIERO)
// ----------------------------------------------------
export const mockFacturas: FacturaMock[] = [
  { id: "FAC-9281", pacienteName: "Lorena Valdés Soto", monto: 45000, metodoPago: "Tarjeta", estado: "PAGADA", fecha: "2026-05-21 08:45", categoria: "Consulta" },
  { id: "FAC-9282", pacienteName: "Andrés Delgado Cruces", monto: 125000, metodoPago: "Transferencia", estado: "PENDIENTE", fecha: "2026-05-21 09:15", categoria: "Procedimiento" },
  { id: "FAC-9283", pacienteName: "Alejandro Silva Torres", monto: 35000, metodoPago: "Tarjeta", estado: "PAGADA", fecha: "2026-05-21 09:30", categoria: "Consulta" },
  { id: "FAC-9284", pacienteName: "Isabel Allende Allende", monto: 85000, metodoPago: "Efectivo", estado: "PAGADA", fecha: "2026-05-21 10:10", categoria: "Laboratorio" },
  { id: "FAC-9285", pacienteName: "Cristián Castro Díaz", monto: 120000, metodoPago: "Transferencia", estado: "PENDIENTE", fecha: "2026-05-21 10:35", categoria: "Procedimiento" }
];

export const mockFacturacionStats = {
  ingresosHoy: 410000,
  desgloseHoy: {
    consultas: 160000,
    procedimientos: 165000,
    laboratorio: 85000
  },
  cuentasPorCobrar: 245000, // Suma de pendientes hoy + anteriores
  tasaPagoVentanilla: "92.5%"
};

// ----------------------------------------------------
// MOCK DATA PARA EXECUTIVE DASHBOARD (EIS)
// ----------------------------------------------------
export const mockIngresos6Meses: IngresoMensual[] = [
  { mes: "Dic", monto: 4200000 },
  { mes: "Ene", monto: 4800000 },
  { mes: "Feb", monto: 3900000 },
  { mes: "Mar", monto: 5600000 },
  { mes: "Abr", monto: 6200000 },
  { mes: "May", monto: 7500000 }
];

export const mockRentabilidadEspecialidades: RentabilidadEspecialidad[] = [
  { especialidad: "Cardiología", ingresos: 2800000, color: "#ef4444" },
  { especialidad: "Procedimientos Quirúrgicos", ingresos: 2100000, color: "#10b981" },
  { especialidad: "Medicina General", ingresos: 1600000, color: "#3b82f6" }
];

export const mockOcupacionConsultorios: OcupacionConsultorio[] = [
  { nombre: "Ocupado", porcentaje: 72, color: "#0ea5e9" },
  { nombre: "Disponible", porcentaje: 28, color: "#cbd5e1" }
];

export const mockEficienciaMedicos: EficienciaMedico[] = [
  { nombre: "Dr. Esteban Peralta", especialidad: "Urgencias / Cirugía", tiempoPromedio: 18, pacientesAtendidos: 112, satisfaccion: 4.8 },
  { nombre: "Dra. Sofía Mendoza", especialidad: "Cardiología", tiempoPromedio: 24, pacientesAtendidos: 88, satisfaccion: 4.9 },
  { nombre: "Dr. Ricardo Bascuñán", especialidad: "Medicina General", tiempoPromedio: 15, pacientesAtendidos: 145, satisfaccion: 4.6 },
  { nombre: "Dr. Carlos Valdivia", especialidad: "Broncopulmonar", tiempoPromedio: 20, pacientesAtendidos: 72, satisfaccion: 4.7 }
];

export const mockExecutiveKPIs = {
  ingresoMensual: "$7,500,000",
  pacientesUnicos: 342,
  cancelacionesRate: "4.2%",
  retencionRate: "89.4%"
};

// ----------------------------------------------------
// MOCK DATA PARA MÉDICOS Y CONSULTORIOS
// ----------------------------------------------------
export const mockMedicos: MedicoMock[] = [
  { id: 1, nombre: "Dr. Esteban Peralta", especialidad: "Urgencias / Cirugía", consultorio: "Box 1", turno: "Mañana", estado: "Activo" },
  { id: 2, nombre: "Dra. Sofía Mendoza", especialidad: "Cardiología", consultorio: "Box 2", turno: "Tarde", estado: "Activo" },
  { id: 3, nombre: "Dr. Ricardo Bascuñán", especialidad: "Geriatría / General", consultorio: "Box 3", turno: "Mañana", estado: "Activo" },
  { id: 4, nombre: "Dr. Carlos Valdivia", especialidad: "Broncopulmonar", consultorio: "Box 4", turno: "Tarde", estado: "Activo" },
  { id: 5, nombre: "Dra. Carolina Ríos", especialidad: "Pediatría", consultorio: "Box 1", turno: "Tarde", estado: "Activo" },
  { id: 6, nombre: "Dr. Jaime Vergara", especialidad: "Endocrinología", consultorio: "Box 2", turno: "Mañana", estado: "Inactivo" }
];

export const mockConsultorios: ConsultorioMock[] = [
  { id: 1, nombre: "Consultorio 1 (Box 1)", estado: "Ocupado", medicoActual: "Dr. Esteban Peralta" },
  { id: 2, nombre: "Consultorio 2 (Box 2)", estado: "Libre" },
  { id: 3, nombre: "Consultorio 3 (Box 3)", estado: "Ocupado", medicoActual: "Dr. Ricardo Bascuñán" },
  { id: 4, nombre: "Consultorio 4 (Box 4)", estado: "Libre" }
];
