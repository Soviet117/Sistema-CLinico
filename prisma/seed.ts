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

  // 4. Crear Pacientes de Prueba
  const pacientes = await Promise.all([
    await prisma.paciente.create({
      data: {
        nombre: 'Carlos',
        apellido: 'Prueba',
        fechaNacimiento: new Date('1990-01-01'),
        genero: Genero.MASCULINO,
        contacto: '987654321',
        tipoSangre: 'O+',
      }
    }),
    await prisma.paciente.create({
      data: {
        nombre: 'María',
        apellido: 'González',
        fechaNacimiento: new Date('1985-05-15'),
        genero: Genero.FEMENINO,
        contacto: '987654322',
        tipoSangre: 'A+',
        alergias: 'Penicilina',
        antecedentes: 'Hipertensión arterial',
      }
    }),
    await prisma.paciente.create({
      data: {
        nombre: 'José',
        apellido: 'Ramírez',
        fechaNacimiento: new Date('1978-11-08'),
        genero: Genero.MASCULINO,
        contacto: '987654323',
        tipoSangre: 'B-',
        alergias: 'None',
        antecedentes: 'Diabetes tipo 2',
      }
    }),
    await prisma.paciente.create({
      data: {
        nombre: 'Ana',
        apellido: 'López',
        fechaNacimiento: new Date('1992-03-22'),
        genero: Genero.FEMENINO,
        contacto: '987654324',
        tipoSangre: 'O-',
        alergias: 'Sulfas',
        antecedentes: 'Asma leve',
      }
    }),
    await prisma.paciente.create({
      data: {
        nombre: 'Francisco',
        apellido: 'Díaz',
        fechaNacimiento: new Date('1965-09-30'),
        genero: Genero.OTRO,
        contacto: '987654325',
        tipoSangre: 'AB+',
        alergias: 'None',
        antecedentes: 'Cardiopatía isquémica',
      }
    }),
  ])

  const pacientesCreados = pacientes.map(p => `${p.nombre} ${p.apellido}`).join(', ')
  console.log(`✅ Pacientes de prueba creados: ${pacientesCreados}`)
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
