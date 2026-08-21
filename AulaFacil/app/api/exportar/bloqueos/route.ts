import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const bloqueos = await prisma.bloqueoFecha.findMany({
    include: { aula: true, creadoPor: true },
    orderBy: { fechaInicio: "desc" },
  })

  const csv = generarCSV(
    ["Motivo", "Aula", "Desde", "Hasta", "Creado por", "Creado"],
    bloqueos.map((b) => [
      b.motivo,
      b.aula?.nombre ?? "Todas las aulas",
      b.fechaInicio.toISOString().slice(0, 10),
      b.fechaFin.toISOString().slice(0, 10),
      b.creadoPor.nombre,
      b.createdAt.toISOString(),
    ])
  )

  return respuestaCSV("bloqueos.csv", csv)
}
