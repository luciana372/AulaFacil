import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const clases = await prisma.clase.findMany({
    include: { materia: true, profesor: true, carrera: true },
    orderBy: { createdAt: "asc" },
  })

  const csv = generarCSV(
    ["Materia", "Profesor", "Email profesor", "Carrera", "Creada"],
    clases.map((c) => [
      c.materia.nombre,
      c.profesor.nombre,
      c.profesor.email,
      c.carrera.nombre,
      c.createdAt.toISOString(),
    ])
  )

  return respuestaCSV("clases.csv", csv)
}
