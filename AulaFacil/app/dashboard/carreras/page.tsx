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
import type { Carrera } from "@/lib/types"

export default function CarrerasPage() {
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")

  useEffect(() => {
    api
      .get<Carrera[]>("/api/carreras")
      .then(setCarreras)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function crearCarrera() {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const nueva = await api.post<Carrera>("/api/carreras", { nombre: nombre.trim() })
      setCarreras((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      toast.success("Carrera creada.")
      setNombre("")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la carrera.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Carreras</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nueva carrera
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva carrera</DialogTitle>
                <DialogDescription>
                  Los alumnos que pertenezcan a esta carrera verán automáticamente
                  las clases que se le asignen.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingeniería en Sistemas"
                />
              </div>
              <DialogFooter>
                <Button onClick={crearCarrera} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : carreras.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay carreras creadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carreras.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
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
