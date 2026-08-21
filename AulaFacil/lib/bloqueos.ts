import "server-only"

import { prisma } from "@/lib/prisma"
import type { DiaSemana } from "@/lib/types"

const DIA_A_JS: Record<DiaSemana, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
}

function hoyComoFecha(): Date {
  const hoy = new Date()
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
}

// Motivo del bloqueo activo hoy para un aula puntual (propio o global), o null si no hay ninguno.
export async function bloqueoActivoHoy(aulaId: string): Promise<string | null> {
  const fecha = hoyComoFecha()
  const bloqueo = await prisma.bloqueoFecha.findFirst({
    where: {
      fechaInicio: { lte: fecha },
      fechaFin: { gte: fecha },
      OR: [{ aulaId }, { aulaId: null }],
    },
    orderBy: { createdAt: "desc" },
  })
  return bloqueo?.motivo ?? null
}

// Igual que bloqueoActivoHoy pero en lote, para no hacer una consulta por aula.
export async function bloqueosActivosHoyPorAula(
  aulaIds: string[]
): Promise<Map<string, string>> {
  const fecha = hoyComoFecha()
  const bloqueos = await prisma.bloqueoFecha.findMany({
    where: { fechaInicio: { lte: fecha }, fechaFin: { gte: fecha } },
  })
  const global = bloqueos.find((b) => b.aulaId === null)
  const mapa = new Map<string, string>()
  for (const aulaId of aulaIds) {
    const especifico = bloqueos.find((b) => b.aulaId === aulaId)
    const motivo = especifico?.motivo ?? global?.motivo
    if (motivo) mapa.set(aulaId, motivo)
  }
  return mapa
}

function rangoIncluyeDia(inicio: Date, fin: Date, dia: DiaSemana): boolean {
  const diaJs = DIA_A_JS[dia]
  const cursor = new Date(inicio)
  // Los bloqueos son rangos acotados (feriados/semanas puntuales); 370 cubre de sobra el peor caso.
  for (let i = 0; i < 370 && cursor <= fin; i++) {
    if (cursor.getUTCDay() === diaJs) return true
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return false
}

// Advertencia (no bloqueante) para cuando se crea un Horario recurrente: avisa si ese
// aula+día cae dentro de un bloqueo vigente o futuro (feriado, semana de exámenes, evento),
// sin impedir la creación — el Horario sigue siendo válido el resto del año.
export async function advertenciaBloqueoFranja(
  aulaId: string,
  dia: DiaSemana
): Promise<string | null> {
  const hoy = hoyComoFecha()
  const bloqueos = await prisma.bloqueoFecha.findMany({
    where: {
      fechaFin: { gte: hoy },
      OR: [{ aulaId }, { aulaId: null }],
    },
    orderBy: { fechaInicio: "asc" },
  })
  for (const b of bloqueos) {
    if (rangoIncluyeDia(b.fechaInicio, b.fechaFin, dia)) {
      const desde = b.fechaInicio.toISOString().slice(0, 10)
      const hasta = b.fechaFin.toISOString().slice(0, 10)
      return `${b.motivo} (${desde} a ${hasta})`
    }
  }
  return null
}
