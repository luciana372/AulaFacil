import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  await prisma.notificacion.updateMany({
    where: { usuarioId: guard.session.userId, leida: false },
    data: { leida: true },
  })
  return NextResponse.json({ ok: true })
}
