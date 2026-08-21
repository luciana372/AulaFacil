import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { token, password } = parsed.data

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: "El link de recuperación no es válido o venció. Pedí uno nuevo." },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: resetToken.usuarioId },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true })
}
