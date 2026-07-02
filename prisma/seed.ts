import { PrismaClient, Role, Genero, EstadoMedico, EstadoBox, EstadoCita, EstadoPago, MetodoPago, EstadoAdelanto } from '@prisma/client'
import { hashPassword } from '../lib/password'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

const NOMBRES_MASC = ['Carlos', 'Andrés', 'Roberto', 'Jorge', 'Felipe', 'Luis', 'Pablo', 'Sergio', 'Javier', 'Miguel', 'Diego', 'Cristian', 'Manuel', 'Oscar', 'Ricardo']
const NOMBRES_FEM = ['María', 'Carmen', 'Ana', 'Patricia', 'Claudia', 'Sofía', 'Valentina', 'Camila', 'Andrea', 'Francisca', 'Paula', 'Daniela', 'Marcela', 'Rosa', 'Carolina']
const APELLIDOS = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Ramírez', 'Espinoza', 'Castillo']
const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const ALERGIAS_COMUNES = ['Penicilina', 'Sulfas', 'Aspirina', 'Polen', 'Frutos secos', 'Ninguna', 'Ninguna', 'Ninguna']
const DEMO_COMPROBANTE_URL = '/uploads/comprobantes/demo-comprobante.png'

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const AHORA = new Date()

interface EspecialidadInfo {
  nombre: string
  precioBase: number
  boxNombre: string
  color: string
}

const ESPECIALIDADES: EspecialidadInfo[] = [
  { nombre: 'Medicina General', precioBase: 40, boxNombre: 'Box 1 - General', color: '#3b82f6' },
  { nombre: 'Cardiología', precioBase: 80, boxNombre: 'Box 2 - Cardio', color: '#ef4444' },
  { nombre: 'Pediatría', precioBase: 50, boxNombre: 'Box 3 - Pedia', color: '#10b981' },
  { nombre: 'Broncopulmonar', precioBase: 60, boxNombre: 'Box 4 - Bronco', color: '#06b6d4' },
  { nombre: 'Traumatología', precioBase: 70, boxNombre: 'Box 5 - Trauma', color: '#f59e0b' },
  { nombre: 'Dermatología', precioBase: 55, boxNombre: 'Box 6 - Derma', color: '#8b5cf6' },
]

const ROLE_PERMISSIONS_DEFAULTS: Record<string, string[]> = {
  ADMIN: ['dashboard', 'ejecutivo', 'atencion', 'agenda', 'facturacion', 'medicos', 'pacientes', 'nueva-historia', 'reportes', 'configuracion'],
  DOCTOR: ['atencion', 'agenda', 'facturacion', 'pacientes', 'nueva-historia'],
  RECEPCIONISTA: ['atencion', 'agenda', 'facturacion'],
}

async function main() {
  console.log('🗑️  Limpiando base de datos...')
  await prisma.factura.deleteMany()
  await prisma.historiaClinica.deleteMany()
  await prisma.cita.deleteMany()
  await prisma.medico.deleteMany()
  await prisma.box.deleteMany()
  await prisma.user.deleteMany()
  await prisma.paciente.deleteMany()
  await prisma.especialidad.deleteMany()
  await prisma.rolePermission.deleteMany()

  const comprobantesDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes')
  await mkdir(comprobantesDir, { recursive: true })
  await writeFile(
    path.join(comprobantesDir, 'demo-comprobante.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/luzD9wAAAABJRU5ErkJggg==',
      'base64'
    )
  )

  // ─── 1. ESPECIALIDADES ───
  console.log('🏥 Creando especialidades...')
  const espRecords: Record<string, { id: string; precioBase: number }> = {}
  for (const esp of ESPECIALIDADES) {
    const r = await prisma.especialidad.create({
      data: { nombre: esp.nombre, precioBase: esp.precioBase }
    })
    espRecords[esp.nombre] = { id: r.id, precioBase: esp.precioBase }
  }
  console.log(`✅ ${ESPECIALIDADES.length} especialidades creadas.`)

  // ─── 2. BOXES ───
  console.log('🏗️  Creando boxes...')
  const boxRecords: Record<string, { id: string; especialidad: string }> = {}
  for (const esp of ESPECIALIDADES) {
    const r = await prisma.box.create({
      data: {
        nombre: esp.boxNombre,
        tipo: 'Consultorio',
        especialidadId: espRecords[esp.nombre]!.id
      }
    })
    boxRecords[esp.boxNombre] = { id: r.id, especialidad: esp.nombre }
  }
  console.log(`✅ ${ESPECIALIDADES.length} boxes creados.`)

  // ─── 3. USUARIOS ───
  console.log('👤 Creando usuarios...')

  const adminPw = await hashPassword('admin123')
  const recepPw = await hashPassword('recepcion123')

  const admin = await prisma.user.create({
    data: {
      email: 'silvestre@clinica.com',
      nombre: 'Silvestre',
      passwordHash: adminPw,
      rol: Role.ADMIN,
      activo: true,
    }
  })

  await prisma.user.create({
    data: {
      email: 'recepcion@clinica.com',
      nombre: 'María González',
      passwordHash: recepPw,
      rol: Role.RECEPCIONISTA,
      activo: true,
    }
  })

  // Silvestre es el único médico del sistema
  const medico = await prisma.medico.create({
    data: {
      numColegiatura: 'CMP-10001',
      especialidadId: espRecords['Medicina General']!.id,
      userId: admin.id,
    }
  })

  console.log(`✅ 2 usuarios + 1 médico (Silvestre) creados.`)

  // ─── 4. ROLE PERMISSIONS ───
  console.log('🔐 Creando permisos por rol...')
  for (const [rol, modules] of Object.entries(ROLE_PERMISSIONS_DEFAULTS)) {
    for (const moduleKey of modules) {
      await prisma.rolePermission.create({
        data: {
          rol: rol as Role,
          moduleKey,
          activo: true,
        }
      })
    }
  }
  console.log(`✅ Permisos creados para ${Object.keys(ROLE_PERMISSIONS_DEFAULTS).length} roles.`)

  // ─── 5. PACIENTES ───
  console.log('👥 Creando pacientes...')
  const crecimientoPacientes = [2, 3, 4, 5, 7, 9]

  const pacientesCreated: { id: string; nombre: string; apellido: string }[] = []
  let usados = new Set<string>()

  for (let i = 0; i < crecimientoPacientes.length; i++) {
    const mesesAtras = 6 - i
    const count = crecimientoPacientes[i]
    const mesDate = new Date(AHORA.getFullYear(), AHORA.getMonth() - mesesAtras, 1)

    for (let j = 0; j < count; j++) {
      const genero = Math.random() > 0.5 ? Genero.MASCULINO : Genero.FEMENINO
      let nombre: string
      let apellido: string
      do {
        nombre = genero === Genero.MASCULINO ? randomItem(NOMBRES_MASC) : randomItem(NOMBRES_FEM)
        apellido = randomItem(APELLIDOS)
      } while (usados.has(`${nombre} ${apellido}`))
      usados.add(`${nombre} ${apellido}`)

      const paciente = await prisma.paciente.create({
        data: {
          nombre,
          apellido,
          fechaNacimiento: new Date(randomBetween(1950, 2012), randomBetween(0, 11), randomBetween(1, 28)),
          genero,
          tipoSangre: randomItem(TIPOS_SANGRE),
          contacto: `+56 9 ${randomBetween(1000, 9999)} ${randomBetween(1000, 9999)}`,
          alergias: randomItem(ALERGIAS_COMUNES),
          antecedentes: Math.random() > 0.6 ? ['Hipertensión', 'Diabetes tipo 2', 'Asma', 'Cardiopatía', 'Ninguno'][randomBetween(0, 4)] : undefined,
          createdAt: randomDate(mesDate, new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0)),
        }
      })
      pacientesCreated.push({ id: paciente.id, nombre, apellido })
    }
  }
  console.log(`✅ ${pacientesCreated.length} pacientes creados.`)

  // ─── 6. CITAS ───
  console.log('📅 Creando citas y facturas...')

  const GENEROS_CITA: EstadoCita[] = ['COMPLETADA', 'COMPLETADA', 'COMPLETADA', 'COMPLETADA', 'COMPLETADA', 'PROGRAMADA', 'PROGRAMADA', 'PROGRAMADA', 'PENDIENTE_PAGO', 'CANCELADA']

  let totalCitas = 0
  let totalFacturas = 0

  for (let mesesAtras = 6; mesesAtras >= 0; mesesAtras--) {
    const esEsteMes = mesesAtras === 0
    const mesDate = new Date(AHORA.getFullYear(), AHORA.getMonth() - mesesAtras, 1)
    const diasEnMes = new Date(AHORA.getFullYear(), AHORA.getMonth() - mesesAtras + 1, 0).getDate()

    const citasEsteMes = esEsteMes ? 14 : 6 + (6 - mesesAtras) * 2

    for (let i = 0; i < citasEsteMes; i++) {
      const paciente = randomItem(pacientesCreated)
      const esp = randomItem(ESPECIALIDADES)
      const box = boxRecords[esp.boxNombre]!

      let dia: number
      let horaInicio: number
      let minInicio: number

      if (esEsteMes && i < 4) {
        dia = AHORA.getDate()
        horaInicio = 9 + i
        minInicio = 0
      } else {
        dia = randomBetween(1, Math.min(diasEnMes, 28))
        horaInicio = randomBetween(8, 17)
        minInicio = randomItem([0, 15, 30, 45])
      }

      const fechaInicio = new Date(
        esEsteMes ? AHORA.getFullYear() : mesDate.getFullYear(),
        esEsteMes ? AHORA.getMonth() : mesDate.getMonth(),
        dia, horaInicio, minInicio, 0
      )

      const duracion = randomBetween(15, 45)
      const fechaFin = new Date(fechaInicio.getTime() + duracion * 60 * 1000)

      const estado = esEsteMes && i < 12 ? randomItem(GENEROS_CITA) : randomItem(GENEROS_CITA)

      const cita = await prisma.cita.create({
        data: {
          fechaHoraInicio: fechaInicio,
          fechaHoraFin: fechaFin,
          motivo: randomItem(['Control rutinario', 'Consulta general', 'Dolor agudo', 'Examen de seguimiento', 'Receta médica', 'Evaluación inicial', 'Dolor crónico', 'Chequeo preventivo']),
          estado,
          pacienteId: paciente.id,
          usuarioId: admin.id,
          medicoId: medico.id,
          boxId: box.id,
          createdAt: fechaInicio,
        }
      })

      totalCitas++

      if (estado !== 'CANCELADA' && mesesAtras >= 0) {
        const espData = espRecords[esp.nombre]!
        const montoBase = espData.precioBase
        const requiereAdelanto = Math.random() > 0.45
        const montoAdelanto = requiereAdelanto ? randomBetween(5, Math.min(25, montoBase - 5)) : 0
        const montoTotal = montoBase

        const metodoAdelanto = montoAdelanto > 0
          ? randomItem([MetodoPago.EFECTIVO, MetodoPago.TRANSFERENCIA, MetodoPago.YAPE, MetodoPago.PLIN])
          : null

        const estadoAdelanto = montoAdelanto <= 0
          ? EstadoAdelanto.NO_REQUIERE
          : estado === 'PENDIENTE_PAGO'
            ? EstadoAdelanto.VALIDADO
            : randomItem([
                EstadoAdelanto.VALIDADO,
                EstadoAdelanto.COMPROBANTE_ENVIADO,
                EstadoAdelanto.PENDIENTE,
                EstadoAdelanto.RECHAZADO,
              ])

        const adelantoValidado = estadoAdelanto === EstadoAdelanto.VALIDADO ? montoAdelanto : 0
        const estadoPago = estado === 'COMPLETADA' ? EstadoPago.PAGADO : EstadoPago.PENDIENTE

        const comprobanteUrl = estadoAdelanto === EstadoAdelanto.COMPROBANTE_ENVIADO
          ? DEMO_COMPROBANTE_URL
          : null

        await prisma.factura.create({
          data: {
            montoBase,
            montoAdelanto,
            montoTotal,
            estadoPago,
            metodoPago: estadoPago === EstadoPago.PAGADO
              ? randomItem([MetodoPago.EFECTIVO, MetodoPago.TARJETA, MetodoPago.TRANSFERENCIA, MetodoPago.YAPE, MetodoPago.PLIN])
              : null,
            metodoAdelanto,
            estadoAdelanto,
            comprobanteUrl,
            observacionPago: estadoAdelanto === EstadoAdelanto.RECHAZADO
              ? 'Comprobante de prueba rechazado por monto no legible.'
              : estado === 'PENDIENTE_PAGO'
                ? `Saldo pendiente generado por seed: ${montoTotal - adelantoValidado}`
                : null,
            fechaComprobante: comprobanteUrl ? fechaInicio : null,
            fechaValidacion: estadoAdelanto === EstadoAdelanto.VALIDADO ? fechaInicio : null,
            validadoPorId: estadoAdelanto === EstadoAdelanto.VALIDADO ? admin.id : null,
            categoria: 'Consulta',
            fechaEmision: fechaInicio,
            citaId: cita.id,
            pacienteId: paciente.id,
          }
        })
        totalFacturas++
      }
    }
  }

  console.log(`✅ ${totalCitas} citas creadas.`)
  console.log(`💰 ${totalFacturas} facturas generadas.`)
  console.log('✨ Seed completado exitosamente.')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
