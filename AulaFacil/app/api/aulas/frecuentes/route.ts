import { NextResponse } from "next/server"

import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const conteo = new Map<string, { aulaId: string; aulaNombre: string; usos: number }>()

  if (guard.session.role === "PROFESOR") {
    const ingresos = await prisma.ingreso.findMany({
      where: { profesorId: guard.session.userId },
      include: { horario: { include: { aula: true } } },
    })
    for (const i of ingresos) {
      const actual = conteo.get(i.horario.aulaId)
      conteo.set(i.horario.aulaId, {
        aulaId: i.horario.aulaId,
        aulaNombre: i.horario.aula.nombre,
        usos: (actual?.usos ?? 0) + 1,
      })
    }
  } else {
    const usuario = await prisma.usuario.findUnique({
      where: { id: guard.session.userId },
    })
    if (usuario?.carreraId) {
      const horarios = await prisma.horario.findMany({
        where: { clase: { carreraId: usuario.carreraId } },
        include: { aula: true },
      })
      for (const h of horarios) {
        const actual = conteo.get(h.aulaId)
        conteo.set(h.aulaId, {
          aulaId: h.aulaId,
          aulaNombre: h.aula.nombre,
          usos: (actual?.usos ?? 0) + 1,
        })
      }
    }
  }

  const frecuentes = [...conteo.values()]
    .sort((a, b) => b.usos - a.usos)
    .slice(0, 5)

  return NextResponse.json(frecuentes)
}
