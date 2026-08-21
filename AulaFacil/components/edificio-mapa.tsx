import { MapPinIcon, UsersIcon } from "lucide-react"

import { TIPO_ICONO, TIPO_GRADIENTE } from "@/lib/tipo-espacio-estilos"
import { TIPO_ESPACIO_LABEL, type Aula } from "@/lib/types"

function ordenPiso(ubicacion: string): number {
  const lower = ubicacion.toLowerCase()
  if (lower.includes("planta baja") || /\bpb\b/.test(lower)) return 0
  const match = lower.match(/(\d+)/)
  if (match) return parseInt(match[1], 10)
  return 500
}

export function EdificioMapa({ aulas }: { aulas: Aula[] }) {
  if (aulas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay espacios para mostrar.
      </p>
    )
  }

  const pisos = new Map<string, Aula[]>()
  for (const aula of aulas) {
    const key = aula.ubicacion ?? "Sin ubicación"
    if (!pisos.has(key)) pisos.set(key, [])
    pisos.get(key)!.push(aula)
  }

  const pisosOrdenados = [...pisos.entries()].sort(
    (a, b) => ordenPiso(a[0]) - ordenPiso(b[0])
  )

  return (
    <div className="flex flex-col gap-4">
      {pisosOrdenados.map(([piso, aulasDelPiso]) => (
        <div key={piso} className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <MapPinIcon className="size-4" />
            {piso}
          </h3>
          <div className="flex flex-wrap gap-3">
            {aulasDelPiso.map((aula) => {
              const Icono = TIPO_ICONO[aula.tipo]
              return (
                <div
                  key={aula.id}
                  className={`relative flex min-w-36 flex-col gap-1 rounded-lg border bg-gradient-to-br p-3 ${TIPO_GRADIENTE[aula.tipo]}`}
                >
                  {aula.disponibleAhora !== undefined && (
                    <span
                      title={aula.bloqueoActivo ?? undefined}
                      className={`absolute top-2 right-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        aula.bloqueoActivo
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : aula.disponibleAhora
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${aula.bloqueoActivo ? "bg-amber-500" : aula.disponibleAhora ? "bg-emerald-500" : "bg-muted-foreground"}`}
                      />
                      {aula.bloqueoActivo
                        ? "Bloqueada"
                        : aula.disponibleAhora
                          ? "Libre"
                          : "Ocupada"}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Icono className="size-4 text-foreground/60" />
                    <span className="text-xs text-muted-foreground">
                      {TIPO_ESPACIO_LABEL[aula.tipo]}
                    </span>
                  </div>
                  <span className="pr-14 font-medium">{aula.nombre}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersIcon className="size-3.5" />
                    {aula.capacidad}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
