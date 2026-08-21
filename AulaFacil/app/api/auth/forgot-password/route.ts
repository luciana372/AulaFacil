import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { enviarEmailRecuperacion } from "@/lib/email"
import { prisma } from "@/lib/prisma"

const forgotPasswordSchema = z.object({
  email: z.email().trim(),
})

const MENSAJE_GENERICO =
  "Si ese email está registrado, te enviamos un link para restablecer tu contraseña."

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { email } = parsed.data

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  if (usuario && usuario.activo) {
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { usuarioId: usuario.id, token, expiresAt },
    })

    const origin = new URL(request.url).origin
    const link = `${origin}/reset-password?token=${token}`
    await enviarEmailRecuperacion(usuario.email, link)
  }

  return NextResponse.json({ message: MENSAJE_GENERICO })
}
