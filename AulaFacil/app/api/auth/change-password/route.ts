import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const body = await request.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { currentPassword, newPassword } = parsed.data

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const passwordOk = await bcrypt.compare(currentPassword, usuario.passwordHash)
  if (!passwordOk) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash } })

  return NextResponse.json({ ok: true })
}
