import { NextResponse } from "next/server"

import { autenticarApiKey } from "@/lib/api-keys"
import { prisma } from "@/lib/prisma"
import { DiaSemana } from "@/lib/generated/prisma/enums"

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
  const aulaId = searchParams.get("aulaId")
  const sedeId = searchParams.get("sedeId")
  const diaParam = searchParams.get("dia")
  const dia =
    diaParam && (Object.values(DiaSemana) as string[]).includes(diaParam)
      ? (diaParam as DiaSemana)
      : undefined
  if (diaParam && !dia) {
    return NextResponse.json({ error: "Parámetro 'dia' inválido." }, { status: 400 })
  }

  const horarios = await prisma.horario.findMany({
    where: {
      aulaId: aulaId ?? undefined,
      dia,
      aula: sedeId ? { sedeId } : undefined,
    },
    include: {
      clase: { include: { materia: true, profesor: true } },
      aula: { include: { sede: true } },
    },
    orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
  })

  return NextResponse.json(
    horarios.map((h) => ({
      id: h.id,
      aulaId: h.aulaId,
      aulaNombre: h.aula.nombre,
      sedeId: h.aula.sedeId,
      sedeNombre: h.aula.sede?.nombre ?? null,
      materia: h.clase.materia.nombre,
      profesor: h.clase.profesor.nombre,
      dia: h.dia,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      origen: h.origen,
    }))
  )
}
