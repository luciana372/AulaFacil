"use client"

import { useEffect, useState } from "react"
import { DownloadIcon, PlusIcon, TrashIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImportarHorariosDialog } from "@/components/importar-horarios-dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeeklyAgenda } from "@/components/weekly-agenda"
import { api, ApiError } from "@/lib/api-client"
import { descargarICS } from "@/lib/ics"
import {
  DIA_LABEL,
  DIAS_SEMANA,
  type Aula,
  type Clase,
  type DiaSemana,
  type EsperaHorario,
  type Horario,
} from "@/lib/types"

const MENSAJE_CONFLICTO = "Ese aula ya tiene una clase asignada en ese día y horario."

type AulaAlternativa = { id: string; nombre: string; capacidad: number; tipo: string }

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [clases, setClases] = useState<Clase[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [esperas, setEsperas] = useState<EsperaHorario[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [claseId, setClaseId] = useState("")
  const [aulaId, setAulaId] = useState("")
  const [dia, setDia] = useState<DiaSemana | "">("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [alternativas, setAlternativas] = useState<AulaAlternativa[]>([])

  useEffect(() => {
    Promise.all([
      api.get<Horario[]>("/api/horarios"),
      api.get<Clase[]>("/api/clases"),
      api.get<Aula[]>("/api/aulas"),
      api.get<EsperaHorario[]>("/api/lista-espera"),
    ])
      .then(([horarios, clases, aulas, esperas]) => {
        setHorarios(horarios)
        setClases(clases)
        setAulas(aulas)
        setEsperas(esperas)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const aulasHabilitadas = aulas.filter((a) => a.habilitada)

  function recargarHorarios() {
    api
      .get<Horario[]>("/api/horarios")
      .then(setHorarios)
      .catch((e) => toast.error(e.message))
  }

  function exportarICS() {
    if (horarios.length === 0) {
      toast.error("No hay horarios para exportar todavía.")
      return
    }
    descargarICS(horarios, "aulafacil-horarios-institucion.ics")
    toast.success(
      "Descargado. Importalo en Google Calendar, Outlook o tu app de calendario."
    )
  }

  async function anotarseEnEspera() {
    if (!claseId || !aulaId || !dia || !horaInicio || !horaFin) return
    try {
      const nueva = await api.post<EsperaHorario>("/api/lista-espera", {
        claseId,
        aulaId,
        dia,
        horaInicio,
        horaFin,
      })
      setEsperas((prev) => [...prev, nueva])
      toast.success("Anotado en la lista de espera. Te avisamos si se libera.")
      setOpen(false)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo anotar en la lista de espera."
      )
    }
  }

  async function crearHorario() {
    if (!claseId || !aulaId || !dia || !horaInicio || !horaFin) return
    setSaving(true)
    setAlternativas([])
    try {
      const nuevo = await api.post<Horario & { advertenciaBloqueo: string | null }>(
        "/api/horarios",
        { claseId, aulaId, dia, horaInicio, horaFin }
      )
      setHorarios((prev) => [...prev, nuevo])
      toast.success("Horario asignado.")
      if (nuevo.advertenciaBloqueo) {
        toast.warning(`Ojo: coincide con un bloqueo — ${nuevo.advertenciaBloqueo}`)
      }
      setClaseId("")
      setAulaId("")
      setDia("")
      setHoraInicio("")
      setHoraFin("")
      setOpen(false)
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No se pudo asignar el horario."
      if (mensaje === MENSAJE_CONFLICTO) {
        toast.error(mensaje, {
          action: { label: "Anotarme en lista de espera", onClick: () => anotarseEnEspera() },
        })
        if (e instanceof ApiError) {
          const data = e.data as { alternativas?: AulaAlternativa[] } | null
          setAlternativas(data?.alternativas ?? [])
        }
      } else {
        toast.error(mensaje)
      }
    } finally {
      setSaving(false)
    }
  }

  async function eliminarHorario() {
    if (!eliminarId) return
    try {
      const res = await api.delete<{ ok: true; avisados: number }>(
        `/api/horarios/${eliminarId}`
      )
      setHorarios((prev) => prev.filter((h) => h.id !== eliminarId))
      toast.success(
        res.avisados > 0
          ? `Horario eliminado. Avisamos a ${res.avisados} clase(s) en lista de espera.`
          : "Horario eliminado."
      )
      setEliminarId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el horario.")
    }
  }

  async function quitarEspera(id: string) {
    try {
      await api.delete(`/api/lista-espera/${id}`)
      setEsperas((prev) => prev.filter((e) => e.id !== id))
      toast.success("Quitado de la lista de espera.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar.")
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Horarios</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportarICS}>
              <DownloadIcon />
              Exportar
            </Button>
            <ImportarHorariosDialog onImportado={recargarHorarios} />
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v)
                if (!v) setAlternativas([])
              }}
            >
              <DialogTrigger render={<Button size="sm" />}>
                <PlusIcon />
                Nuevo horario
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar horario</DialogTitle>
                  <DialogDescription>
                    Fijá el día y la franja horaria de un aula para una clase.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Clase</Label>
                    <Select
                      value={claseId}
                      onValueChange={(v) => setClaseId(v ?? "")}
                      items={Object.fromEntries(
                        clases.map((c) => [c.id, `${c.materiaNombre} — ${c.profesorNombre}`])
                      )}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elegí una clase" />
                      </SelectTrigger>
                      <SelectContent>
                        {clases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.materiaNombre} — {c.profesorNombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Aula</Label>
                    <Select
                      value={aulaId}
                      onValueChange={(v) => setAulaId(v ?? "")}
                      items={Object.fromEntries(aulasHabilitadas.map((a) => [a.id, a.nombre]))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elegí un aula habilitada" />
                      </SelectTrigger>
                      <SelectContent>
                        {aulasHabilitadas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Día</Label>
                    <Select
                      value={dia}
                      onValueChange={(v) => setDia((v as DiaSemana) ?? "")}
                      items={DIA_LABEL}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elegí un día" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAS_SEMANA.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DIA_LABEL[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="horaInicio">Desde</Label>
                      <Input
                        id="horaInicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="horaFin">Hasta</Label>
                      <Input
                        id="horaFin"
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                      />
                    </div>
                  </div>
                  {alternativas.length > 0 && (
                    <div className="grid gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Aulas libres en ese mismo día y horario:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {alternativas.map((a) => (
                          <Button
                            key={a.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAulaId(a.id)
                              setAlternativas([])
                            }}
                          >
                            {a.nombre} (cap. {a.capacidad})
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={crearHorario} disabled={saving}>
                    {saving ? "Asignando..." : "Asignar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Tabs defaultValue="agenda">
              <TabsList>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="tabla">Tabla</TabsTrigger>
              </TabsList>
              <TabsContent value="agenda" className="mt-4">
                <WeeklyAgenda horarios={horarios} />
              </TabsContent>
              <TabsContent value="tabla" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clase</TableHead>
                      <TableHead>Aula</TableHead>
                      <TableHead>Día</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {horarios.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">
                          {h.claseNombre}
                        </TableCell>
                        <TableCell>{h.aulaNombre}</TableCell>
                        <TableCell>{DIA_LABEL[h.dia]}</TableCell>
                        <TableCell>
                          {h.horaInicio} - {h.horaFin}
                        </TableCell>
                        <TableCell>
                          {h.origen === "OFICIAL" ? (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            >
                              Oficial
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-muted-foreground/30 bg-muted text-muted-foreground"
                            >
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setEliminarId(h.id)}
                          >
                            <TrashIcon />
                            <span className="sr-only">Eliminar horario</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de espera</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : esperas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nadie está esperando un aula por ahora.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {esperas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.claseNombre}</TableCell>
                    <TableCell>{e.profesorNombre}</TableCell>
                    <TableCell>{e.aulaNombre}</TableCell>
                    <TableCell>{DIA_LABEL[e.dia]}</TableCell>
                    <TableCell>
                      {e.horaInicio} - {e.horaFin}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon-sm" variant="ghost" onClick={() => quitarEspera(e.id)}>
                        <XIcon />
                        <span className="sr-only">Quitar de la lista de espera</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={eliminarId !== null} onOpenChange={(v) => !v && setEliminarId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar horario</DialogTitle>
            <DialogDescription>
              El aula queda libre en esa franja. Si hay alguien en la lista de espera
              para ese horario puntual, le avisamos automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={eliminarHorario}>
              Confirmar eliminación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
