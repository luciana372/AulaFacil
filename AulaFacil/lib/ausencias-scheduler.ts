import "server-only"

import { registrarAuditoria } from "@/lib/auditoria"
import { prisma } from "@/lib/prisma"
import { notificar, notificarAdmins } from "@/lib/solicitud-eventos"
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

const MARGEN_MINUTOS = 20
const MS_POR_DIA = 24 * 60 * 60 * 1000

// 3+ ausencias en 30 días ⇒ prioridad mínima (por debajo de "uso libre") durante 15 días
const VENTANA_PENALIZACION_DIAS = 30
const UMBRAL_AUSENCIAS_PENALIZACION = 3
const DURACION_PENALIZACION_DIAS = 15

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export async function revisarAusencias() {
  const ahora = new Date()
  const dia = DIA_JS_A_DIASEMANA[ahora.getDay()]
  if (!dia) return

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const fecha = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()))

  const horarios = await prisma.horario.findMany({
    where: { dia },
    include: { aula: true, clase: { include: { materia: true, profesor: true } } },
  })

  for (const horario of horarios) {
    const minutosClase = minutosDesdeMedianoche(horario.horaInicio)
    if (minutosAhora < minutosClase + MARGEN_MINUTOS) continue

    const [ingreso, ausencia] = await Promise.all([
      prisma.ingreso.findUnique({ where: { horarioId_fecha: { horarioId: horario.id, fecha } } }),
      prisma.ausencia.findUnique({ where: { horarioId_fecha: { horarioId: horario.id, fecha } } }),
    ])
    if (ingreso || ausencia) continue

    try {
      await prisma.ausencia.create({ data: { horarioId: horario.id, fecha } })
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "P2002") {
        continue // otra corrida ya la registró
      }
      throw err
    }

    const mensaje = `${horario.clase.profesor.nombre} no hizo check-in en ${horario.clase.materia.nombre} (${horario.aula.nombre}, hoy ${horario.horaInicio}) — se registró como ausencia.`
    await Promise.all([
      notificar({
        usuarioId: horario.clase.profesorId,
        mensaje: `No registramos tu check-in en ${horario.clase.materia.nombre} de hoy (${horario.aula.nombre}, ${horario.horaInicio}). Se marcó como ausencia.`,
      }),
      notificarAdmins(mensaje),
    ])

    const haceUnMes = new Date(Date.now() - VENTANA_PENALIZACION_DIAS * MS_POR_DIA)
    const cantidadAusencias = await prisma.ausencia.count({
      where: {
        fecha: { gte: haceUnMes },
        horario: { clase: { profesorId: horario.clase.profesorId } },
      },
    })
    if (cantidadAusencias >= UMBRAL_AUSENCIAS_PENALIZACION) {
      const penalizadoHasta = new Date(Date.now() + DURACION_PENALIZACION_DIAS * MS_POR_DIA)
      await prisma.usuario.update({
        where: { id: horario.clase.profesorId },
        data: { penalizadoHasta },
      })
      await registrarAuditoria({
        actorId: null,
        accion: "USUARIO_PENALIZADO",
        entidad: "Usuario",
        entidadId: horario.clase.profesorId,
        detalle: `${cantidadAusencias} ausencias en los últimos ${VENTANA_PENALIZACION_DIAS} días — prioridad reducida hasta ${penalizadoHasta.toLocaleDateString("es-AR")}.`,
      })
      await notificar({
        usuarioId: horario.clase.profesorId,
        mensaje: `Por inasistencias reiteradas, tus solicitudes van a tener la prioridad más baja hasta el ${penalizadoHasta.toLocaleDateString("es-AR")}.`,
      })
    }

    // Avisamos a quien esperaba esta franja que hoy quedó libre — el Horario semanal sigue existiendo
    const esperas = await prisma.listaEsperaHorario.findMany({
      where: {
        aulaId: horario.aulaId,
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      },
      include: { clase: { include: { materia: true } } },
    })
    for (const espera of esperas) {
      await notificar({
        usuarioId: espera.clase.profesorId,
        mensaje: `${horario.aula.nombre} quedó libre hoy de ${horario.horaInicio} a ${horario.horaFin}: ${horario.clase.profesor.nombre} no se presentó. Es el horario que esperabas para ${espera.clase.materia.nombre}.`,
      })
    }
  }
}
