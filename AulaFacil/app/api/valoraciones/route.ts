import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Valoracion } from "@/lib/types"

function shape(v: {
  id: string
  aulaId: string
  usuarioId: string
  usuario: { nombre: string }
  puntaje: number
  comentario: string | null
  createdAt: Date
}): Valoracion {
  return {
    id: v.id,
    aulaId: v.aulaId,
    usuarioId: v.usuarioId,
    usuarioNombre: v.usuario.nombre,
    puntaje: v.puntaje,
    comentario: v.comentario,
    createdAt: v.createdAt.toISOString(),
  }
}

export async function GET(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const { searchParams } = new URL(request.url)
  const aulaId = searchParams.get("aulaId")
  if (!aulaId) {
    return NextResponse.json({ error: "Falta aulaId." }, { status: 400 })
  }

  const valoraciones = await prisma.valoracion.findMany({
    where: { aulaId },
    include: { usuario: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(valoraciones.map(shape))
}

const createValoracionSchema = z.object({
  aulaId: z.string().min(1),
  puntaje: z.number().int().min(1).max(5),
  comentario: z.string().trim().min(1).nullable().optional(),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createValoracionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { aulaId, puntaje, comentario } = parsed.data

  const aula = await prisma.aula.findUnique({ where: { id: aulaId } })
  if (!aula) {
    return NextResponse.json({ error: "Aula inválida." }, { status: 400 })
  }

  const valoracion = await prisma.valoracion.upsert({
    where: { usuarioId_aulaId: { usuarioId: guard.session.userId, aulaId } },
    update: { puntaje, comentario: comentario ?? null },
    create: { usuarioId: guard.session.userId, aulaId, puntaje, comentario: comentario ?? null },
    include: { usuario: true },
  })

  return NextResponse.json(shape(valoracion), { status: 201 })
}
