import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { getConfiguracion } from "@/lib/configuracion"
import { buscarAulasAlternativas, intentarCrearHorario } from "@/lib/horarios"
import { prisma } from "@/lib/prisma"
import {
  notificar,
  notificarAdmins,
  registrarCambioEstado,
} from "@/lib/solicitud-eventos"
import type { Solicitud } from "@/lib/types"

const MS_POR_DIA = 24 * 60 * 60 * 1000

type SolicitudWithRelations = {
  id: string
  claseId: string
  clase: { materia: { nombre: string } }
  profesorId: string
  profesor: { nombre: string; penalizadoHasta: Date | null }
  aulaId: string | null
  aula: { nombre: string } | null
  estado: Solicitud["estado"]
  tipoUso: Solicitud["tipoUso"]
  comentario: string | null
  createdAt: Date
  diasPreferidos: Solicitud["diasPreferidos"]
  horaInicioPreferida: string | null
  horaFinPreferida: string | null
}

function shape(s: SolicitudWithRelations): Solicitud {
  return {
    id: s.id,
    claseId: s.claseId,
    claseNombre: s.clase.materia.nombre,
    profesorId: s.profesorId,
    profesorNombre: s.profesor.nombre,
    aulaId: s.aulaId,
    aulaNombre: s.aula?.nombre ?? null,
    estado: s.estado,
    tipoUso: s.tipoUso,
    profesorPenalizadoHasta: s.profesor.penalizadoHasta?.toISOString() ?? null,
    comentario: s.comentario,
    createdAt: s.createdAt.toISOString(),
    diasPreferidos: s.diasPreferidos,
    horaInicioPreferida: s.horaInicioPreferida,
    horaFinPreferida: s.horaFinPreferida,
  }
}

const resolveSchema = z.discriminatedUnion("estado", [
  z.object({ estado: z.literal("APROBADA"), aulaId: z.string().min(1) }),
  z.object({
    estado: z.literal("RECHAZADA"),
    comentario: z.string().trim().min(1).nullable().optional(),
  }),
  z.object({ estado: z.literal("CANCELADA") }),
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id } })
  if (!solicitud) {
    return NextResponse.json(
      { error: "Solicitud no encontrada." },
      { status: 404 }
    )
  }

  if (parsed.data.estado === "CANCELADA") {
    if (
      guard.session.role !== "PROFESOR" ||
      solicitud.profesorId !== guard.session.userId
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }
    if (solicitud.estado !== "PENDIENTE" && solicitud.estado !== "APROBADA") {
      return NextResponse.json(
        { error: "La solicitud ya no se puede cancelar." },
        { status: 409 }
      )
    }
    const updated = await prisma.solicitud.update({
      where: { id },
      data: { estado: "CANCELADA", resueltaAt: new Date() },
      include: {
        clase: { include: { materia: true } },
        profesor: true,
        aula: true,
      },
    })
    await registrarCambioEstado({
      solicitudId: id,
      estadoAnterior: solicitud.estado,
      estadoNuevo: "CANCELADA",
      actorId: guard.session.userId,
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "SOLICITUD_CANCELADA",
      entidad: "Solicitud",
      entidadId: id,
      detalle: `${updated.clase.materia.nombre} — ${updated.profesor.nombre}`,
    })
    await notificarAdmins(
      `${updated.profesor.nombre} canceló su solicitud de ${updated.clase.materia.nombre}.`,
      id
    )
    return NextResponse.json(shape(updated))
  }

  if (guard.session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }
  if (solicitud.estado !== "PENDIENTE") {
    return NextResponse.json(
      { error: "La solicitud ya fue resuelta." },
      { status: 409 }
    )
  }

  if (parsed.data.estado === "APROBADA") {
    const aula = await prisma.aula.findUnique({
      where: { id: parsed.data.aulaId },
    })
    if (!aula || !aula.habilitada) {
      return NextResponse.json(
        { error: "El aula elegida no existe o no está habilitada." },
        { status: 400 }
      )
    }

    const config = await getConfiguracion()
    const diasDesdeCreacion = Math.floor(
      (Date.now() - solicitud.createdAt.getTime()) / MS_POR_DIA
    )
    if (diasDesdeCreacion < config.anticipacionMinDias) {
      return NextResponse.json(
        {
          error: `Todavía no se puede aprobar: hay que esperar al menos ${config.anticipacionMinDias} día(s) desde que se creó la solicitud (van ${diasDesdeCreacion}).`,
        },
        { status: 400 }
      )
    }
    if (diasDesdeCreacion > config.anticipacionMaxDias) {
      return NextResponse.json(
        {
          error: `Ya no se puede aprobar: pasaron más de ${config.anticipacionMaxDias} día(s) desde que se creó la solicitud.`,
        },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.solicitud.update({
    where: { id },
    data:
      parsed.data.estado === "APROBADA"
        ? {
            estado: "APROBADA",
            aulaId: parsed.data.aulaId,
            resueltaAt: new Date(),
          }
        : {
            estado: "RECHAZADA",
            comentario: parsed.data.comentario ?? solicitud.comentario,
            resueltaAt: new Date(),
          },
    include: {
      clase: { include: { materia: true } },
      profesor: true,
      aula: true,
    },
  })

  await registrarCambioEstado({
    solicitudId: id,
    estadoAnterior: "PENDIENTE",
    estadoNuevo: updated.estado,
    actorId: guard.session.userId,
    comentario: parsed.data.estado === "RECHAZADA" ? updated.comentario : null,
  })
  await registrarAuditoria({
    actorId: guard.session.userId,
    accion:
      updated.estado === "APROBADA"
        ? "SOLICITUD_APROBADA"
        : "SOLICITUD_RECHAZADA",
    entidad: "Solicitud",
    entidadId: id,
    detalle:
      updated.estado === "APROBADA"
        ? `${updated.clase.materia.nombre} — aula ${updated.aula?.nombre}`
        : `${updated.clase.materia.nombre}${updated.comentario ? ` — ${updated.comentario}` : ""}`,
  })

  let horariosCreados = 0
  const horariosConflicto: { dia: string; motivo: string }[] = []
  const advertenciasBloqueo: { dia: string; mensaje: string }[] = []
  let alternativas: Awaited<ReturnType<typeof buscarAulasAlternativas>> = []

  if (
    updated.estado === "APROBADA" &&
    updated.aulaId &&
    solicitud.diasPreferidos.length > 0 &&
    solicitud.horaInicioPreferida &&
    solicitud.horaFinPreferida
  ) {
    for (const dia of solicitud.diasPreferidos) {
      const resultado = await intentarCrearHorario({
        claseId: updated.claseId,
        aulaId: updated.aulaId,
        dia,
        horaInicio: solicitud.horaInicioPreferida,
        horaFin: solicitud.horaFinPreferida,
      })
      if (resultado.ok) {
        horariosCreados++
        if (resultado.advertenciaBloqueo) {
          advertenciasBloqueo.push({
            dia: resultado.dia,
            mensaje: resultado.advertenciaBloqueo,
          })
        }
      } else {
        horariosConflicto.push({ dia: resultado.dia, motivo: resultado.motivo })
        if (resultado.tipo === "conflicto" && alternativas.length === 0) {
          alternativas = await buscarAulasAlternativas({
            aulaId: updated.aulaId,
            dia,
            horaInicio: solicitud.horaInicioPreferida,
            horaFin: solicitud.horaFinPreferida,
          })
        }
      }
    }
  }

  await notificar({
    usuarioId: updated.profesorId,
    mensaje:
      updated.estado === "APROBADA"
        ? `Tu solicitud de ${updated.clase.materia.nombre} fue aprobada. Aula asignada: ${updated.aula?.nombre}.${horariosCreados > 0 ? ` Se asignaron ${horariosCreados} horario(s) recurrente(s).` : ""}`
        : `Tu solicitud de ${updated.clase.materia.nombre} fue rechazada.${updated.comentario ? ` Motivo: ${updated.comentario}` : ""}`,
    solicitudId: id,
  })

  return NextResponse.json(
    {
      ...shape(updated),
      horariosCreados,
      horariosConflicto,
      advertenciasBloqueo,
      alternativas,
    },
    { status: 200 }
  )
}
