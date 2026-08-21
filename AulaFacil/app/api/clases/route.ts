import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Clase } from "@/lib/types"

function shape(clase: {
  id: string
  materiaId: string
  materia: { nombre: string }
  profesorId: string
  profesor: { nombre: string }
  carreraId: string
  carrera: { nombre: string }
}): Clase {
  return {
    id: clase.id,
    materiaId: clase.materiaId,
    materiaNombre: clase.materia.nombre,
    profesorId: clase.profesorId,
    profesorNombre: clase.profesor.nombre,
    carreraId: clase.carreraId,
    carreraNombre: clase.carrera.nombre,
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const clases = await prisma.clase.findMany({
    where: guard.session.role === "PROFESOR" ? { profesorId: guard.session.userId } : undefined,
    include: { materia: true, profesor: true, carrera: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(clases.map(shape))
}

const createClaseSchema = z.object({
  materiaNombre: z.string().trim().min(1),
  profesorId: z.string().min(1),
  carreraId: z.string().min(1),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createClaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const [profesor, carrera] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: parsed.data.profesorId } }),
    prisma.carrera.findUnique({ where: { id: parsed.data.carreraId } }),
  ])
  if (!profesor || profesor.role !== "PROFESOR") {
    return NextResponse.json({ error: "Profesor inválido." }, { status: 400 })
  }
  if (!carrera) {
    return NextResponse.json({ error: "Carrera inválida." }, { status: 400 })
  }

  const materia = await prisma.materia.upsert({
    where: { nombre: parsed.data.materiaNombre },
    update: {},
    create: { nombre: parsed.data.materiaNombre },
  })

  const clase = await prisma.clase.create({
    data: { materiaId: materia.id, profesorId: profesor.id, carreraId: carrera.id },
    include: { materia: true, profesor: true, carrera: true },
  })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "CLASE_CREADA",
    entidad: "Clase",
    entidadId: clase.id,
    detalle: `${clase.materia.nombre} — ${clase.profesor.nombre} (${clase.carrera.nombre})`,
  })

  return NextResponse.json(shape(clase), { status: 201 })
}
