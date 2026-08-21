import "server-only"

import { prisma } from "@/lib/prisma"
import type { EstadoSolicitud } from "@/lib/types"

export async function registrarCambioEstado(params: {
  solicitudId: string
  estadoAnterior: EstadoSolicitud | null
  estadoNuevo: EstadoSolicitud
  actorId: string | null
  comentario?: string | null
}) {
  await prisma.historialSolicitud.create({
    data: {
      solicitudId: params.solicitudId,
      estadoAnterior: params.estadoAnterior,
      estadoNuevo: params.estadoNuevo,
      actorId: params.actorId,
      comentario: params.comentario ?? null,
    },
  })
}

export async function notificar(params: {
  usuarioId: string
  mensaje: string
  solicitudId?: string | null
}) {
  await prisma.notificacion.create({
    data: {
      usuarioId: params.usuarioId,
      mensaje: params.mensaje,
      solicitudId: params.solicitudId ?? null,
    },
  })
}

export async function notificarAdmins(mensaje: string, solicitudId?: string | null) {
  const admins = await prisma.usuario.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })
  if (admins.length === 0) return
  await prisma.notificacion.createMany({
    data: admins.map((a) => ({ usuarioId: a.id, mensaje, solicitudId: solicitudId ?? null })),
  })
}
