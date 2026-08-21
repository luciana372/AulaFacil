import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const reportes = await prisma.reporteAula.findMany({
    include: { aula: true, usuario: true },
    orderBy: { createdAt: "desc" },
  })

  const csv = generarCSV(
    ["Aula", "Usuario", "Descripción", "Estado", "Creado", "Resuelto"],
    reportes.map((r) => [
      r.aula.nombre,
      r.usuario.nombre,
      r.descripcion,
      r.estado,
      r.createdAt.toISOString(),
      r.resueltaAt?.toISOString() ?? "",
    ])
  )

  return respuestaCSV("reportes.csv", csv)
}
