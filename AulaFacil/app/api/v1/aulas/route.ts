import { NextResponse } from "next/server"

import { autenticarApiKey } from "@/lib/api-keys"
import { bloqueosActivosHoyPorAula } from "@/lib/bloqueos"
import { prisma } from "@/lib/prisma"
import type { DiaSemana } from "@/lib/types"

// JS Date.getDay(): 0=domingo..6=sábado. Nuestro enum no tiene domingo.
const DIA_JS_A_DIASEMANA: Record<number, DiaSemana | null> = {
  0: null,
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

// API pública de solo lectura para sistemas externos de la universidad.
// Autenticación por header "x-api-key" (ver /dashboard/api-keys), no por sesión.
export async function GET(request: Request) {
  const apiKey = await autenticarApiKey(request)
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta o es inválido el header x-api-key." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const sedeId = searchParams.get("sedeId")

  const ahora = new Date()
  const diaHoy = DIA_JS_A_DIASEMANA[ahora.getDay()]
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  const [aulas, horariosDeHoy] = await Promise.all([
    prisma.aula.findMany({
      where: { habilitada: true, sedeId: sedeId ?? undefined },
      include: { sede: true },
      orderBy: { nombre: "asc" },
    }),
    diaHoy
      ? prisma.horario.findMany({ where: { dia: diaHoy } })
      : Promise.resolve([]),
  ])

  const ocupadasAhora = new Set(
    horariosDeHoy
      .filter(
        (h) =>
          minutosDesdeMedianoche(h.horaInicio) <= minutosAhora &&
          minutosAhora < minutosDesdeMedianoche(h.horaFin)
      )
      .map((h) => h.aulaId)
  )
  const bloqueosMap = await bloqueosActivosHoyPorAula(aulas.map((a) => a.id))

  return NextResponse.json(
    aulas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo,
      capacidad: a.capacidad,
      ubicacion: a.ubicacion,
      sedeId: a.sedeId,
      sedeNombre: a.sede?.nombre ?? null,
      disponibleAhora: !ocupadasAhora.has(a.id) && !bloqueosMap.has(a.id),
      bloqueoActivo: bloqueosMap.get(a.id) ?? null,
    }))
  )
}
