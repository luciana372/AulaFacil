import { NextResponse } from "next/server"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params

  try {
    const apiKey = await prisma.apiKey.delete({ where: { id } })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "APIKEY_REVOCADA",
      entidad: "ApiKey",
      entidadId: id,
      detalle: apiKey.nombre,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json({ error: "Clave no encontrada." }, { status: 404 })
    }
    throw err
  }
}
