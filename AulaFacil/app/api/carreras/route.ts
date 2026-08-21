import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Carrera } from "@/lib/types"

function shape(c: { id: string; nombre: string }): Carrera {
  return { id: c.id, nombre: c.nombre }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const carreras = await prisma.carrera.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(carreras.map(shape))
}

const createCarreraSchema = z.object({
  nombre: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createCarreraSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const existente = await prisma.carrera.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existente) {
    return NextResponse.json({ error: "Ya existe una carrera con ese nombre." }, { status: 409 })
  }

  const carrera = await prisma.carrera.create({ data: { nombre: parsed.data.nombre } })
  return NextResponse.json(shape(carrera), { status: 201 })
}
