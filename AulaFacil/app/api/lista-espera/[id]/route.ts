import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN", "PROFESOR")
  if (guard.error) return guard.error

  const { id } = await params

  if (guard.session.role === "PROFESOR") {
    const espera = await prisma.listaEsperaHorario.findUnique({
      where: { id },
      include: { clase: true },
    })
    if (!espera) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 })
    }
    if (espera.clase.profesorId !== guard.session.userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }
  }

  try {
    await prisma.listaEsperaHorario.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 })
    }
    throw err
  }
}
