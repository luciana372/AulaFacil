import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const registros = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
  })

  const csv = generarCSV(
    ["Fecha", "Acción", "Entidad", "Detalle", "Actor"],
    registros.map((r) => [
      r.createdAt.toISOString(),
      r.accion,
      r.entidad,
      r.detalle ?? "",
      r.actor?.nombre ?? "Sistema",
    ])
  )

  return respuestaCSV("auditoria.csv", csv)
}
