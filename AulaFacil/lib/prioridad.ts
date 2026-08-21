import "server-only"

import type { TipoUso } from "@/lib/generated/prisma/enums"

// Orden de declaración en el schema = orden de prioridad (0 = más alta)
const ORDEN_TIPO_USO: Record<TipoUso, number> = {
  CATEDRA: 0,
  INVESTIGACION: 1,
  LIBRE: 2,
}

const NIVEL_PENALIZADO = ORDEN_TIPO_USO.LIBRE + 1

// Número más bajo = se atiende primero. Un usuario penalizado va al fondo
// de la cola sin importar su tipoUso real.
export function prioridadEfectiva(
  tipoUso: TipoUso,
  penalizadoHasta: Date | null
): number {
  if (penalizadoHasta && penalizadoHasta.getTime() > Date.now()) {
    return NIVEL_PENALIZADO
  }
  return ORDEN_TIPO_USO[tipoUso]
}
