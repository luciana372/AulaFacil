import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { getConfiguracion } from "@/lib/configuracion"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const config = await getConfiguracion()
  return NextResponse.json(config)
}

const updateConfiguracionSchema = z
  .object({
    anticipacionMinDias: z.number().int().min(0),
    anticipacionMaxDias: z.number().int().min(0),
    duracionMaximaMinutos: z.number().int().positive(),
    maxReservasSimultaneasPorUsuario: z.number().int().positive(),
  })
  .partial()
  .refine(
    (d) =>
      d.anticipacionMinDias === undefined ||
      d.anticipacionMaxDias === undefined ||
      d.anticipacionMinDias <= d.anticipacionMaxDias,
    { message: "El mínimo de anticipación no puede ser mayor que el máximo.", path: ["anticipacionMinDias"] }
  )

export async function PATCH(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = updateConfiguracionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const actual = await getConfiguracion()
  const anticipacionMinDias = parsed.data.anticipacionMinDias ?? actual.anticipacionMinDias
  const anticipacionMaxDias = parsed.data.anticipacionMaxDias ?? actual.anticipacionMaxDias
  if (anticipacionMinDias > anticipacionMaxDias) {
    return NextResponse.json(
      { error: "El mínimo de anticipación no puede ser mayor que el máximo." },
      { status: 400 }
    )
  }

  const config = await prisma.configuracionReservas.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "CONFIGURACION_MODIFICADA",
    entidad: "ConfiguracionReservas",
    entidadId: "singleton",
    detalle: `anticipación ${config.anticipacionMinDias}-${config.anticipacionMaxDias} días, duración máx. ${config.duracionMaximaMinutos} min, máx. ${config.maxReservasSimultaneasPorUsuario} reservas/usuario`,
  })

  return NextResponse.json(config)
}
