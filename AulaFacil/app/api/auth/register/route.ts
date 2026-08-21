import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/session"

const registerSchema = z.object({
  nombre: z.string().trim().min(1),
  email: z.email().trim(),
  password: z.string().min(8),
  role: z.enum(["PROFESOR", "ALUMNO"]),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const { nombre, email, password, role } = parsed.data

  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) {
    return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash, role },
  })

  await createSession({ userId: usuario.id, role: usuario.role })

  return NextResponse.json(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.role },
    { status: 201 }
  )
}
