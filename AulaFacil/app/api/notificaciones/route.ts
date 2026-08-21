import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Notificacion } from "@/lib/types"

function shape(n: {
  id: string
  mensaje: string
  leida: boolean
  solicitudId: string | null
  createdAt: Date
}): Notificacion {
  return {
    id: n.id,
    mensaje: n.mensaje,
    leida: n.leida,
    solicitudId: n.solicitudId,
    createdAt: n.createdAt.toISOString(),
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: guard.session.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  })
  return NextResponse.json(notificaciones.map(shape))
}
