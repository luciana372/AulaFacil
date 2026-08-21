import "server-only"

import { advertenciaBloqueoFranja } from "@/lib/bloqueos"
import { getConfiguracion } from "@/lib/configuracion"
import { prisma } from "@/lib/prisma"
import type { DiaSemana, OrigenHorario } from "@/lib/generated/prisma/enums"

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export type ResultadoHorario =
  | { ok: true; dia: DiaSemana; horarioId: string; advertenciaBloqueo: string | null }
  | { ok: false; dia: DiaSemana; motivo: string; tipo: "duracion" | "conflicto" }

// Intenta crear un Horario respetando duración máxima y conflictos de aula+día+hora.
// No valida clase/aula (se asume ya validadas por quien llama).
export async function intentarCrearHorario(params: {
  claseId: string
  aulaId: string
  dia: DiaSemana
  horaInicio: string
  horaFin: string
  origen?: OrigenHorario
}): Promise<ResultadoHorario> {
  const { claseId, aulaId, dia, horaInicio, horaFin, origen = "MANUAL" } = params

  const config = await getConfiguracion()
  const duracionMinutos = minutosDesdeMedianoche(horaFin) - minutosDesdeMedianoche(horaInicio)
  if (duracionMinutos > config.duracionMaximaMinutos) {
    return {
      ok: false,
      dia,
      tipo: "duracion",
      motivo: `supera la duración máxima permitida (${config.duracionMaximaMinutos} min).`,
    }
  }

  const existentes = await prisma.horario.findMany({ where: { aulaId, dia } })
  const conflicto = existentes.some((h) => horaInicio < h.horaFin && h.horaInicio < horaFin)
  if (conflicto) {
    return { ok: false, dia, tipo: "conflicto", motivo: "el aula ya está ocupada en ese horario." }
  }

  try {
    const horario = await prisma.horario.create({
      data: { claseId, aulaId, dia, horaInicio, horaFin, origen },
    })
    const advertenciaBloqueo = await advertenciaBloqueoFranja(aulaId, dia)
    return { ok: true, dia, horarioId: horario.id, advertenciaBloqueo }
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return { ok: false, dia, tipo: "conflicto", motivo: "el aula ya está ocupada en ese horario." }
    }
    throw err
  }
}

export async function buscarAulasAlternativas(params: {
  aulaId: string
  dia: DiaSemana
  horaInicio: string
  horaFin: string
}) {
  const { aulaId, dia, horaInicio, horaFin } = params
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
  return otrasHabilitadas
    .filter((a) => !ocupadas.has(a.id))
    .slice(0, 5)
    .map((a) => ({ id: a.id, nombre: a.nombre, capacidad: a.capacidad, tipo: a.tipo }))
}
