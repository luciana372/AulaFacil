import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const aulas = await prisma.aula.findMany({
    include: { sede: true },
    orderBy: { nombre: "asc" },
  })

  const csv = generarCSV(
    [
      "Nombre",
      "Sede",
      "Tipo",
      "Capacidad",
      "Ubicación",
      "Equipamiento",
      "Habilitada",
      "Motivo bloqueo",
      "Requiere aprobación",
      "Creada",
    ],
    aulas.map((a) => [
      a.nombre,
      a.sede?.nombre ?? "",
      a.tipo,
      a.capacidad,
      a.ubicacion ?? "",
      a.equipamiento.join("; "),
      a.habilitada ? "Sí" : "No",
      a.motivoBloqueo ?? "",
      a.requiereAprobacion ? "Sí" : "No",
      a.createdAt.toISOString(),
    ])
  )

  return respuestaCSV("aulas.csv", csv)
}
