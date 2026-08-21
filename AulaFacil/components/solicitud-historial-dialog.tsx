"use client"

import { useState } from "react"
import { HistoryIcon } from "lucide-react"
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
import { SolicitudEstadoBadge } from "@/components/solicitud-estado-badge"
import { api } from "@/lib/api-client"
import { tiempoRelativo } from "@/lib/tiempo-relativo"
import type { HistorialSolicitud } from "@/lib/types"

export function SolicitudHistorialDialog({ solicitudId }: { solicitudId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [historial, setHistorial] = useState<HistorialSolicitud[]>([])

  function onOpenChange(v: boolean) {
    setOpen(v)
    if (!v) return
    setLoading(true)
    api
      .get<HistorialSolicitud[]>(`/api/solicitudes/${solicitudId}/historial`)
      .then(setHistorial)
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el historial."))
      .finally(() => setLoading(false))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <HistoryIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial de la solicitud</DialogTitle>
          <DialogDescription>Todos los cambios de estado, en orden.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cambios registrados todavía.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {historial.map((h) => (
              <li key={h.id} className="flex flex-col gap-1 border-l-2 pl-3">
                <div className="flex items-center gap-2">
                  {h.estadoAnterior && (
                    <>
                      <SolicitudEstadoBadge estado={h.estadoAnterior} />
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <SolicitudEstadoBadge estado={h.estadoNuevo} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {h.actorNombre ?? "Sistema"} · {tiempoRelativo(h.createdAt)}
                </p>
                {h.comentario && <p className="text-sm">{h.comentario}</p>}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  )
}
