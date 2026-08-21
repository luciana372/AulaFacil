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
import type { Carrera, Clase, Usuario } from "@/lib/types"

export default function ClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [profesores, setProfesores] = useState<Usuario[]>([])
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [materia, setMateria] = useState("")
  const [profesorId, setProfesorId] = useState("")
  const [carreraId, setCarreraId] = useState("")

  useEffect(() => {
    Promise.all([
      api.get<Clase[]>("/api/clases"),
      api.get<Usuario[]>("/api/usuarios?role=PROFESOR"),
      api.get<Carrera[]>("/api/carreras"),
    ])
      .then(([clases, profesores, carreras]) => {
        setClases(clases)
        setProfesores(profesores)
        setCarreras(carreras)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function crearClase() {
    if (!materia.trim() || !profesorId || !carreraId) return
    setSaving(true)
    try {
      const nueva = await api.post<Clase>("/api/clases", {
        materiaNombre: materia.trim(),
        profesorId,
        carreraId,
      })
      setClases((prev) => [...prev, nueva])
      toast.success("Clase creada.")
      setMateria("")
      setProfesorId("")
      setCarreraId("")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la clase.")
    } finally {
      setSaving(false)
    }
  }

  async function cambiarCarrera(clase: Clase, nuevaCarreraId: string) {
    const anterior = clase.carreraId
    const carreraElegida = carreras.find((c) => c.id === nuevaCarreraId)
    setClases((prev) =>
      prev.map((c) =>
        c.id === clase.id
          ? { ...c, carreraId: nuevaCarreraId, carreraNombre: carreraElegida?.nombre ?? c.carreraNombre }
          : c
      )
    )
    try {
      await api.patch(`/api/clases/${clase.id}`, { carreraId: nuevaCarreraId })
      toast.success("Carrera actualizada.")
    } catch (e) {
      setClases((prev) =>
        prev.map((c) => (c.id === clase.id ? { ...c, carreraId: anterior } : c))
      )
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la carrera.")
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Clases</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nueva clase
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva clase</DialogTitle>
                <DialogDescription>
                  Asigná una materia a un profesor y a una carrera. Los alumnos
                  de esa carrera van a ver esta clase automáticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="materia">Materia</Label>
                  <Input
                    id="materia"
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    placeholder="Química General"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Profesor</Label>
                  <Select
                    value={profesorId}
                    onValueChange={(v) => setProfesorId(v ?? "")}
                    items={Object.fromEntries(profesores.map((p) => [p.id, p.nombre]))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {profesores.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Carrera</Label>
                  <Select
                    value={carreraId}
                    onValueChange={(v) => setCarreraId(v ?? "")}
                    items={Object.fromEntries(carreras.map((c) => [c.id, c.nombre]))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí una carrera" />
                    </SelectTrigger>
                    <SelectContent>
                      {carreras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {carreras.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Todavía no hay carreras creadas. Creá una primero en la
                      sección Carreras.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={crearClase} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Carrera</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clases.map((clase) => (
                  <TableRow key={clase.id}>
                    <TableCell className="font-medium">{clase.materiaNombre}</TableCell>
                    <TableCell>{clase.profesorNombre}</TableCell>
                    <TableCell>
                      <Select
                        value={clase.carreraId}
                        onValueChange={(v) => v && cambiarCarrera(clase, v)}
                        items={Object.fromEntries(carreras.map((c) => [c.id, c.nombre]))}
                      >
                        <SelectTrigger size="sm" className="w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {carreras.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
