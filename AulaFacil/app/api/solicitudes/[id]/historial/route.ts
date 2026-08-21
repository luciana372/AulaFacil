import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { HistorialSolicitud } from "@/lib/types"

function shape(h: {
  id: string
  solicitudId: string
  estadoAnterior: HistorialSolicitud["estadoAnterior"]
  estadoNuevo: HistorialSolicitud["estadoNuevo"]
  actor: { nombre: string } | null
  comentario: string | null
  createdAt: Date
}): HistorialSolicitud {
  return {
    id: h.id,
    solicitudId: h.solicitudId,
    estadoAnterior: h.estadoAnterior,
    estadoNuevo: h.estadoNuevo,
    actorNombre: h.actor?.nombre ?? null,
    comentario: h.comentario,
    createdAt: h.createdAt.toISOString(),
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const { id } = await params

  const solicitud = await prisma.solicitud.findUnique({ where: { id } })
  if (!solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 })
  }
  if (guard.session.role === "PROFESOR" && solicitud.profesorId !== guard.session.userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const historial = await prisma.historialSolicitud.findMany({
    where: { solicitudId: id },
    include: { actor: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(historial.map(shape))
}
