import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { getConfiguracion } from "@/lib/configuracion"
import { buscarAulasAlternativas, intentarCrearHorario } from "@/lib/horarios"
import { prioridadEfectiva } from "@/lib/prioridad"
import { prisma } from "@/lib/prisma"
import { DiaSemana, TipoUso } from "@/lib/generated/prisma/enums"
import {
  notificar,
  notificarAdmins,
  registrarCambioEstado,
} from "@/lib/solicitud-eventos"
import type { Solicitud } from "@/lib/types"

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

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const solicitudes = await prisma.solicitud.findMany({
    where:
      guard.session.role === "PROFESOR"
        ? { profesorId: guard.session.userId }
        : undefined,
    include: {
      clase: { include: { materia: true } },
      profesor: true,
      aula: true,
    },
    orderBy: { createdAt: "desc" },
  })

  if (guard.session.role === "ADMIN") {
    const pendientes = solicitudes
      .filter((s) => s.estado === "PENDIENTE")
      .sort((a, b) => {
        const prioridadA = prioridadEfectiva(a.tipoUso, a.profesor.penalizadoHasta)
        const prioridadB = prioridadEfectiva(b.tipoUso, b.profesor.penalizadoHasta)
        if (prioridadA !== prioridadB) return prioridadA - prioridadB
        return a.createdAt.getTime() - b.createdAt.getTime()
      })
    const resto = solicitudes.filter((s) => s.estado !== "PENDIENTE")
    return NextResponse.json([...pendientes, ...resto].map(shape))
  }

  return NextResponse.json(solicitudes.map(shape))
}

const createSolicitudSchema = z
  .object({
    claseId: z.string().min(1),
    aulaId: z.string().min(1).nullable().optional(),
    tipoUso: z.enum([TipoUso.CATEDRA, TipoUso.INVESTIGACION]).optional(),
    comentario: z.string().trim().min(1).nullable().optional(),
    dias: z.array(z.enum(DiaSemana)).max(6).optional(),
    horaInicio: z.string().regex(timeRegex).optional(),
    horaFin: z.string().regex(timeRegex).optional(),
  })
  .refine((d) => !d.dias?.length || (d.horaInicio && d.horaFin), {
    message: "Si elegís días, indicá también el horario.",
    path: ["horaInicio"],
  })
  .refine((d) => !d.horaInicio || !d.horaFin || d.horaInicio < d.horaFin, {
    message: "El horario de inicio debe ser anterior al de fin.",
    path: ["horaFin"],
  })

export async function POST(request: Request) {
  const guard = await requireRole("PROFESOR")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createSolicitudSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const clase = await prisma.clase.findUnique({
    where: { id: parsed.data.claseId },
  })
  if (!clase || clase.profesorId !== guard.session.userId) {
    return NextResponse.json({ error: "Clase inválida." }, { status: 400 })
  }

  const activaExistente = await prisma.solicitud.findFirst({
    where: { claseId: clase.id, estado: { in: ["PENDIENTE", "APROBADA"] } },
  })
  if (activaExistente) {
    return NextResponse.json(
      { error: "Ya hay una solicitud activa para esta clase." },
      { status: 409 }
    )
  }

  const config = await getConfiguracion()
  const activasDelProfesor = await prisma.solicitud.count({
    where: {
      profesorId: guard.session.userId,
      estado: { in: ["PENDIENTE", "APROBADA"] },
    },
  })
  if (activasDelProfesor >= config.maxReservasSimultaneasPorUsuario) {
    return NextResponse.json(
      {
        error: `Llegaste al máximo de ${config.maxReservasSimultaneasPorUsuario} reservas simultáneas. Cancelá alguna antes de pedir otra.`,
      },
      { status: 409 }
    )
  }

  let aulaAutoAprobada: { id: string; nombre: string } | null = null
  if (parsed.data.aulaId) {
    const aula = await prisma.aula.findUnique({
      where: { id: parsed.data.aulaId },
    })
    if (!aula || !aula.habilitada) {
      return NextResponse.json(
        { error: "El aula elegida no existe o no está habilitada." },
        { status: 400 }
      )
    }
    if (!aula.requiereAprobacion) {
      aulaAutoAprobada = aula
    }
  }

  const dias = parsed.data.dias ?? []
  const { horaInicio, horaFin } = parsed.data

  const solicitud = await prisma.solicitud.create({
    data: {
      claseId: clase.id,
      profesorId: clase.profesorId,
      tipoUso: parsed.data.tipoUso ?? TipoUso.CATEDRA,
      comentario: parsed.data.comentario ?? null,
      diasPreferidos: dias,
      horaInicioPreferida: horaInicio ?? null,
      horaFinPreferida: horaFin ?? null,
      ...(aulaAutoAprobada
        ? {
            estado: "APROBADA",
            aulaId: aulaAutoAprobada.id,
            resueltaAt: new Date(),
          }
        : {}),
    },
    include: {
      clase: { include: { materia: true } },
      profesor: true,
      aula: true,
    },
  })

  let horariosCreados = 0
  const horariosConflicto: { dia: string; motivo: string }[] = []
  const advertenciasBloqueo: { dia: string; mensaje: string }[] = []
  let alternativas: Awaited<ReturnType<typeof buscarAulasAlternativas>> = []

  if (aulaAutoAprobada) {
    await registrarCambioEstado({
      solicitudId: solicitud.id,
      estadoAnterior: null,
      estadoNuevo: "APROBADA",
      actorId: guard.session.userId,
      comentario: `Autoaprobada: ${aulaAutoAprobada.nombre} no requiere autorización manual.`,
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "SOLICITUD_AUTOAPROBADA",
      entidad: "Solicitud",
      entidadId: solicitud.id,
      detalle: `${solicitud.clase.materia.nombre} — aula ${aulaAutoAprobada.nombre}`,
    })

    if (dias.length > 0 && horaInicio && horaFin) {
      for (const dia of dias) {
        const resultado = await intentarCrearHorario({
          claseId: clase.id,
          aulaId: aulaAutoAprobada.id,
          dia,
          horaInicio,
          horaFin,
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
          horariosConflicto.push({
            dia: resultado.dia,
            motivo: resultado.motivo,
          })
          if (resultado.tipo === "conflicto" && alternativas.length === 0) {
            alternativas = await buscarAulasAlternativas({
              aulaId: aulaAutoAprobada.id,
              dia,
              horaInicio,
              horaFin,
            })
          }
        }
      }
    }

    await notificar({
      usuarioId: solicitud.profesorId,
      mensaje:
        horariosCreados > 0
          ? `Tu reserva de ${solicitud.clase.materia.nombre} en ${aulaAutoAprobada.nombre} fue confirmada, con ${horariosCreados} horario(s) recurrente(s) asignado(s).`
          : `Tu reserva de ${solicitud.clase.materia.nombre} en ${aulaAutoAprobada.nombre} fue confirmada automáticamente.`,
      solicitudId: solicitud.id,
    })
  } else {
    await registrarCambioEstado({
      solicitudId: solicitud.id,
      estadoAnterior: null,
      estadoNuevo: "PENDIENTE",
      actorId: guard.session.userId,
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "SOLICITUD_CREADA",
      entidad: "Solicitud",
      entidadId: solicitud.id,
      detalle: `${solicitud.clase.materia.nombre} — ${solicitud.profesor.nombre}`,
    })
    await notificarAdmins(
      `${solicitud.profesor.nombre} pidió un aula para ${solicitud.clase.materia.nombre}.`,
      solicitud.id
    )
  }

  return NextResponse.json(
    {
      ...shape(solicitud),
      horariosCreados,
      horariosConflicto,
      advertenciasBloqueo,
      alternativas,
    },
    { status: 201 }
  )
}
