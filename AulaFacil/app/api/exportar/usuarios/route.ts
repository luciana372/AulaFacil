import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const usuarios = await prisma.usuario.findMany({
    include: { carrera: true },
    orderBy: { createdAt: "asc" },
  })

  const csv = generarCSV(
    ["Nombre", "Email", "Rol", "Activo", "Carrera", "Creado"],
    usuarios.map((u) => [
      u.nombre,
      u.email,
      u.role,
      u.activo ? "Sí" : "No",
      u.carrera?.nombre ?? "",
      u.createdAt.toISOString(),
    ])
  )

  return respuestaCSV("usuarios.csv", csv)
}
