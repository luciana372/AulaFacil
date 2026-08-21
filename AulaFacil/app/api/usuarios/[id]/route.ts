import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import { Role } from "@/lib/generated/prisma/enums"
import type { Usuario } from "@/lib/types"

function shape(u: {
  id: string
  nombre: string
  email: string
  role: Role
  activo: boolean
  createdAt: Date
  carreraId: string | null
  carrera: { nombre: string } | null
  penalizadoHasta: Date | null
}): Usuario {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    role: u.role,
    activo: u.activo,
    createdAt: u.createdAt.toISOString(),
    carreraId: u.carreraId,
    carreraNombre: u.carrera?.nombre ?? null,
    penalizadoHasta: u.penalizadoHasta?.toISOString() ?? null,
  }
}

const updateUsuarioSchema = z.object({
  role: z.enum(Role).optional(),
  activo: z.boolean().optional(),
  carreraId: z.string().nullable().optional(),
  quitarPenalizacion: z.literal(true).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params
  if (id === guard.session.userId) {
    return NextResponse.json(
      { error: "No podés modificar tu propia cuenta desde acá." },
      { status: 400 }
    )
  }

  const body = await request.json()
  const parsed = updateUsuarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }
  const { role, activo, carreraId, quitarPenalizacion } = parsed.data
  if (
    role === undefined &&
    activo === undefined &&
    carreraId === undefined &&
    quitarPenalizacion === undefined
  ) {
    return NextResponse.json(
      { error: "Nada para actualizar." },
      { status: 400 }
    )
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id } })
  if (!objetivo) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    )
  }

  if (carreraId !== undefined && carreraId !== null) {
    const rolEfectivo = role ?? objetivo.role
    if (rolEfectivo !== "ALUMNO") {
      return NextResponse.json(
        { error: "Solo los alumnos tienen carrera asignada." },
        { status: 400 }
      )
    }
    const carrera = await prisma.carrera.findUnique({
      where: { id: carreraId },
    })
    if (!carrera) {
      return NextResponse.json({ error: "Carrera inválida." }, { status: 400 })
    }
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        role,
        activo,
        carreraId,
        penalizadoHasta: quitarPenalizacion ? null : undefined,
      },
      include: { carrera: true },
    })

    const cambios: string[] = []
    if (role !== undefined && role !== objetivo.role)
      cambios.push(`rol → ${role}`)
    if (activo !== undefined && activo !== objetivo.activo) {
      cambios.push(activo ? "cuenta activada" : "cuenta desactivada")
    }
    if (carreraId !== undefined && carreraId !== objetivo.carreraId) {
      cambios.push(`carrera → ${usuario.carrera?.nombre ?? "sin asignar"}`)
    }
    if (cambios.length > 0) {
      await registrarAuditoria({
        actorId: guard.session.userId,
        accion: "USUARIO_MODIFICADO",
        entidad: "Usuario",
        entidadId: id,
        detalle: `${usuario.nombre} — ${cambios.join(", ")}`,
      })
    }
    if (quitarPenalizacion && objetivo.penalizadoHasta) {
      await registrarAuditoria({
        actorId: guard.session.userId,
        accion: "USUARIO_PENALIZACION_LEVANTADA",
        entidad: "Usuario",
        entidadId: id,
        detalle: usuario.nombre,
      })
    }

    return NextResponse.json(shape(usuario))
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      )
    }
    throw err
  }
}
