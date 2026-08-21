import "server-only"

import { enviarEmailRecordatorio } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import type { DiaSemana } from "@/lib/types"

// JS Date.getDay(): 0=domingo..6=sábado. Nuestro enum no tiene domingo.
const DIA_JS_A_DIASEMANA: Record<number, DiaSemana | null> = {
  0: null,
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

// Ancho de la ventana de detección: debe ser mayor al intervalo del scheduler
// para no perderse un recordatorio si el proceso tarda un poco en despertar.
const VENTANA_MINUTOS = 3

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export async function revisarRecordatorios() {
  const ahora = new Date()
  const dia = DIA_JS_A_DIASEMANA[ahora.getDay()]
  if (!dia) return

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const fecha = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()))

  const recordatorios = await prisma.recordatorio.findMany({
    where: { horario: { dia } },
    include: {
      horario: { include: { aula: true, clase: { include: { materia: true } } } },
      alumno: true,
    },
  })

  for (const r of recordatorios) {
    const minutosClase = minutosDesdeMedianoche(r.horario.horaInicio)
    const minutosFaltantes = minutosClase - minutosAhora
    const debeAvisar =
      minutosFaltantes <= r.minutosAntes && minutosFaltantes > r.minutosAntes - VENTANA_MINUTOS

    if (!debeAvisar) continue

    try {
      await prisma.recordatorioEnviado.create({
        data: { recordatorioId: r.id, fecha },
      })
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "P2002") {
        continue // ya se avisó hoy
      }
      throw err
    }

    await Promise.all([
      enviarEmailRecordatorio(r.alumno.email, {
        materia: r.horario.clase.materia.nombre,
        aula: r.horario.aula.nombre,
        horaInicio: r.horario.horaInicio,
        horaFin: r.horario.horaFin,
        minutosAntes: r.minutosAntes,
      }),
      prisma.notificacion.create({
        data: {
          usuarioId: r.alumnoId,
          mensaje: `En ${r.minutosAntes} minutos: ${r.horario.clase.materia.nombre} en ${r.horario.aula.nombre}.`,
        },
      }),
    ])
  }
}
