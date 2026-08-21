import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "../lib/generated/prisma/client"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEV_PASSWORD = "password123"

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)

  const admin = await prisma.usuario.upsert({
    where: { email: "lucia.fernandez@aulafacil.edu" },
    update: {},
    create: {
      nombre: "Lucía Fernández",
      email: "lucia.fernandez@aulafacil.edu",
      passwordHash,
      role: "ADMIN",
    },
  })

  const marcela = await prisma.usuario.upsert({
    where: { email: "marcela.rios@aulafacil.edu" },
    update: {},
    create: {
      nombre: "Marcela Ríos",
      email: "marcela.rios@aulafacil.edu",
      passwordHash,
      role: "PROFESOR",
    },
  })

  const jorge = await prisma.usuario.upsert({
    where: { email: "jorge.paredes@aulafacil.edu" },
    update: {},
    create: {
      nombre: "Jorge Paredes",
      email: "jorge.paredes@aulafacil.edu",
      passwordHash,
      role: "PROFESOR",
    },
  })

  const carreraSociales = await prisma.carrera.upsert({
    where: { nombre: "Profesorado en Ciencias Sociales" },
    update: {},
    create: { nombre: "Profesorado en Ciencias Sociales" },
  })
  const carreraExactas = await prisma.carrera.upsert({
    where: { nombre: "Ingeniería" },
    update: {},
    create: { nombre: "Ingeniería" },
  })

  await prisma.usuario.upsert({
    where: { email: "juan.perez@aulafacil.edu" },
    update: { carreraId: carreraSociales.id },
    create: {
      nombre: "Juan Pérez",
      email: "juan.perez@aulafacil.edu",
      passwordHash,
      role: "ALUMNO",
      carreraId: carreraSociales.id,
    },
  })

  const [, aula102, lab1, aulaMagna] = await Promise.all([
    prisma.aula.upsert({
      where: { nombre: "Aula 101" },
      update: {},
      create: { nombre: "Aula 101", capacidad: 30, ubicacion: "Planta baja", habilitada: true },
    }),
    prisma.aula.upsert({
      where: { nombre: "Aula 102" },
      update: {},
      create: { nombre: "Aula 102", capacidad: 25, ubicacion: "Planta baja", habilitada: true },
    }),
    prisma.aula.upsert({
      where: { nombre: "Laboratorio 1" },
      update: {},
      create: { nombre: "Laboratorio 1", capacidad: 20, ubicacion: "1er piso", habilitada: false },
    }),
    prisma.aula.upsert({
      where: { nombre: "Aula Magna" },
      update: {},
      create: { nombre: "Aula Magna", capacidad: 80, ubicacion: "2do piso", habilitada: true },
    }),
  ])

  const matematica = await prisma.materia.upsert({
    where: { nombre: "Matemática II" },
    update: {},
    create: { nombre: "Matemática II" },
  })
  const historia = await prisma.materia.upsert({
    where: { nombre: "Historia Argentina" },
    update: {},
    create: { nombre: "Historia Argentina" },
  })
  const fisica = await prisma.materia.upsert({
    where: { nombre: "Física I" },
    update: {},
    create: { nombre: "Física I" },
  })

  async function findOrCreateClase(materiaId: string, profesorId: string, carreraId: string) {
    const existente = await prisma.clase.findFirst({ where: { materiaId, profesorId } })
    if (existente) {
      return prisma.clase.update({ where: { id: existente.id }, data: { carreraId } })
    }
    return prisma.clase.create({ data: { materiaId, profesorId, carreraId } })
  }

  const claseMatematica = await findOrCreateClase(matematica.id, marcela.id, carreraExactas.id)
  const claseHistoria = await findOrCreateClase(historia.id, jorge.id, carreraSociales.id)
  const claseFisica = await findOrCreateClase(fisica.id, marcela.id, carreraExactas.id)

  await prisma.solicitud.createMany({
    data: [
      {
        claseId: claseMatematica.id,
        profesorId: marcela.id,
        estado: "PENDIENTE",
        comentario: "Necesito un aula con proyector para 30 alumnos.",
      },
      {
        claseId: claseHistoria.id,
        profesorId: jorge.id,
        estado: "APROBADA",
        aulaId: aula102.id,
        resueltaAt: new Date(),
      },
      {
        claseId: claseFisica.id,
        profesorId: marcela.id,
        estado: "RECHAZADA",
        aulaId: lab1.id,
        comentario: "El laboratorio está deshabilitado por mantenimiento.",
        resueltaAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  await prisma.horario.createMany({
    data: [
      { claseId: claseHistoria.id, aulaId: aula102.id, dia: "LUNES", horaInicio: "08:00", horaFin: "09:30" },
      { claseId: claseHistoria.id, aulaId: aula102.id, dia: "MIERCOLES", horaInicio: "08:00", horaFin: "09:30" },
      { claseId: claseMatematica.id, aulaId: aulaMagna.id, dia: "MARTES", horaInicio: "10:00", horaFin: "11:30" },
    ],
    skipDuplicates: true,
  })

  console.log("Seed OK. Contraseña de todos los usuarios de prueba:", DEV_PASSWORD)
  console.log("Seed OK:", { admin: admin.email, aulas: 4, clases: 3 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
