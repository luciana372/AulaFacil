import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getSession, type SessionPayload } from "@/lib/session"
import type { Role } from "@/lib/types"

export async function requireRole(
  ...roles: Role[]
): Promise<{ session: SessionPayload; error?: undefined } | { session?: undefined; error: NextResponse }> {
  const session = await getSession()
  if (!session) {
    return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) }
  }
  if (!roles.includes(session.role)) {
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) }
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { activo: true },
  })
  if (!usuario || !usuario.activo) {
    return { error: NextResponse.json({ error: "Tu cuenta está deshabilitada." }, { status: 403 }) }
  }

  return { session }
}
