import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import { TipoEquipamiento } from "@/lib/generated/prisma/enums"
import { notificar, registrarCambioEstado } from "@/lib/solicitud-eventos"

const updateAulaSchema = z.object({
  habilitada: z.boolean().optional(),
  motivoBloqueo: z.string().trim().min(1).nullable().optional(),
  equipamiento: z.array(z.enum(TipoEquipamiento)).optional(),
  requiereAprobacion: z.boolean().optional(),
  sedeId: z.string().min(1).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const { id } = await params
  const body = await request.json()
  const parsed = updateAulaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }
  if (
    parsed.data.habilitada === undefined &&
    parsed.data.equipamiento === undefined &&
    parsed.data.requiereAprobacion === undefined &&
    parsed.data.sedeId === undefined
  ) {
    return NextResponse.json(
      { error: "Nada para actualizar." },
      { status: 400 }
    )
  }

  if (parsed.data.sedeId) {
    const sede = await prisma.sede.findUnique({
      where: { id: parsed.data.sedeId },
    })
    if (!sede) {
      return NextResponse.json({ error: "Sede inválida." }, { status: 400 })
    }
  }

  try {
    const aula = await prisma.aula.update({
      where: { id },
      data: {
        habilitada: parsed.data.habilitada,
        motivoBloqueo:
          parsed.data.habilitada === false
            ? (parsed.data.motivoBloqueo ?? null)
            : parsed.data.habilitada === true
              ? null
              : undefined,
        equipamiento: parsed.data.equipamiento,
        requiereAprobacion: parsed.data.requiereAprobacion,
        sedeId: parsed.data.sedeId,
      },
    })

    await registrarAuditoria({
      actorId: guard.session.userId,
      accion:
        parsed.data.habilitada === true
          ? "AULA_HABILITADA"
          : parsed.data.habilitada === false
            ? "AULA_DESHABILITADA"
            : "AULA_MODIFICADA",
      entidad: "Aula",
      entidadId: id,
      detalle:
        parsed.data.habilitada === false && aula.motivoBloqueo
          ? `${aula.nombre} — ${aula.motivoBloqueo}`
          : aula.nombre,
    })

    if (parsed.data.habilitada === false) {
      const comentario = aula.motivoBloqueo
        ? `Rechazada automáticamente: el aula fue deshabilitada (${aula.motivoBloqueo}).`
        : "Rechazada automáticamente: el aula fue deshabilitada."
      const afectadas = await prisma.solicitud.findMany({
        where: { aulaId: id, estado: "APROBADA" },
        include: { clase: { include: { materia: true } } },
      })
      for (const s of afectadas) {
        await prisma.solicitud.update({
          where: { id: s.id },
          data: { estado: "RECHAZADA", comentario, resueltaAt: new Date() },
        })
        await registrarCambioEstado({
          solicitudId: s.id,
          estadoAnterior: "APROBADA",
          estadoNuevo: "RECHAZADA",
          actorId: guard.session.userId,
          comentario,
        })
        await notificar({
          usuarioId: s.profesorId,
          mensaje: `Tu solicitud de ${s.clase.materia.nombre} pasó a rechazada: el aula ${aula.nombre} fue deshabilitada${aula.motivoBloqueo ? ` (${aula.motivoBloqueo})` : ""}.`,
          solicitudId: s.id,
        })
      }
    }

    return NextResponse.json(aula)
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2025") {
      return NextResponse.json(
        { error: "Aula no encontrada." },
        { status: 404 }
      )
    }
    throw err
  }
}
