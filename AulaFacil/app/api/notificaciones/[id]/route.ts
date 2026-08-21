import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({ leida: z.boolean() })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const notificacion = await prisma.notificacion.findUnique({ where: { id } })
  if (!notificacion || notificacion.usuarioId !== guard.session.userId) {
    return NextResponse.json({ error: "Notificación no encontrada." }, { status: 404 })
  }

  const actualizada = await prisma.notificacion.update({
    where: { id },
    data: { leida: parsed.data.leida },
  })
  return NextResponse.json(actualizada)
}
