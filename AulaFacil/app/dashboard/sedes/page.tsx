"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { Sede } from "@/lib/types"

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")

  useEffect(() => {
    api
      .get<Sede[]>("/api/sedes")
      .then(setSedes)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function crearSede() {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const nueva = await api.post<Sede>("/api/sedes", {
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
      })
      setSedes((prev) =>
        [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
      toast.success("Sede creada.")
      setNombre("")
      setDireccion("")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la sede.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Sedes</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nueva sede
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva sede</DialogTitle>
                <DialogDescription>
                  Si la universidad tiene más de un edificio o campus, cada
                  aula se puede asignar a una sede para agruparlas y
                  filtrarlas por separado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Sede Centro"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="direccion">Dirección (opcional)</Label>
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Av. Siempre Viva 123"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={crearSede} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : sedes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay sedes creadas. Si la universidad tiene un solo
              edificio, no hace falta crear ninguna.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sedes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.direccion ?? "—"}
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
