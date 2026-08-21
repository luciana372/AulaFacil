import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Recordatorio } from "@/lib/types"

function shape(r: { id: string; horarioId: string; minutosAntes: number }): Recordatorio {
  return { id: r.id, horarioId: r.horarioId, minutosAntes: r.minutosAntes }
}

export async function GET() {
  const guard = await requireRole("ALUMNO")
  if (guard.error) return guard.error

  const recordatorios = await prisma.recordatorio.findMany({
    where: { alumnoId: guard.session.userId },
  })
  return NextResponse.json(recordatorios.map(shape))
}

const createRecordatorioSchema = z.object({
  horarioId: z.string().min(1),
  minutosAntes: z.number().int().min(1).max(180).optional(),
})

export async function POST(request: Request) {
  const guard = await requireRole("ALUMNO")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createRecordatorioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const alumno = await prisma.usuario.findUnique({ where: { id: guard.session.userId } })
  const horario = await prisma.horario.findUnique({
    where: { id: parsed.data.horarioId },
    include: { clase: true },
  })
  if (!horario || !alumno?.carreraId || horario.clase.carreraId !== alumno.carreraId) {
    return NextResponse.json(
      { error: "Ese horario no corresponde a tu carrera." },
      { status: 400 }
    )
  }

  try {
    const recordatorio = await prisma.recordatorio.create({
      data: {
        alumnoId: guard.session.userId,
        horarioId: parsed.data.horarioId,
        minutosAntes: parsed.data.minutosAntes ?? 15,
      },
    })
    return NextResponse.json(shape(recordatorio), { status: 201 })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ya tenés un recordatorio para esa clase." },
        { status: 409 }
      )
    }
    throw err
  }
}
