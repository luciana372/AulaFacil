import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

const favoritoSchema = z.object({
  aulaId: z.string().min(1),
  favorito: z.boolean(),
})

export async function PUT(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = favoritoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { aulaId, favorito } = parsed.data

  const aula = await prisma.aula.findUnique({ where: { id: aulaId } })
  if (!aula) {
    return NextResponse.json({ error: "Aula inválida." }, { status: 400 })
  }

  if (favorito) {
    await prisma.favorito.upsert({
      where: { usuarioId_aulaId: { usuarioId: guard.session.userId, aulaId } },
      update: {},
      create: { usuarioId: guard.session.userId, aulaId },
    })
  } else {
    await prisma.favorito.deleteMany({
      where: { usuarioId: guard.session.userId, aulaId },
    })
  }

  return NextResponse.json({ aulaId, favorito })
}
