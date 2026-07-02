-- Estados de cita y pagos manuales de adelanto.
ALTER TYPE "EstadoCita" ADD VALUE IF NOT EXISTS 'PENDIENTE_PAGO';
ALTER TYPE "MetodoPago" ADD VALUE IF NOT EXISTS 'YAPE';
ALTER TYPE "MetodoPago" ADD VALUE IF NOT EXISTS 'PLIN';

DO $$ BEGIN
  CREATE TYPE "EstadoAdelanto" AS ENUM ('NO_REQUIERE', 'PENDIENTE', 'COMPROBANTE_ENVIADO', 'VALIDADO', 'RECHAZADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Factura"
  ADD COLUMN IF NOT EXISTS "metodoAdelanto" "MetodoPago",
  ADD COLUMN IF NOT EXISTS "estadoAdelanto" "EstadoAdelanto" NOT NULL DEFAULT 'NO_REQUIERE',
  ADD COLUMN IF NOT EXISTS "comprobanteUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "observacionPago" TEXT,
  ADD COLUMN IF NOT EXISTS "fechaComprobante" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fechaValidacion" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "validadoPorId" TEXT;

UPDATE "Factura"
SET "estadoAdelanto" = CASE
  WHEN "montoAdelanto" > 0 THEN 'VALIDADO'::"EstadoAdelanto"
  ELSE 'NO_REQUIERE'::"EstadoAdelanto"
END
WHERE "estadoAdelanto" = 'NO_REQUIERE';
