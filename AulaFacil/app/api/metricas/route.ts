import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { EstadoSolicitud } from "@/lib/types"

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

const MS_POR_DIA = 24 * 60 * 60 * 1000
const MS_POR_SEMANA = 7 * MS_POR_DIA
const SEMANAS_ASISTENCIA = 8

// Lunes (UTC) de la semana a la que pertenece la fecha dada.
function inicioDeSemana(fecha: Date): string {
  const diaJs = fecha.getUTCDay() // 0=domingo..6=sábado
  const offset = diaJs === 0 ? 6 : diaJs - 1
  const lunes = new Date(fecha)
  lunes.setUTCDate(lunes.getUTCDate() - offset)
  return lunes.toISOString().slice(0, 10)
}

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const desdeAsistencia = new Date(
    Date.now() - SEMANAS_ASISTENCIA * MS_POR_SEMANA
  )

  const [horarios, solicitudesPorEstado, ingresos, ausencias, valoraciones, reportes] =
    await Promise.all([
      prisma.horario.findMany({ include: { aula: true } }),
      prisma.solicitud.groupBy({ by: ["estado"], _count: { id: true } }),
      prisma.ingreso.findMany({ where: { fecha: { gte: desdeAsistencia } } }),
      prisma.ausencia.findMany({ where: { fecha: { gte: desdeAsistencia } } }),
      prisma.valoracion.groupBy({
        by: ["aulaId"],
        _avg: { puntaje: true },
        _count: { puntaje: true },
      }),
      prisma.reporteAula.groupBy({ by: ["aulaId"], _count: { id: true } }),
    ])

  // Ocupación semanal por aula (horas reservadas / semana)
  const horasPorAula = new Map<string, { nombre: string; horas: number }>()
  for (const h of horarios) {
    const minutos =
      minutosDesdeMedianoche(h.horaFin) - minutosDesdeMedianoche(h.horaInicio)
    const actual = horasPorAula.get(h.aulaId) ?? { nombre: h.aula.nombre, horas: 0 }
    actual.horas += minutos / 60
    horasPorAula.set(h.aulaId, actual)
  }
  const ocupacionPorAula = [...horasPorAula.values()]
    .map((a) => ({ aula: a.nombre, horas: Math.round(a.horas * 10) / 10 }))
    .sort((a, b) => b.horas - a.horas)
    .slice(0, 8)

  // Horarios por franja horaria (pico de uso), solo horas con al menos un horario
  const conteoPorHora = new Map<number, number>()
  for (const h of horarios) {
    const hora = Math.floor(minutosDesdeMedianoche(h.horaInicio) / 60)
    conteoPorHora.set(hora, (conteoPorHora.get(hora) ?? 0) + 1)
  }
  const horariosPorHora = [...conteoPorHora.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hora, cantidad]) => ({ hora: `${String(hora).padStart(2, "0")}:00`, cantidad }))

  // Solicitudes por estado (histórico completo)
  const ESTADOS: EstadoSolicitud[] = ["PENDIENTE", "APROBADA", "RECHAZADA", "CANCELADA"]
  const mapaEstado = new Map(solicitudesPorEstado.map((s) => [s.estado, s._count.id]))
  const solicitudesEstado = ESTADOS.map((estado) => ({
    estado,
    cantidad: mapaEstado.get(estado) ?? 0,
  }))
  const aprobadas = mapaEstado.get("APROBADA") ?? 0
  const rechazadas = mapaEstado.get("RECHAZADA") ?? 0
  const tasaAprobacion =
    aprobadas + rechazadas > 0
      ? Math.round((aprobadas / (aprobadas + rechazadas)) * 100)
      : null

  // Asistencia semanal (check-in vs ausencia), últimas 8 semanas
  const semanasMap = new Map<string, { ingresos: number; ausencias: number }>()
  for (const i of ingresos) {
    const semana = inicioDeSemana(i.fecha)
    const actual = semanasMap.get(semana) ?? { ingresos: 0, ausencias: 0 }
    actual.ingresos++
    semanasMap.set(semana, actual)
  }
  for (const a of ausencias) {
    const semana = inicioDeSemana(a.fecha)
    const actual = semanasMap.get(semana) ?? { ingresos: 0, ausencias: 0 }
    actual.ausencias++
    semanasMap.set(semana, actual)
  }
  const asistenciaSemanal = [...semanasMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([semana, v]) => ({
      semana: `${semana.slice(8, 10)}/${semana.slice(5, 7)}`,
      ...v,
    }))
  const totalIngresos = ingresos.length
  const totalAusencias = ausencias.length
  const tasaAsistencia =
    totalIngresos + totalAusencias > 0
      ? Math.round((totalIngresos / (totalIngresos + totalAusencias)) * 100)
      : null

  // Rankings: valoración y reportes por aula
  const aulaIds = [
    ...new Set([...valoraciones.map((v) => v.aulaId), ...reportes.map((r) => r.aulaId)]),
  ]
  const aulasNombre = new Map(
    (await prisma.aula.findMany({ where: { id: { in: aulaIds } } })).map((a) => [
      a.id,
      a.nombre,
    ])
  )
  const aulasValoracion = valoraciones
    .map((v) => ({
      aula: aulasNombre.get(v.aulaId) ?? "—",
      promedio: Math.round((v._avg.puntaje ?? 0) * 10) / 10,
      cantidad: v._count.puntaje,
    }))
    .sort((a, b) => b.promedio - a.promedio)
    .slice(0, 5)
  const reportesMap = new Map(reportes.map((r) => [r.aulaId, r._count.id]))
  const aulasReportes = [...reportesMap.entries()]
    .map(([aulaId, total]) => ({ aula: aulasNombre.get(aulaId) ?? "—", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return NextResponse.json({
    kpis: {
      tasaAprobacion,
      tasaAsistencia,
      aulaMasOcupada: ocupacionPorAula[0] ?? null,
      aulaMejorValorada: aulasValoracion[0] ?? null,
    },
    ocupacionPorAula,
    horariosPorHora,
    solicitudesEstado,
    asistenciaSemanal,
    aulasValoracion,
    aulasReportes,
  })
}
