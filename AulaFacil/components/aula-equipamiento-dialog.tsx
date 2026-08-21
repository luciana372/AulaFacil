"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"
import {
  EQUIPAMIENTO_LABEL,
  TIPOS_EQUIPAMIENTO,
  type Aula,
  type TipoEquipamiento,
} from "@/lib/types"

export function AulaEquipamientoDialog({
  aula,
  onUpdated,
}: {
  aula: Aula
  onUpdated: (aula: Aula) => void
}) {
  const [open, setOpen] = useState(false)
  const [seleccion, setSeleccion] = useState<TipoEquipamiento[]>(
    aula.equipamiento
  )
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setSeleccion(aula.equipamiento)
  }

  function toggle(item: TipoEquipamiento) {
    setSeleccion((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  async function guardar() {
    setSaving(true)
    try {
      const actualizada = await api.patch<Aula>(`/api/aulas/${aula.id}`, {
        equipamiento: seleccion,
      })
      onUpdated(actualizada)
      toast.success("Equipamiento actualizado.")
      setOpen(false)
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar el equipamiento."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="flex flex-wrap items-center gap-1 text-left hover:opacity-70" />
        }
      >
        {aula.equipamiento.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <PencilIcon className="size-3.5" />
            Sin equipamiento
          </span>
        ) : (
          aula.equipamiento.map((eq) => (
            <Badge key={eq} variant="outline" className="text-xs font-normal">
              {EQUIPAMIENTO_LABEL[eq]}
            </Badge>
          ))
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Equipamiento — {aula.nombre}</DialogTitle>
          <DialogDescription>
            Marcá con qué está equipada esta aula.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5">
          {TIPOS_EQUIPAMIENTO.map((item) => (
            <Label key={item} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={seleccion.includes(item)}
                onCheckedChange={() => toggle(item)}
              />
              {EQUIPAMIENTO_LABEL[item]}
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
