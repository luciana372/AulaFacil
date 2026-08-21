import { NextResponse } from "next/server"

import { registrarAuditoria } from "@/lib/auditoria"
import { enviarEmailAulaLiberada } from "@/lib/email"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import { DIA_LABEL } from "@/lib/types"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params

  const horario = await prisma.horario.findUnique({
    where: { id },
    include: { aula: true, clase: { include: { materia: true } } },
  })
  if (!horario) {
    return NextResponse.json(
      { error: "Horario no encontrado." },
      { status: 404 }
    )
  }

  await prisma.horario.delete({ where: { id } })
  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "HORARIO_ELIMINADO",
    entidad: "Horario",
    entidadId: id,
    detalle: `${horario.clase.materia.nombre} — ${horario.aula.nombre}, ${DIA_LABEL[horario.dia]} ${horario.horaInicio}-${horario.horaFin}`,
  })

  const esperas = await prisma.listaEsperaHorario.findMany({
    where: {
      aulaId: horario.aulaId,
      dia: horario.dia,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
    },
    include: { clase: { include: { materia: true, profesor: true } } },
  })

  for (const espera of esperas) {
    await Promise.all([
      enviarEmailAulaLiberada(espera.clase.profesor.email, {
        materia: espera.clase.materia.nombre,
        aula: horario.aula.nombre,
        dia: DIA_LABEL[horario.dia],
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      }),
      prisma.notificacion.create({
        data: {
          usuarioId: espera.clase.profesorId,
          mensaje: `Se liberó ${horario.aula.nombre} los ${DIA_LABEL[horario.dia]} de ${horario.horaInicio} a ${horario.horaFin} — el horario que esperabas para ${espera.clase.materia.nombre}.`,
        },
      }),
    ])
    await prisma.listaEsperaHorario.delete({ where: { id: espera.id } })
  }

  return NextResponse.json({ ok: true, avisados: esperas.length })
}
