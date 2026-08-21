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

const resolveSchema = z.object({
  estado: z.literal("RESUELTO"),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const reporte = await prisma.reporteAula.update({
      where: { id },
      data: { estado: "RESUELTO", resueltaAt: new Date() },
      include: { usuario: true },
    })
    return NextResponse.json(shape(reporte))
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 })
    }
    throw err
  }
}
