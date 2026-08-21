import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import { DiaSemana } from "@/lib/generated/prisma/enums"
import type { EsperaHorario } from "@/lib/types"

function shape(e: {
  id: string
  claseId: string
  clase: { materia: { nombre: string }; profesor: { nombre: string } }
  aulaId: string
  aula: { nombre: string }
  dia: EsperaHorario["dia"]
  horaInicio: string
  horaFin: string
  createdAt: Date
}): EsperaHorario {
  return {
    id: e.id,
    claseId: e.claseId,
    claseNombre: e.clase.materia.nombre,
    profesorNombre: e.clase.profesor.nombre,
    aulaId: e.aulaId,
    aulaNombre: e.aula.nombre,
    dia: e.dia,
    horaInicio: e.horaInicio,
    horaFin: e.horaFin,
    createdAt: e.createdAt.toISOString(),
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const esperas = await prisma.listaEsperaHorario.findMany({
    where:
      guard.session.role === "PROFESOR"
        ? { clase: { profesorId: guard.session.userId } }
        : undefined,
    include: { clase: { include: { materia: true, profesor: true } }, aula: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(esperas.map(shape))
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const createEsperaSchema = z.object({
  claseId: z.string().min(1),
  aulaId: z.string().min(1),
  dia: z.enum(DiaSemana),
  horaInicio: z.string().regex(timeRegex),
  horaFin: z.string().regex(timeRegex),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createEsperaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const [clase, aula] = await Promise.all([
    prisma.clase.findUnique({ where: { id: parsed.data.claseId } }),
    prisma.aula.findUnique({ where: { id: parsed.data.aulaId } }),
  ])
  if (!clase) {
    return NextResponse.json({ error: "Clase inválida." }, { status: 400 })
  }
  if (!aula) {
    return NextResponse.json({ error: "Aula inválida." }, { status: 400 })
  }
  if (guard.session.role === "PROFESOR" && clase.profesorId !== guard.session.userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  try {
    const espera = await prisma.listaEsperaHorario.create({
      data: parsed.data,
      include: { clase: { include: { materia: true, profesor: true } }, aula: true },
    })
    return NextResponse.json(shape(espera), { status: 201 })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Esa clase ya está en la lista de espera para ese horario." },
        { status: 409 }
      )
    }
    throw err
  }
}
