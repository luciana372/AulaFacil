"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import type { Aula, Valoracion } from "@/lib/types"

function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <StarIcon
            className={n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  )
}

export function AulaValoracionDialog({
  aula,
  onUpdated,
}: {
  aula: Aula
  onUpdated: (aula: Aula) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([])
  const [puntaje, setPuntaje] = useState(0)
  const [comentario, setComentario] = useState("")

  function actualizarPromedio(lista: Valoracion[]) {
    const promedio = lista.length
      ? lista.reduce((acc, v) => acc + v.puntaje, 0) / lista.length
      : null
    onUpdated({ ...aula, valoracionPromedio: promedio, valoracionCount: lista.length })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) return
    setLoading(true)
    api
      .get<Valoracion[]>(`/api/valoraciones?aulaId=${aula.id}`)
      .then((lista) => {
        setValoraciones(lista)
        actualizarPromedio(lista)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  async function guardar() {
    if (!puntaje) return
    setSaving(true)
    try {
      const nueva = await api.post<Valoracion>("/api/valoraciones", {
        aulaId: aula.id,
        puntaje,
        comentario: comentario.trim() || null,
      })
      const actualizadas = [nueva, ...valoraciones.filter((v) => v.usuarioId !== nueva.usuarioId)]
      setValoraciones(actualizadas)
      actualizarPromedio(actualizadas)
      toast.success("Valoración guardada.")
      setPuntaje(0)
      setComentario("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la valoración.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="gap-1 px-1.5" />}
      >
        <StarIcon className="fill-amber-400 text-amber-400" />
        {aula.valoracionPromedio ? aula.valoracionPromedio.toFixed(1) : "—"}
        <span className="text-muted-foreground">({aula.valoracionCount ?? 0})</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valoraciones de {aula.nombre}</DialogTitle>
          <DialogDescription>
            Dejá tu puntaje y, si querés, un comentario. Si ya habías valorado esta aula, se
            actualiza.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <StarRatingInput value={puntaje} onChange={setPuntaje} />
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Buena iluminación, el proyector anda bien..."
          />
          <Button onClick={guardar} disabled={saving || !puntaje} className="w-fit">
            {saving ? "Guardando..." : "Guardar valoración"}
          </Button>

          <Separator />

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : valoraciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay valoraciones.</p>
          ) : (
            <div className="grid max-h-64 gap-3 overflow-y-auto">
              {valoraciones.map((v) => (
                <div key={v.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.usuarioNombre}</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <StarIcon className="size-3.5 fill-amber-400" />
                      {v.puntaje}
                    </span>
                  </div>
                  {v.comentario && (
                    <p className="text-muted-foreground">{v.comentario}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
