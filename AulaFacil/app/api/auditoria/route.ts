import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { RegistroAuditoria } from "@/lib/types"

function shape(a: {
  id: string
  actor: { nombre: string } | null
  accion: string
  entidad: string
  entidadId: string
  detalle: string | null
  createdAt: Date
}): RegistroAuditoria {
  return {
    id: a.id,
    actorNombre: a.actor?.nombre ?? "Sistema",
    accion: a.accion,
    entidad: a.entidad,
    entidadId: a.entidadId,
    detalle: a.detalle,
    createdAt: a.createdAt.toISOString(),
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const registros = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  })
  return NextResponse.json(registros.map(shape))
}
