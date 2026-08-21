"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { AulaEquipamientoDialog } from "@/components/aula-equipamiento-dialog"
import { AulaFavoritoButton } from "@/components/aula-favorito-button"
import { AulaQrDialog } from "@/components/aula-qr-dialog"
import { AulaReporteDialog } from "@/components/aula-reporte-dialog"
import { AulaValoracionDialog } from "@/components/aula-valoracion-dialog"
import { AulasFiltros } from "@/components/aulas-filtros"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EdificioMapa } from "@/components/edificio-mapa"
import { api } from "@/lib/api-client"
import {
  FILTROS_VACIOS,
  filtrarAulas,
  type FiltrosAula,
} from "@/lib/aulas-filtro"
import {
  EQUIPAMIENTO_LABEL,
  TIPO_ESPACIO_LABEL,
  TIPOS_ESPACIO,
  TIPOS_EQUIPAMIENTO,
  type Aula,
  type Sede,
  type TipoEquipamiento,
  type TipoEspacio,
} from "@/lib/types"

const SIN_SEDE = "__sin_sede__"

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")
  const [capacidad, setCapacidad] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [tipo, setTipo] = useState<TipoEspacio>("AULA")
  const [equipamiento, setEquipamiento] = useState<TipoEquipamiento[]>([])
  const [requiereAprobacion, setRequiereAprobacion] = useState(true)
  const [sedeId, setSedeId] = useState(SIN_SEDE)
  const [filtros, setFiltros] = useState<FiltrosAula>(FILTROS_VACIOS)
  const [bloquearAulaId, setBloquearAulaId] = useState<string | null>(null)
  const [motivoBloqueo, setMotivoBloqueo] = useState("")

  useEffect(() => {
    api
      .get<Aula[]>("/api/aulas")
      .then(setAulas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
    api
      .get<Sede[]>("/api/sedes")
      .then(setSedes)
      .catch(() => {})
  }, [])

  async function toggleHabilitada(aula: Aula) {
    if (aula.habilitada) {
      setMotivoBloqueo("")
      setBloquearAulaId(aula.id)
      return
    }
    setAulas((prev) =>
      prev.map((a) =>
        a.id === aula.id ? { ...a, habilitada: true, motivoBloqueo: null } : a
      )
    )
    try {
      await api.patch(`/api/aulas/${aula.id}`, { habilitada: true })
    } catch (e) {
      setAulas((prev) =>
        prev.map((a) =>
          a.id === aula.id
            ? { ...a, habilitada: aula.habilitada, motivoBloqueo: aula.motivoBloqueo }
            : a
        )
      )
      toast.error(
        e instanceof Error ? e.message : "No se pudo actualizar el aula."
      )
    }
  }

  async function confirmarBloqueo() {
    if (!bloquearAulaId) return
    const id = bloquearAulaId
    const motivo = motivoBloqueo.trim() || null
    setSaving(true)
    try {
      const actualizada = await api.patch<Aula>(`/api/aulas/${id}`, {
        habilitada: false,
        motivoBloqueo: motivo,
      })
      actualizarAula(actualizada)
      toast.success("Aula deshabilitada.")
      setBloquearAulaId(null)
      setMotivoBloqueo("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo deshabilitar el aula.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleRequiereAprobacion(aula: Aula) {
    const nuevoValor = !aula.requiereAprobacion
    setAulas((prev) =>
      prev.map((a) =>
        a.id === aula.id ? { ...a, requiereAprobacion: nuevoValor } : a
      )
    )
    try {
      await api.patch(`/api/aulas/${aula.id}`, {
        requiereAprobacion: nuevoValor,
      })
    } catch (e) {
      setAulas((prev) =>
        prev.map((a) =>
          a.id === aula.id
            ? { ...a, requiereAprobacion: aula.requiereAprobacion }
            : a
        )
      )
      toast.error(
        e instanceof Error ? e.message : "No se pudo actualizar el aula."
      )
    }
  }

  function actualizarAula(aulaActualizada: Aula) {
    setAulas((prev) =>
      prev.map((a) => (a.id === aulaActualizada.id ? aulaActualizada : a))
    )
  }

  async function crearAula() {
    if (!nombre.trim() || !capacidad) return
    setSaving(true)
    try {
      const nueva = await api.post<Aula>("/api/aulas", {
        nombre: nombre.trim(),
        capacidad: Number(capacidad),
        ubicacion: ubicacion.trim() || null,
        tipo,
        equipamiento,
        requiereAprobacion,
        sedeId: sedeId === SIN_SEDE ? null : sedeId,
      })
      setAulas((prev) => [...prev, nueva])
      toast.success(
        "Aula creada. Recordá habilitarla para poder asignarle horarios."
      )
      setNombre("")
      setCapacidad("")
      setUbicacion("")
      setTipo("AULA")
      setEquipamiento([])
      setRequiereAprobacion(true)
      setSedeId(SIN_SEDE)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el aula.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Aulas</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nueva aula
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva aula</DialogTitle>
                <DialogDescription>
                  Se crea deshabilitada hasta que la actives.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Aula 103"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="capacidad">Capacidad</Label>
                  <Input
                    id="capacidad"
                    type="number"
                    min={1}
                    value={capacidad}
                    onChange={(e) => setCapacidad(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="1er piso"
                  />
                </div>
                {sedes.length > 0 && (
                  <div className="grid gap-1.5">
                    <Label>Sede</Label>
                    <Select
                      value={sedeId}
                      onValueChange={(v) => setSedeId(v ?? SIN_SEDE)}
                      items={{
                        [SIN_SEDE]: "Sin especificar",
                        ...Object.fromEntries(sedes.map((s) => [s.id, s.nombre])),
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_SEDE}>Sin especificar</SelectItem>
                        {sedes.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label>Tipo de espacio</Label>
                  <Select
                    value={tipo}
                    onValueChange={(v) => v && setTipo(v as TipoEspacio)}
                    items={TIPO_ESPACIO_LABEL}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ESPACIO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_ESPACIO_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Equipamiento</Label>
                  <div className="flex flex-wrap gap-3">
                    {TIPOS_EQUIPAMIENTO.map((item) => (
                      <Label
                        key={item}
                        className="flex items-center gap-1.5 font-normal"
                      >
                        <Checkbox
                          checked={equipamiento.includes(item)}
                          onCheckedChange={() =>
                            setEquipamiento((prev) =>
                              prev.includes(item)
                                ? prev.filter((i) => i !== item)
                                : [...prev, item]
                            )
                          }
                        />
                        {EQUIPAMIENTO_LABEL[item]}
                      </Label>
                    ))}
                  </div>
                </div>
                <Label className="flex items-center gap-2 font-normal">
                  <Checkbox
                    checked={requiereAprobacion}
                    onCheckedChange={() =>
                      setRequiereAprobacion((prev) => !prev)
                    }
                  />
                  Requiere aprobación manual del admin para reservarse
                </Label>
              </div>
              <DialogFooter>
                <Button onClick={crearAula} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              <AulasFiltros
                aulas={aulas}
                filtros={filtros}
                onChange={setFiltros}
              />
              <Tabs defaultValue="lista">
                <TabsList>
                  <TabsTrigger value="lista">Lista</TabsTrigger>
                  <TabsTrigger value="mapa">Mapa</TabsTrigger>
                </TabsList>
                <TabsContent value="lista" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sede</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Capacidad</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Equipamiento</TableHead>
                        <TableHead>Valoración</TableHead>
                        <TableHead>Problemas</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>QR</TableHead>
                        <TableHead className="text-right">
                          Requiere aprobación
                        </TableHead>
                        <TableHead className="text-right">Habilitada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrarAulas(aulas, filtros).map((aula) => (
                        <TableRow key={aula.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              <AulaFavoritoButton
                                aulaId={aula.id}
                                favorito={aula.favorito ?? false}
                                onChange={(favorito) =>
                                  actualizarAula({ ...aula, favorito })
                                }
                              />
                              {aula.nombre}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {aula.sedeNombre ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {TIPO_ESPACIO_LABEL[aula.tipo]}
                          </TableCell>
                          <TableCell>{aula.capacidad}</TableCell>
                          <TableCell>{aula.ubicacion ?? "—"}</TableCell>
                          <TableCell>
                            <AulaEquipamientoDialog
                              aula={aula}
                              onUpdated={actualizarAula}
                            />
                          </TableCell>
                          <TableCell>
                            <AulaValoracionDialog
                              aula={aula}
                              onUpdated={actualizarAula}
                            />
                          </TableCell>
                          <TableCell>
                            <AulaReporteDialog
                              aula={aula}
                              onUpdated={actualizarAula}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <Badge
                                variant="outline"
                                className={
                                  aula.habilitada
                                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-fit"
                                    : "border-muted-foreground/30 bg-muted text-muted-foreground w-fit"
                                }
                              >
                                {aula.habilitada ? "Habilitada" : "Deshabilitada"}
                              </Badge>
                              {!aula.habilitada && aula.motivoBloqueo && (
                                <span className="max-w-40 truncate text-xs text-muted-foreground">
                                  {aula.motivoBloqueo}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <AulaQrDialog
                              aulaId={aula.id}
                              aulaNombre={aula.nombre}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={aula.requiereAprobacion}
                              onCheckedChange={() =>
                                toggleRequiereAprobacion(aula)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={aula.habilitada}
                              onCheckedChange={() => toggleHabilitada(aula)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="mapa" className="mt-4">
                  <EdificioMapa aulas={filtrarAulas(aulas, filtros)} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={bloquearAulaId !== null}
        onOpenChange={(v) => !v && setBloquearAulaId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deshabilitar aula</DialogTitle>
            <DialogDescription>
              Las solicitudes aprobadas que usan esta aula se rechazan automáticamente.
              Indicá el motivo (por ejemplo, mantenimiento) para que quede visible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="motivoBloqueo">Motivo (opcional)</Label>
            <Textarea
              id="motivoBloqueo"
              value={motivoBloqueo}
              onChange={(e) => setMotivoBloqueo(e.target.value)}
              placeholder="Mantenimiento eléctrico programado..."
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmarBloqueo} disabled={saving}>
              {saving ? "Deshabilitando..." : "Deshabilitar aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
