import { NextResponse } from "next/server"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params

  const bloqueo = await prisma.bloqueoFecha.findUnique({
    where: { id },
    include: { aula: true },
  })
  if (!bloqueo) {
    return NextResponse.json(
      { error: "Bloqueo no encontrado." },
      { status: 404 }
    )
  }

  await prisma.bloqueoFecha.delete({ where: { id } })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "BLOQUEO_ELIMINADO",
    entidad: "BloqueoFecha",
    entidadId: id,
    detalle: `${bloqueo.motivo} — ${bloqueo.aula?.nombre ?? "Todas las aulas"}`,
  })

  return NextResponse.json({ ok: true })
}
