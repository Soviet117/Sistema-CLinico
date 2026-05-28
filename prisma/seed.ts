import { PrismaClient, Role, Genero, EstadoMedico, EstadoBox } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando el proceso de Seeding...')

  // 1. Crear Especialidades
  const cardiologia = await prisma.especialidad.upsert({
    where: { nombre: 'Cardiología' },
    update: {},
    create: {
      nombre: 'Cardiología',
      precioBase: 80.00
    }
  })

  const general = await prisma.especialidad.upsert({
    where: { nombre: 'Medicina General' },
    update: {},
    create: {
      nombre: 'Medicina General',
      precioBase: 40.00
    }
  })

  console.log('✅ Especialidades creadas.')

  // 2. Crear Boxes
  await prisma.box.upsert({
    where: { nombre: 'Box 1 - Cardio' },
    update: {},
    create: {
      nombre: 'Box 1 - Cardio',
      tipo: 'Consultorio',
      especialidadId: cardiologia.id
    }
  })

  await prisma.box.upsert({
    where: { nombre: 'Box 2 - General' },
    update: {},
    create: {
      nombre: 'Box 2 - General',
      tipo: 'Consultorio',
      especialidadId: general.id
    }
  })

  console.log('✅ Boxes creados.')

  // 3. Crear Usuarios (Admin y Doctor)
  // Usamos el hash equivalente a 'password123'
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: {},
    create: {
      email: 'admin@clinica.com',
      nombre: 'Administrador Principal',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiX/sM.Hq.kH/T1E21TtzVvX4VfA2u',
      rol: Role.ADMIN
    }
  })

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@clinica.com' },
    update: {},
    create: {
      email: 'doctor@clinica.com',
      nombre: 'Dr. Juan Pérez',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiX/sM.Hq.kH/T1E21TtzVvX4VfA2u',
      rol: Role.DOCTOR
    }
  })

  // Crear perfil médico
  await prisma.medico.upsert({
    where: { numColegiatura: 'CMP-12345' },
    update: {},
    create: {
      numColegiatura: 'CMP-12345',
      especialidadId: general.id,
      userId: doctor.id
    }
  })

  console.log('✅ Usuarios y Médicos creados.')

  // 4. Crear un Paciente de Prueba
  const paciente = await prisma.paciente.create({
    data: {
      nombre: 'Carlos',
      apellido: 'Prueba',
      fechaNacimiento: new Date('1990-01-01'),
      genero: Genero.MASCULINO,
      contacto: '987654321',
      tipoSangre: 'O+',
    }
  })

  console.log(`✅ Paciente de prueba creado: ${paciente.nombre} ${paciente.apellido}`)
  console.log('✨ Base de datos poblada exitosamente (Seed Completado).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
