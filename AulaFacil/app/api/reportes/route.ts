import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { ReporteAula } from "@/lib/types"

function shape(r: {
  id: string
  aulaId: string
  usuarioId: string
  usuario: { nombre: string }
  descripcion: string
  estado: ReporteAula["estado"]
  createdAt: Date
  resueltaAt: Date | null
}): ReporteAula {
  return {
    id: r.id,
    aulaId: r.aulaId,
    usuarioId: r.usuarioId,
    usuarioNombre: r.usuario.nombre,
    descripcion: r.descripcion,
    estado: r.estado,
    createdAt: r.createdAt.toISOString(),
    resueltaAt: r.resueltaAt?.toISOString() ?? null,
  }
}

export async function GET(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const { searchParams } = new URL(request.url)
  const aulaId = searchParams.get("aulaId")
  if (!aulaId) {
    return NextResponse.json({ error: "Falta aulaId." }, { status: 400 })
  }

  const reportes = await prisma.reporteAula.findMany({
    where: { aulaId },
    include: { usuario: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(reportes.map(shape))
}

const createReporteSchema = z.object({
  aulaId: z.string().min(1),
  descripcion: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createReporteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const aula = await prisma.aula.findUnique({ where: { id: parsed.data.aulaId } })
  if (!aula) {
    return NextResponse.json({ error: "Aula inválida." }, { status: 400 })
  }

  const reporte = await prisma.reporteAula.create({
    data: {
      aulaId: parsed.data.aulaId,
      usuarioId: guard.session.userId,
      descripcion: parsed.data.descripcion,
    },
    include: { usuario: true },
  })

  return NextResponse.json(shape(reporte), { status: 201 })
}
