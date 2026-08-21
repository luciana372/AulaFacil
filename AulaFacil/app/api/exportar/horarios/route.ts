import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { DIA_LABEL } from "@/lib/types"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const horarios = await prisma.horario.findMany({
    include: {
      clase: { include: { materia: true, profesor: true } },
      aula: true,
    },
    orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
  })

  const csv = generarCSV(
    ["Materia", "Profesor", "Aula", "Día", "Desde", "Hasta", "Origen"],
    horarios.map((h) => [
      h.clase.materia.nombre,
      h.clase.profesor.nombre,
      h.aula.nombre,
      DIA_LABEL[h.dia],
      h.horaInicio,
      h.horaFin,
      h.origen,
    ])
  )

  return respuestaCSV("horarios.csv", csv)
}
