"use client"

import { BellIcon, BellOffIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import type { Recordatorio } from "@/lib/types"

export function HorarioRecordatorioButton({
  horarioId,
  recordatorio,
  onChange,
}: {
  horarioId: string
  recordatorio: Recordatorio | null
  onChange: (recordatorio: Recordatorio | null) => void
}) {
  async function toggle() {
    if (recordatorio) {
      const anterior = recordatorio
      onChange(null)
      try {
        await api.delete(`/api/recordatorios/${anterior.id}`)
        toast.success("Recordatorio desactivado.")
      } catch (e) {
        onChange(anterior)
        toast.error(e instanceof Error ? e.message : "No se pudo quitar el recordatorio.")
      }
    } else {
      try {
        const nuevo = await api.post<Recordatorio>("/api/recordatorios", { horarioId })
        onChange(nuevo)
        toast.success("Te vamos a avisar 15 minutos antes.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo activar el recordatorio.")
      }
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle}>
      {recordatorio ? (
        <BellIcon className="fill-amber-400 text-amber-400" />
      ) : (
        <BellOffIcon className="text-muted-foreground" />
      )}
      <span className="sr-only">
        {recordatorio ? "Quitar recordatorio" : "Avisarme antes de esta clase"}
      </span>
    </Button>
  )
}
