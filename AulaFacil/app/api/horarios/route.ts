import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { advertenciaBloqueoFranja } from "@/lib/bloqueos"
import { getConfiguracion } from "@/lib/configuracion"
import { prisma } from "@/lib/prisma"
import { DiaSemana } from "@/lib/generated/prisma/enums"
import type { Horario } from "@/lib/types"

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

function shape(h: {
  id: string
  claseId: string
  clase: { materia: { nombre: string } }
  aulaId: string
  aula: { nombre: string }
  dia: Horario["dia"]
  horaInicio: string
  horaFin: string
  origen: Horario["origen"]
}): Horario {
  return {
    id: h.id,
    claseId: h.claseId,
    claseNombre: h.clase.materia.nombre,
    aulaId: h.aulaId,
    aulaNombre: h.aula.nombre,
    dia: h.dia,
    horaInicio: h.horaInicio,
    horaFin: h.horaFin,
    origen: h.origen,
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  let where
  if (guard.session.role === "ALUMNO") {
    const alumno = await prisma.usuario.findUnique({
      where: { id: guard.session.userId },
    })
    where = alumno?.carreraId
      ? { clase: { carreraId: alumno.carreraId } }
      : { id: "__ninguno__" }
  } else if (guard.session.role === "PROFESOR") {
    where = { clase: { profesorId: guard.session.userId } }
  }

  const horarios = await prisma.horario.findMany({
    where,
    include: { clase: { include: { materia: true } }, aula: true },
    orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
  })
  return NextResponse.json(horarios.map(shape))
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const createHorarioSchema = z
  .object({
    claseId: z.string().min(1),
    aulaId: z.string().min(1),
    dia: z.enum(DiaSemana),
    horaInicio: z.string().regex(timeRegex),
    horaFin: z.string().regex(timeRegex),
  })
  .refine((d) => d.horaInicio < d.horaFin, {
    message: "El horario de inicio debe ser anterior al de fin.",
    path: ["horaFin"],
  })

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createHorarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }
  const { claseId, aulaId, dia, horaInicio, horaFin } = parsed.data

  const [clase, aula] = await Promise.all([
    prisma.clase.findUnique({ where: { id: claseId } }),
    prisma.aula.findUnique({ where: { id: aulaId } }),
  ])
  if (!clase) {
    return NextResponse.json({ error: "Clase inválida." }, { status: 400 })
  }
  if (!aula || !aula.habilitada) {
    return NextResponse.json(
      { error: "El aula elegida no existe o no está habilitada." },
      { status: 400 }
    )
  }

  const config = await getConfiguracion()
  const duracionMinutos =
    minutosDesdeMedianoche(horaFin) - minutosDesdeMedianoche(horaInicio)
  if (duracionMinutos > config.duracionMaximaMinutos) {
    return NextResponse.json(
      {
        error: `La duración máxima permitida por reserva es de ${config.duracionMaximaMinutos} minutos (esta franja dura ${duracionMinutos}).`,
      },
      { status: 400 }
    )
  }

  const existentes = await prisma.horario.findMany({ where: { aulaId, dia } })
  const conflicto = existentes.some(
    (h) => horaInicio < h.horaFin && h.horaInicio < horaFin
  )
  if (conflicto) {
    const otrasHabilitadas = await prisma.aula.findMany({
      where: { habilitada: true, id: { not: aulaId } },
    })
    const horariosDelDia = await prisma.horario.findMany({
      where: { dia, aulaId: { in: otrasHabilitadas.map((a) => a.id) } },
    })
    const ocupadas = new Set(
      horariosDelDia
        .filter((h) => horaInicio < h.horaFin && h.horaInicio < horaFin)
        .map((h) => h.aulaId)
    )
    const alternativas = otrasHabilitadas
      .filter((a) => !ocupadas.has(a.id))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        nombre: a.nombre,
        capacidad: a.capacidad,
        tipo: a.tipo,
      }))

    return NextResponse.json(
      {
        error: "Ese aula ya tiene una clase asignada en ese día y horario.",
        alternativas,
      },
      { status: 409 }
    )
  }

  try {
    const horario = await prisma.horario.create({
      data: { claseId, aulaId, dia, horaInicio, horaFin },
      include: { clase: { include: { materia: true } }, aula: true },
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "HORARIO_CREADO",
      entidad: "Horario",
      entidadId: horario.id,
      detalle: `${horario.clase.materia.nombre} — ${horario.aula.nombre}, ${dia} ${horaInicio}-${horaFin}`,
    })
    const advertenciaBloqueo = await advertenciaBloqueoFranja(aulaId, dia)
    return NextResponse.json(
      { ...shape(horario), advertenciaBloqueo },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ese aula ya tiene una clase asignada en ese día y horario." },
        { status: 409 }
      )
    }
    throw err
  }
}
