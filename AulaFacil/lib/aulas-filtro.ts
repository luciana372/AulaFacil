import type { Aula, TipoEquipamiento } from "@/lib/types"

export interface FiltrosAula {
  capacidadMinima: number | null
  equipamiento: TipoEquipamiento[]
  ubicacion: string | null
  sedeId: string | null
  disponibleAhora: boolean
}

export const FILTROS_VACIOS: FiltrosAula = {
  capacidadMinima: null,
  equipamiento: [],
  ubicacion: null,
  sedeId: null,
  disponibleAhora: false,
}

export function filtrarAulas(aulas: Aula[], filtros: FiltrosAula): Aula[] {
  return aulas.filter((a) => {
    if (
      filtros.capacidadMinima !== null &&
      a.capacidad < filtros.capacidadMinima
    ) {
      return false
    }
    if (filtros.ubicacion !== null && a.ubicacion !== filtros.ubicacion) {
      return false
    }
    if (filtros.sedeId !== null && a.sedeId !== filtros.sedeId) {
      return false
    }
    if (filtros.equipamiento.some((eq) => !a.equipamiento.includes(eq))) {
      return false
    }
    if (filtros.disponibleAhora && !a.disponibleAhora) {
      return false
    }
    return true
  })
}
