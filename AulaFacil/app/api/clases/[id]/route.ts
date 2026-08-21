import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import type { Clase } from "@/lib/types"

function shape(clase: {
  id: string
  materiaId: string
  materia: { nombre: string }
  profesorId: string
  profesor: { nombre: string }
  carreraId: string
  carrera: { nombre: string }
}): Clase {
  return {
    id: clase.id,
    materiaId: clase.materiaId,
    materiaNombre: clase.materia.nombre,
    profesorId: clase.profesorId,
    profesorNombre: clase.profesor.nombre,
    carreraId: clase.carreraId,
    carreraNombre: clase.carrera.nombre,
  }
}

const patchClaseSchema = z.object({
  carreraId: z.string().min(1),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json()
  const parsed = patchClaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const carrera = await prisma.carrera.findUnique({ where: { id: parsed.data.carreraId } })
  if (!carrera) {
    return NextResponse.json({ error: "Carrera inválida." }, { status: 400 })
  }

  try {
    const clase = await prisma.clase.update({
      where: { id },
      data: { carreraId: parsed.data.carreraId },
      include: { materia: true, profesor: true, carrera: true },
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "CLASE_MODIFICADA",
      entidad: "Clase",
      entidadId: id,
      detalle: `${clase.materia.nombre} — carrera → ${clase.carrera.nombre}`,
    })
    return NextResponse.json(shape(clase))
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json({ error: "Clase no encontrada." }, { status: 404 })
    }
    throw err
  }
}
