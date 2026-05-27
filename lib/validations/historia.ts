import { z } from "zod";

// Valores posibles para el Enum Genero en Prisma
const GeneroEnum = z.enum(["MASCULINO", "FEMENINO", "OTRO"]);

export const HistoriaClinicaSchema = z.object({
  // Identificador de paciente
  pacienteId: z.string().min(1, "Debe seleccionar un paciente"),

  // Campos para paciente nuevo
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  genero: GeneroEnum.optional(),
  tipoSangre: z.string().optional(),
  contacto: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9\s-]{7,15}$/.test(val),
      "El contacto debe ser un teléfono válido (entre 7 y 15 dígitos)"
    ),
  alergias: z.string().optional(),
  antecedentes: z.string().optional(),

  // Signos vitales estrictos
  presionArt: z.string().regex(
    /^\d{2,3}\/\d{2,3}$/,
    "Formato debe ser Sistólica/Diastólica (ej: 120/80)"
  ),
  pulso: z.coerce
    .number({ invalid_type_error: "El pulso debe ser un número" })
    .min(30, "Pulso mínimo irreal (min 30)")
    .max(250, "Pulso máximo irreal (max 250)"),
  temperatura: z.coerce
    .number({ invalid_type_error: "Temperatura inválida" })
    .min(30, "Temperatura mínima es 30°C")
    .max(45, "Temperatura máxima es 45°C"),
  peso: z.coerce
    .number({ invalid_type_error: "Peso inválido" })
    .min(1, "El peso mínimo es 1kg")
    .max(400, "El peso máximo es 400kg"),

  // Detalles de consulta
  motivo: z.string().min(5, "El motivo de consulta es muy corto"),
  sintomas: z.string().min(10, "Describa mejor los síntomas (mínimo 10 caracteres)"),
  diagnostico: z.string().min(5, "El diagnóstico es obligatorio"),
  tratamiento: z.string().min(5, "Debe ingresar un plan de tratamiento"),

  // Médico tratante
  doctorId: z.string().min(1, "Debe seleccionar un médico tratante"),
}).superRefine((data, ctx) => {
  // Si el pacienteId es "new", todos los campos de nuevo paciente son obligatorios
  if (data.pacienteId === "new") {
    if (!data.nombre || data.nombre.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nombre"],
        message: "El nombre es obligatorio para un nuevo paciente",
      });
    }
    if (!data.apellido || data.apellido.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apellido"],
        message: "El apellido es obligatorio para un nuevo paciente",
      });
    }
    if (!data.fechaNacimiento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fechaNacimiento"],
        message: "La fecha de nacimiento es obligatoria",
      });
    }
    if (!data.genero) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["genero"],
        message: "El género es obligatorio",
      });
    }
  }
});
