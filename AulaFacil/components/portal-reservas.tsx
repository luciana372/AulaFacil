"use client"

import { useEffect, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SolicitudEstadoBadge } from "@/components/solicitud-estado-badge"
import { SolicitudHistorialDialog } from "@/components/solicitud-historial-dialog"
import { TipoUsoBadge } from "@/components/tipo-uso-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import {
  DIAS_SEMANA,
  DIA_LABEL,
  type Aula,
  type Clase,
  type DiaSemana,
  type Solicitud,
  type TipoUso,
} from "@/lib/types"

const CANCELABLES: Solicitud["estado"][] = ["PENDIENTE", "APROBADA"]
const ACTIVOS: Solicitud["estado"][] = ["PENDIENTE", "APROBADA"]
const SIN_PREFERENCIA = "__sin_preferencia__"

type RespuestaSolicitud = Solicitud & {
  horariosCreados: number
  horariosConflicto: { dia: string; motivo: string }[]
  advertenciasBloqueo: { dia: string; mensaje: string }[]
}

export function PortalReservas() {
  const [clases, setClases] = useState<Clase[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [claseId, setClaseId] = useState("")
  const [tipoUso, setTipoUso] = useState<TipoUso>("CATEDRA")
  const [aulaId, setAulaId] = useState("")
  const [comentario, setComentario] = useState("")
  const [dias, setDias] = useState<DiaSemana[]>([])
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [saving, setSaving] = useState(false)

  const [cancelarId, setCancelarId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<Clase[]>("/api/clases"),
      api.get<Solicitud[]>("/api/solicitudes"),
      api.get<Aula[]>("/api/aulas"),
    ])
      .then(([clases, solicitudes, aulas]) => {
        setClases(clases)
        setSolicitudes(solicitudes)
        setAulas(aulas.filter((a) => a.habilitada))
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const aulaElegida = aulas.find((a) => a.id === aulaId)

  function toggleDia(dia: DiaSemana) {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]))
  }

  async function crearSolicitud() {
    if (!claseId) return
    if (dias.length > 0 && (!horaInicio || !horaFin)) {
      toast.error("Si elegís días, indicá también el horario de inicio y fin.")
      return
    }
    setSaving(true)
    try {
      const nueva = await api.post<RespuestaSolicitud>("/api/solicitudes", {
        claseId,
        tipoUso,
        aulaId: aulaId || null,
        comentario: comentario.trim() || null,
        dias: dias.length > 0 ? dias : undefined,
        horaInicio: dias.length > 0 ? horaInicio : undefined,
        horaFin: dias.length > 0 ? horaFin : undefined,
      })
      setSolicitudes((prev) => [nueva, ...prev])
      if (nueva.estado === "APROBADA") {
        if (nueva.horariosCreados > 0) {
          toast.success(
            `¡Reserva confirmada! Se asignaron ${nueva.horariosCreados} horario(s) en ${nueva.aulaNombre}.`
          )
        } else {
          toast.success(`¡Reserva confirmada! ${nueva.aulaNombre} ya es tuya para esta clase.`)
        }
        if (nueva.horariosConflicto.length > 0) {
          toast.error(
            `No se pudo asignar: ${nueva.horariosConflicto
              .map((c) => `${DIA_LABEL[c.dia as DiaSemana]} (${c.motivo})`)
              .join(", ")}`
          )
        }
        if (nueva.advertenciasBloqueo.length > 0) {
          toast.warning(
            `Ojo: coincide con un bloqueo — ${nueva.advertenciasBloqueo
              .map((a) => `${DIA_LABEL[a.dia as DiaSemana]}: ${a.mensaje}`)
              .join(", ")}`
          )
        }
      } else {
        toast.success("Solicitud enviada. Te vamos a avisar cuando se resuelva.")
      }
      setClaseId("")
      setTipoUso("CATEDRA")
      setAulaId("")
      setComentario("")
      setDias([])
      setHoraInicio("")
      setHoraFin("")
      setOpen(false)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo enviar la solicitud."
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmarCancelacion() {
    if (!cancelarId) return
    setSaving(true)
    try {
      const actualizada = await api.patch<Solicitud>(
        `/api/solicitudes/${cancelarId}`,
        {
          estado: "CANCELADA",
        }
      )
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === actualizada.id ? actualizada : s))
      )
      toast.success("Solicitud cancelada.")
      setCancelarId(null)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo cancelar la solicitud."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Mis reservas</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button size="sm" disabled={clases.length === 0} />}
            >
              <PlusIcon />
              Nueva solicitud
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva solicitud de aula</DialogTitle>
                <DialogDescription>
                  Elegí para qué clase pedís aula. Si preferís una en particular
                  y no requiere aprobación, se confirma al instante — si no, la
                  administración te la asigna.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Clase</Label>
                  <Select
                    value={claseId}
                    onValueChange={(v) => setClaseId(v ?? "")}
                    items={Object.fromEntries(
                      clases.map((c) => [c.id, c.materiaNombre])
                    )}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí una de tus clases" />
                    </SelectTrigger>
                    <SelectContent>
                      {clases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.materiaNombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Tipo de uso</Label>
                  <Select
                    value={tipoUso}
                    onValueChange={(v) => setTipoUso((v as TipoUso) ?? "CATEDRA")}
                    items={{ CATEDRA: "Cátedra", INVESTIGACION: "Proyecto de investigación" }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CATEDRA">Cátedra</SelectItem>
                      <SelectItem value="INVESTIGACION">
                        Proyecto de investigación
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cátedra tiene más prioridad que Investigación cuando la
                    administración resuelve solicitudes pendientes.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Aula (opcional)</Label>
                  <Select
                    value={aulaId || SIN_PREFERENCIA}
                    onValueChange={(v) =>
                      setAulaId(v === SIN_PREFERENCIA ? "" : (v ?? ""))
                    }
                    items={{
                      [SIN_PREFERENCIA]: "Sin preferencia",
                      ...Object.fromEntries(aulas.map((a) => [a.id, a.nombre])),
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_PREFERENCIA}>
                        Sin preferencia (que la administración elija)
                      </SelectItem>
                      {aulas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {aulaElegida && !aulaElegida.requiereAprobacion && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Esta aula se reserva al instante, sin esperar aprobación.
                    </p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="comentario">Comentario (opcional)</Label>
                  <Textarea
                    id="comentario"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Necesito proyector, somos 25 alumnos..."
                  />
                </div>
                <div className="grid gap-1.5 rounded-md border p-3">
                  <Label>Recurrencia (opcional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Elegí los días y un horario único para pedir todas las clases del
                    cuatrimestre en un solo paso.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {DIAS_SEMANA.map((d) => (
                      <Label key={d} className="flex items-center gap-1.5 text-sm font-normal">
                        <Checkbox checked={dias.includes(d)} onCheckedChange={() => toggleDia(d)} />
                        {DIA_LABEL[d]}
                      </Label>
                    ))}
                  </div>
                  {dias.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
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
                  )}
                  {dias.length > 0 && !(aulaElegida && !aulaElegida.requiereAprobacion) && (
                    <p className="text-xs text-muted-foreground">
                      Como no elegiste un aula sin aprobación manual, la administración
                      va a crear estos horarios al aprobar tu solicitud.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={crearSolicitud} disabled={saving || !claseId}>
                  {saving ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hiciste ninguna solicitud.
            </p>
          ) : (
            <Tabs defaultValue="activas">
              <TabsList>
                <TabsTrigger value="activas">Activas</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>
              <TabsContent value="activas" className="mt-4">
                <TablaSolicitudes
                  solicitudes={solicitudes.filter((s) => ACTIVOS.includes(s.estado))}
                  onCancelar={setCancelarId}
                  vacioMensaje="No tenés reservas activas por el momento."
                />
              </TabsContent>
              <TabsContent value="historial" className="mt-4">
                <TablaSolicitudes
                  solicitudes={solicitudes.filter((s) => !ACTIVOS.includes(s.estado))}
                  onCancelar={setCancelarId}
                  vacioMensaje="Todavía no tenés reservas pasadas."
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={cancelarId !== null}
        onOpenChange={(v) => !v && setCancelarId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar solicitud</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Si necesitás el aula más
              adelante, vas a tener que hacer una solicitud nueva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={confirmarCancelacion}
              disabled={saving}
            >
              {saving ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TablaSolicitudes({
  solicitudes,
  onCancelar,
  vacioMensaje,
}: {
  solicitudes: Solicitud[]
  onCancelar: (id: string) => void
  vacioMensaje: string
}) {
  if (solicitudes.length === 0) {
    return <p className="text-sm text-muted-foreground">{vacioMensaje}</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Clase</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Aula</TableHead>
          <TableHead>Comentario</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitudes.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.claseNombre}</TableCell>
            <TableCell>
              <TipoUsoBadge tipoUso={s.tipoUso} />
            </TableCell>
            <TableCell>{s.aulaNombre ?? "Sin asignar"}</TableCell>
            <TableCell className="max-w-56 truncate text-muted-foreground">
              {s.comentario ?? "—"}
            </TableCell>
            <TableCell>
              <SolicitudEstadoBadge estado={s.estado} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {CANCELABLES.includes(s.estado) && (
                  <Button size="sm" variant="outline" onClick={() => onCancelar(s.id)}>
                    <XIcon />
                    Cancelar
                  </Button>
                )}
                <SolicitudHistorialDialog solicitudId={s.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
