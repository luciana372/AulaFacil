import { NextResponse } from "next/server"

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

export async function GET(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")

  if (role && !Object.values(Role).includes(role as Role)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 })
  }

  const usuarios = await prisma.usuario.findMany({
    where: role ? { role: role as Role } : undefined,
    orderBy: { nombre: "asc" },
    include: { carrera: true },
  })
  return NextResponse.json(usuarios.map(shape))
}
