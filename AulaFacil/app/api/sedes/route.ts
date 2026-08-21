import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Sede } from "@/lib/types"

function shape(s: { id: string; nombre: string; direccion: string | null }): Sede {
  return { id: s.id, nombre: s.nombre, direccion: s.direccion }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const sedes = await prisma.sede.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(sedes.map(shape))
}

const createSedeSchema = z.object({
  nombre: z.string().trim().min(1),
  direccion: z.string().trim().min(1).nullable().optional(),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createSedeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const existente = await prisma.sede.findUnique({
    where: { nombre: parsed.data.nombre },
  })
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una sede con ese nombre." },
      { status: 409 }
    )
  }

  const sede = await prisma.sede.create({
    data: {
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion ?? null,
    },
  })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "SEDE_CREADA",
    entidad: "Sede",
    entidadId: sede.id,
    detalle: sede.nombre,
  })

  return NextResponse.json(shape(sede), { status: 201 })
}
