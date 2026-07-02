import { z } from "zod";

export const CitaSchema = z.object({
  pacienteId: z.string().min(1, "Debe seleccionar un paciente"),
  medicoId: z.string().min(1, "Debe seleccionar un médico"),
  boxId: z.string().min(1, "Debe asignar un consultorio (Box)"),
  motivo: z.string().min(5, "El motivo debe ser más detallado"),
  fechaHoraInicio: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha de inicio inválida",
  }),
  fechaHoraFin: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha de fin inválida",
  }),
  montoAdelanto: z.coerce.number().min(0, "El adelanto no puede ser negativo").optional(),
  metodoAdelanto: z.enum(["EFECTIVO", "TRANSFERENCIA", "YAPE", "PLIN"]).optional(),
  observacionPago: z.string().max(500, "La observación es demasiado larga").optional(),
}).refine((data) => {
  const start = new Date(data.fechaHoraInicio).getTime();
  const end = new Date(data.fechaHoraFin).getTime();
  return end > start;
}, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["fechaHoraFin"]
}).superRefine((data, ctx) => {
  const adelanto = Number(data.montoAdelanto) || 0;
  if (adelanto > 0 && !data.metodoAdelanto) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["metodoAdelanto"],
      message: "Debe seleccionar el método del adelanto",
    });
  }
});
