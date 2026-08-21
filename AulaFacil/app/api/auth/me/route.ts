import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  return NextResponse.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    role: usuario.role,
  })
}
