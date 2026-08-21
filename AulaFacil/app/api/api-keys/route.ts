import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { generarClave, hashearClave, prefijoVisible } from "@/lib/api-keys"
import { prisma } from "@/lib/prisma"
import type { ApiKey } from "@/lib/types"

function shape(k: {
  id: string
  nombre: string
  prefijo: string
  activa: boolean
  ultimoUsoAt: Date | null
  createdAt: Date
}): ApiKey {
  return {
    id: k.id,
    nombre: k.nombre,
    prefijo: k.prefijo,
    activa: k.activa,
    ultimoUsoAt: k.ultimoUsoAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }
}

export async function GET() {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const claves = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(claves.map(shape))
}

const createApiKeySchema = z.object({
  nombre: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createApiKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const clave = generarClave()
  const apiKey = await prisma.apiKey.create({
    data: {
      nombre: parsed.data.nombre,
      claveHash: hashearClave(clave),
      prefijo: prefijoVisible(clave),
      creadoPorId: guard.session.userId,
    },
  })

  await registrarAuditoria({
    actorId: guard.session.userId,
    accion: "APIKEY_CREADA",
    entidad: "ApiKey",
    entidadId: apiKey.id,
    detalle: apiKey.nombre,
  })

  // La clave en texto plano solo se devuelve acá, esta única vez.
  return NextResponse.json({ ...shape(apiKey), clave }, { status: 201 })
}
