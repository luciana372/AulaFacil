import "server-only"

import { prisma } from "@/lib/prisma"

export async function registrarAuditoria(params: {
  actorId: string | null
  accion: string
  entidad: string
  entidadId: string
  detalle?: string | null
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId,
      detalle: params.detalle ?? null,
    },
  })
}
