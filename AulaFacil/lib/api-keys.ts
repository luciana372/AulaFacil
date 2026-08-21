import "server-only"

import { randomBytes, createHash } from "crypto"

import { prisma } from "@/lib/prisma"

const PREFIJO = "af_"

// Clave en texto plano (solo existe en memoria un instante, se muestra una vez al crearla).
export function generarClave(): string {
  return `${PREFIJO}${randomBytes(24).toString("hex")}`
}

export function hashearClave(clave: string): string {
  return createHash("sha256").update(clave).digest("hex")
}

export function prefijoVisible(clave: string): string {
  return `${clave.slice(0, PREFIJO.length + 6)}…`
}

// Autentica una request de la API pública (/api/v1/*) contra el header "x-api-key".
// No usa sesión/cookie — es para sistemas externos, no para usuarios logueados.
export async function autenticarApiKey(
  request: Request
): Promise<{ id: string; nombre: string } | null> {
  const clave = request.headers.get("x-api-key")
  if (!clave) return null

  const apiKey = await prisma.apiKey.findUnique({
    where: { claveHash: hashearClave(clave) },
  })
  if (!apiKey || !apiKey.activa) return null

  // Best-effort: no bloquea la respuesta si falla.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { ultimoUsoAt: new Date() } })
    .catch(() => {})

  return { id: apiKey.id, nombre: apiKey.nombre }
}
