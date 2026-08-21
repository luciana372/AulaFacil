import { requireRole } from "@/lib/auth-guard"
import { generarCSV, respuestaCSV } from "@/lib/csv"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const [ingresos, ausencias] = await Promise.all([
    prisma.ingreso.findMany({
      include: {
        profesor: true,
        horario: {
          include: { aula: true, clase: { include: { materia: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.ausencia.findMany({
      include: {
        horario: {
          include: {
            aula: true,
            clase: { include: { materia: true, profesor: true } },
          },
        },
      },
      orderBy: { fecha: "desc" },
    }),
  ])

  const filas = [
    ...ingresos.map((i) => [
      i.fecha.toISOString().slice(0, 10),
      "Check-in",
      i.horario.clase.materia.nombre,
      i.profesor.nombre,
      i.horario.aula.nombre,
      `${i.horario.horaInicio}-${i.horario.horaFin}`,
    ]),
    ...ausencias.map((a) => [
      a.fecha.toISOString().slice(0, 10),
      "Ausencia",
      a.horario.clase.materia.nombre,
      a.horario.clase.profesor.nombre,
      a.horario.aula.nombre,
      `${a.horario.horaInicio}-${a.horario.horaFin}`,
    ]),
  ].sort((a, b) => (a[0] < b[0] ? 1 : -1))

  const csv = generarCSV(
    ["Fecha", "Tipo", "Materia", "Profesor", "Aula", "Horario"],
    filas
  )

  return respuestaCSV("asistencias.csv", csv)
}
