import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { BloqueoFecha } from "@/lib/types"

function shape(b: {
  id: string
  fechaInicio: Date
  fechaFin: Date
  aulaId: string | null
  aula: { nombre: string } | null
  motivo: string
  creadoPor: { nombre: string }
  createdAt: Date
}): BloqueoFecha {
  return {
    id: b.id,
    fechaInicio: b.fechaInicio.toISOString().slice(0, 10),
    fechaFin: b.fechaFin.toISOString().slice(0, 10),
    aulaId: b.aulaId,
    aulaNombre: b.aula?.nombre ?? null,
    motivo: b.motivo,
    creadoPorNombre: b.creadoPor.nombre,
    createdAt: b.createdAt.toISOString(),
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const bloqueos = await prisma.bloqueoFecha.findMany({
    include: { aula: true, creadoPor: true },
    orderBy: { fechaInicio: "desc" },
  })
  return NextResponse.json(bloqueos.map(shape))
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const createBloqueoSchema = z
  .object({
    fechaInicio: z.string().regex(dateRegex),
    fechaFin: z.string().regex(dateRegex),
    aulaId: z.string().min(1).nullable().optional(),
    motivo: z.string().trim().min(1),
  })
  .refine((d) => d.fechaInicio <= d.fechaFin, {
    message: "La fecha de inicio debe ser anterior o igual a la de fin.",
    path: ["fechaFin"],
  })

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createBloqueoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  if (parsed.data.aulaId) {
    const aula = await prisma.aula.findUnique({
      where: { id: parsed.data.aulaId },
    })
    if (!aula) {
      return NextResponse.json({ error: "Aula inválida." }, { status: 400 })
    }
  }

  const bloqueo = await prisma.bloqueoFecha.create({
    data: {
      fechaInicio: new Date(parsed.data.fechaInicio),
      fechaFin: new Date(parsed.data.fechaFin),
      aulaId: parsed.data.aulaId ?? null,
      motivo: parsed.data.motivo,
      creadoPorId: guard.session.userId,
    },
    include: { aula: true, creadoPor: true },
  })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "BLOQUEO_CREADO",
    entidad: "BloqueoFecha",
    entidadId: bloqueo.id,
    detalle: `${bloqueo.motivo} — ${bloqueo.aula?.nombre ?? "Todas las aulas"} (${parsed.data.fechaInicio} a ${parsed.data.fechaFin})`,
  })

  return NextResponse.json(shape(bloqueo), { status: 201 })
}
