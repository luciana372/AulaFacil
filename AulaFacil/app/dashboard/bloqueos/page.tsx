"use client"

import { useEffect, useState } from "react"
import { PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { Aula, BloqueoFecha } from "@/lib/types"

const TODAS_LAS_AULAS = "__todas__"

export default function BloqueosPage() {
  const [bloqueos, setBloqueos] = useState<BloqueoFecha[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [aulaId, setAulaId] = useState(TODAS_LAS_AULAS)

  useEffect(() => {
    Promise.all([
      api.get<BloqueoFecha[]>("/api/bloqueos"),
      api.get<Aula[]>("/api/aulas"),
    ])
      .then(([bloqueos, aulas]) => {
        setBloqueos(bloqueos)
        setAulas(aulas)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function crearBloqueo() {
    if (!motivo.trim() || !fechaInicio || !fechaFin) return
    setSaving(true)
    try {
      const nuevo = await api.post<BloqueoFecha>("/api/bloqueos", {
        motivo: motivo.trim(),
        fechaInicio,
        fechaFin,
        aulaId: aulaId === TODAS_LAS_AULAS ? null : aulaId,
      })
      setBloqueos((prev) => [nuevo, ...prev])
      toast.success("Bloqueo creado.")
      setMotivo("")
      setFechaInicio("")
      setFechaFin("")
      setAulaId(TODAS_LAS_AULAS)
      setOpen(false)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo crear el bloqueo."
      )
    } finally {
      setSaving(false)
    }
  }

  async function eliminarBloqueo(id: string) {
    try {
      await api.delete(`/api/bloqueos/${id}`)
      setBloqueos((prev) => prev.filter((b) => b.id !== id))
      toast.success("Bloqueo eliminado.")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo eliminar el bloqueo."
      )
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Bloqueos</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nuevo bloqueo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo bloqueo</DialogTitle>
                <DialogDescription>
                  Para feriados, semana de exámenes o eventos especiales.
                  Mientras esté activo, el aula (o todas) figura bloqueada y el
                  check-in por QR avisa el motivo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="motivo">Motivo</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Semana de exámenes finales"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="fechaInicio">Desde</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="fechaFin">Hasta</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Aula</Label>
                  <Select
                    value={aulaId}
                    onValueChange={(v) => setAulaId(v ?? TODAS_LAS_AULAS)}
                    items={{
                      [TODAS_LAS_AULAS]: "Todas las aulas",
                      ...Object.fromEntries(aulas.map((a) => [a.id, a.nombre])),
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TODAS_LAS_AULAS}>
                        Todas las aulas
                      </SelectItem>
                      {aulas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={crearBloqueo} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : bloqueos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay bloqueos cargados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloqueos.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.motivo}</TableCell>
                    <TableCell>{b.aulaNombre ?? "Todas las aulas"}</TableCell>
                    <TableCell>{b.fechaInicio}</TableCell>
                    <TableCell>{b.fechaFin}</TableCell>
                    <TableCell>{b.creadoPorNombre}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => eliminarBloqueo(b.id)}
                      >
                        <TrashIcon />
                        <span className="sr-only">Eliminar bloqueo</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
