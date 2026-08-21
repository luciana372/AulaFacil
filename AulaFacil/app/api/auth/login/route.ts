import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/session"

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
})

const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 15

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { email, password } = parsed.data

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  if (usuario?.lockedUntil && usuario.lockedUntil > new Date()) {
    const minutosRestantes = Math.ceil(
      (usuario.lockedUntil.getTime() - Date.now()) / 60_000
    )
    return NextResponse.json(
      {
        error: `Demasiados intentos fallidos. Probá de nuevo en ${minutosRestantes} minuto${minutosRestantes === 1 ? "" : "s"}.`,
      },
      { status: 429 }
    )
  }

  const passwordOk = usuario && (await bcrypt.compare(password, usuario.passwordHash))
  if (!usuario || !passwordOk) {
    if (usuario) {
      const intentos = usuario.failedLoginAttempts + 1
      if (intentos >= MAX_INTENTOS) {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + BLOQUEO_MINUTOS * 60_000),
          },
        })
        return NextResponse.json(
          {
            error: `Demasiados intentos fallidos. Tu cuenta queda bloqueada ${BLOQUEO_MINUTOS} minutos.`,
          },
          { status: 429 }
        )
      }
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { failedLoginAttempts: intentos },
      })
    }
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 })
  }

  if (!usuario.activo) {
    return NextResponse.json(
      { error: "Tu cuenta está deshabilitada. Contactá al administrador." },
      { status: 403 }
    )
  }

  if (usuario.failedLoginAttempts > 0 || usuario.lockedUntil) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })
  }

  await createSession({ userId: usuario.id, role: usuario.role })

  return NextResponse.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    role: usuario.role,
  })
}
