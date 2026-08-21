"use client"

import { useState } from "react"
import { AlertTriangleIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import type { Aula, ReporteAula, Usuario } from "@/lib/types"

export function AulaReporteDialog({
  aula,
  onUpdated,
}: {
  aula: Aula
  onUpdated: (aula: Aula) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reportes, setReportes] = useState<ReporteAula[]>([])
  const [descripcion, setDescripcion] = useState("")
  const [esAdmin, setEsAdmin] = useState(false)

  function actualizarPendientes(lista: ReporteAula[]) {
    const pendientes = lista.filter((r) => r.estado === "PENDIENTE").length
    onUpdated({ ...aula, reportesPendientes: pendientes })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) return
    setLoading(true)
    Promise.all([
      api.get<ReporteAula[]>(`/api/reportes?aulaId=${aula.id}`),
      api.get<Usuario>("/api/auth/me"),
    ])
      .then(([lista, propio]) => {
        setReportes(lista)
        actualizarPendientes(lista)
        setEsAdmin(propio.role === "ADMIN")
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  async function enviar() {
    if (!descripcion.trim()) return
    setSaving(true)
    try {
      const nuevo = await api.post<ReporteAula>("/api/reportes", {
        aulaId: aula.id,
        descripcion: descripcion.trim(),
      })
      const actualizados = [nuevo, ...reportes]
      setReportes(actualizados)
      actualizarPendientes(actualizados)
      toast.success("Reporte enviado.")
      setDescripcion("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el reporte.")
    } finally {
      setSaving(false)
    }
  }

  async function resolver(id: string) {
    try {
      const actualizado = await api.patch<ReporteAula>(`/api/reportes/${id}`, {
        estado: "RESUELTO",
      })
      const actualizados = reportes.map((r) => (r.id === actualizado.id ? actualizado : r))
      setReportes(actualizados)
      actualizarPendientes(actualizados)
      toast.success("Reporte marcado como resuelto.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar el reporte.")
    }
  }

  const pendientes = aula.reportesPendientes ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="gap-1 px-1.5" />}>
        <AlertTriangleIcon className={pendientes > 0 ? "text-amber-500" : "text-muted-foreground"} />
        {pendientes > 0 ? `${pendientes} pendiente${pendientes === 1 ? "" : "s"}` : "Reportar"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Problemas reportados en {aula.nombre}</DialogTitle>
          <DialogDescription>
            Contá qué anda mal (proyector, limpieza, mobiliario...). La administración lo va a
            revisar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="El proyector no enciende..."
          />
          <Button onClick={enviar} disabled={saving || !descripcion.trim()} className="w-fit">
            {saving ? "Enviando..." : "Reportar problema"}
          </Button>

          <Separator />

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : reportes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay problemas reportados.</p>
          ) : (
            <div className="grid max-h-64 gap-3 overflow-y-auto">
              {reportes.map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.usuarioNombre}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          r.estado === "PENDIENTE"
                            ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {r.estado === "PENDIENTE" ? "Pendiente" : "Resuelto"}
                      </Badge>
                      {esAdmin && r.estado === "PENDIENTE" && (
                        <Button size="icon-sm" variant="ghost" onClick={() => resolver(r.id)}>
                          <CheckIcon />
                          <span className="sr-only">Marcar resuelto</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{r.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
