import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const solicitudes = await prisma.solicitud.findMany({
    include: {
      clase: { include: { materia: true, carrera: true } },
      profesor: true,
      aula: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const csv = generarCSV(
    [
      "Materia",
      "Profesor",
      "Carrera",
      "Aula",
      "Estado",
      "Comentario",
      "Creada",
      "Resuelta",
    ],
    solicitudes.map((s) => [
      s.clase.materia.nombre,
      s.profesor.nombre,
      s.clase.carrera.nombre,
      s.aula?.nombre ?? "",
      s.estado,
      s.comentario ?? "",
      s.createdAt.toISOString(),
      s.resueltaAt?.toISOString() ?? "",
    ])
  )

  return respuestaCSV("solicitudes.csv", csv)
}
