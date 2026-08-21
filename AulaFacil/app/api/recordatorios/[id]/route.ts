import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ALUMNO")
  if (guard.error) return guard.error

  const { id } = await params

  const recordatorio = await prisma.recordatorio.findUnique({ where: { id } })
  if (!recordatorio || recordatorio.alumnoId !== guard.session.userId) {
    return NextResponse.json({ error: "Recordatorio no encontrado." }, { status: 404 })
  }

  await prisma.recordatorio.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
