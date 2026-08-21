"use client"

import { StarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"

export function AulaFavoritoButton({
  aulaId,
  favorito,
  onChange,
}: {
  aulaId: string
  favorito: boolean
  onChange: (favorito: boolean) => void
}) {
  async function toggle() {
    const next = !favorito
    onChange(next)
    try {
      await api.put("/api/favoritos", { aulaId, favorito: next })
    } catch (e) {
      onChange(!next)
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar el favorito.")
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle}>
      <StarIcon
        className={favorito ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
      />
      <span className="sr-only">
        {favorito ? "Quitar de favoritos" : "Marcar como favorita"}
      </span>
    </Button>
  )
}
