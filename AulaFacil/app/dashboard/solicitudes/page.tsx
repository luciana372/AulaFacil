"use client"

import { useEffect, useState } from "react"
import { CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import {
  DIA_LABEL,
  DIAS_SEMANA,
  type Aula,
  type Clase,
  type DiaSemana,
  type EsperaHorario,
  type Solicitud,
  type TipoUso,
  type Usuario,
} from "@/lib/types"

type RespuestaSolicitud = Solicitud & {
  horariosCreados: number
  horariosConflicto: { dia: string; motivo: string }[]
  advertenciasBloqueo: { dia: string; mensaje: string }[]
}

function textoRecurrencia(s: Solicitud) {
  if (s.diasPreferidos.length === 0) return null
  const dias = s.diasPreferidos.map((d) => DIA_LABEL[d]).join(", ")
  return `Pidió: ${dias} de ${s.horaInicioPreferida} a ${s.horaFinPreferida}`
}

function estaPenalizado(s: Solicitud) {
  return (
    s.profesorPenalizadoHasta !== null &&
    new Date(s.profesorPenalizadoHasta).getTime() > Date.now()
  )
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [clases, setClases] = useState<Clase[]>([])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [aprobarId, setAprobarId] = useState<string | null>(null)
  const [rechazarId, setRechazarId] = useState<string | null>(null)
  const [aulaElegida, setAulaElegida] = useState("")
  const [motivo, setMotivo] = useState("")
  const [saving, setSaving] = useState(false)

  const [nuevaOpen, setNuevaOpen] = useState(false)
  const [nvClaseId, setNvClaseId] = useState("")
  const [nvTipoUso, setNvTipoUso] = useState<TipoUso>("CATEDRA")
  const [nvAulaId, setNvAulaId] = useState("")
  const [nvDias, setNvDias] = useState<DiaSemana[]>([])
  const [nvHoraInicio, setNvHoraInicio] = useState("")
  const [nvHoraFin, setNvHoraFin] = useState("")
  const [nvComentario, setNvComentario] = useState("")
  const [nvSaving, setNvSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<Solicitud[]>("/api/solicitudes"),
      api.get<Aula[]>("/api/aulas"),
      api.get<Clase[]>("/api/clases"),
      api.get<Usuario>("/api/auth/me"),
    ])
      .then(([solicitudes, aulas, clases, propio]) => {
        setSolicitudes(solicitudes)
        setAulas(aulas)
        setClases(clases)
        setUsuario(propio)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const esAdmin = usuario?.role === "ADMIN"
  const esProfesor = usuario?.role === "PROFESOR"
  const aulasHabilitadas = aulas.filter((a) => a.habilitada)
  const solicitudAprobar = solicitudes.find((s) => s.id === aprobarId) ?? null

  async function anotarseEnEspera(params: {
    claseId: string
    aulaId: string
    dia: string
    horaInicio: string
    horaFin: string
  }) {
    try {
      await api.post<EsperaHorario>("/api/lista-espera", params)
      toast.success("Anotado en la lista de espera. Te avisamos si se libera.")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo anotar en la lista de espera."
      )
    }
  }

  function avisarConflictos(
    horariosConflicto: { dia: string; motivo: string }[],
    contexto: {
      claseId: string
      aulaId: string | null
      horaInicio: string | null
      horaFin: string | null
    }
  ) {
    for (const c of horariosConflicto) {
      toast.error(`${DIA_LABEL[c.dia as DiaSemana]}: ${c.motivo}`, {
        action:
          contexto.aulaId && contexto.horaInicio && contexto.horaFin
            ? {
                label: "Anotarme en lista de espera",
                onClick: () =>
                  anotarseEnEspera({
                    claseId: contexto.claseId,
                    aulaId: contexto.aulaId as string,
                    dia: c.dia,
                    horaInicio: contexto.horaInicio as string,
                    horaFin: contexto.horaFin as string,
                  }),
              }
            : undefined,
      })
    }
  }

  function avisarBloqueos(advertenciasBloqueo: { dia: string; mensaje: string }[]) {
    if (advertenciasBloqueo.length === 0) return
    toast.warning(
      `Ojo: coincide con un bloqueo — ${advertenciasBloqueo
        .map((a) => `${DIA_LABEL[a.dia as DiaSemana]}: ${a.mensaje}`)
        .join(", ")}`
    )
  }

  async function crearSolicitud() {
    if (!nvClaseId) return
    if (nvDias.length > 0 && (!nvHoraInicio || !nvHoraFin)) {
      toast.error("Si elegís días, indicá también el horario.")
      return
    }
    setNvSaving(true)
    try {
      const nueva = await api.post<RespuestaSolicitud>("/api/solicitudes", {
        claseId: nvClaseId,
        tipoUso: nvTipoUso,
        aulaId: nvAulaId || null,
        comentario: nvComentario.trim() || null,
        dias: nvDias,
        horaInicio: nvHoraInicio || undefined,
        horaFin: nvHoraFin || undefined,
      })
      setSolicitudes((prev) => [nueva, ...prev])
      toast.success(
        nueva.estado === "APROBADA"
          ? "Solicitud creada y aprobada automáticamente."
          : "Solicitud enviada. Te avisamos cuando la resuelvan."
      )
      if (nueva.horariosConflicto.length > 0) {
        avisarConflictos(nueva.horariosConflicto, {
          claseId: nvClaseId,
          aulaId: nueva.aulaId,
          horaInicio: nvHoraInicio || null,
          horaFin: nvHoraFin || null,
        })
      }
      avisarBloqueos(nueva.advertenciasBloqueo)
      setNuevaOpen(false)
      setNvClaseId("")
      setNvTipoUso("CATEDRA")
      setNvAulaId("")
      setNvDias([])
      setNvHoraInicio("")
      setNvHoraFin("")
      setNvComentario("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la solicitud.")
    } finally {
      setNvSaving(false)
    }
  }

  async function confirmarAprobacion() {
    if (!aprobarId || !aulaElegida) return
    const solicitud = solicitudAprobar
    setSaving(true)
    try {
      const actualizada = await api.patch<RespuestaSolicitud>(
        `/api/solicitudes/${aprobarId}`,
        { estado: "APROBADA", aulaId: aulaElegida }
      )
      setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)))
      toast.success(
        actualizada.horariosCreados > 0
          ? `Solicitud aprobada. Se crearon ${actualizada.horariosCreados} horario(s) recurrente(s).`
          : "Solicitud aprobada."
      )
      if (actualizada.horariosConflicto.length > 0 && solicitud) {
        avisarConflictos(actualizada.horariosConflicto, {
          claseId: solicitud.claseId,
          aulaId: actualizada.aulaId,
          horaInicio: solicitud.horaInicioPreferida,
          horaFin: solicitud.horaFinPreferida,
        })
      }
      avisarBloqueos(actualizada.advertenciasBloqueo)
      setAprobarId(null)
      setAulaElegida("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo aprobar la solicitud.")
    } finally {
      setSaving(false)
    }
  }

  async function confirmarRechazo() {
    if (!rechazarId) return
    setSaving(true)
    try {
      const actualizada = await api.patch<Solicitud>(`/api/solicitudes/${rechazarId}`, {
        estado: "RECHAZADA",
        comentario: motivo.trim() || null,
      })
      setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)))
      toast.success("Solicitud rechazada.")
      setRechazarId(null)
      setMotivo("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo rechazar la solicitud.")
    } finally {
      setSaving(false)
    }
  }

  async function cancelarSolicitud(id: string) {
    try {
      const actualizada = await api.patch<Solicitud>(`/api/solicitudes/${id}`, {
        estado: "CANCELADA",
      })
      setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)))
      toast.success("Solicitud cancelada.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cancelar la solicitud.")
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Solicitudes</CardTitle>
          {esProfesor && (
            <Dialog open={nuevaOpen} onOpenChange={setNuevaOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <PlusIcon />
                Nueva solicitud
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva solicitud</DialogTitle>
                  <DialogDescription>
                    Pedí un aula para una de tus clases. Cátedra tiene más
                    prioridad que Investigación cuando la administración
                    resuelve solicitudes pendientes.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Clase</Label>
                    <Select
                      value={nvClaseId}
                      onValueChange={(v) => setNvClaseId(v ?? "")}
                      items={Object.fromEntries(clases.map((c) => [c.id, c.materiaNombre]))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elegí una clase" />
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
                      value={nvTipoUso}
                      onValueChange={(v) => setNvTipoUso((v as TipoUso) ?? "CATEDRA")}
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
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Aula preferida (opcional)</Label>
                    <Select
                      value={nvAulaId}
                      onValueChange={(v) => setNvAulaId(v ?? "")}
                      items={Object.fromEntries(aulasHabilitadas.map((a) => [a.id, a.nombre]))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Que la elija la administración" />
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
                    <Label>Días (opcional)</Label>
                    <div className="flex flex-wrap gap-3">
                      {DIAS_SEMANA.map((d) => (
                        <Label key={d} className="flex items-center gap-1.5 font-normal">
                          <Checkbox
                            checked={nvDias.includes(d)}
                            onCheckedChange={() =>
                              setNvDias((prev) =>
                                prev.includes(d) ? prev.filter((i) => i !== d) : [...prev, d]
                              )
                            }
                          />
                          {DIA_LABEL[d]}
                        </Label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="nvHoraInicio">Desde</Label>
                      <Input
                        id="nvHoraInicio"
                        type="time"
                        value={nvHoraInicio}
                        onChange={(e) => setNvHoraInicio(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="nvHoraFin">Hasta</Label>
                      <Input
                        id="nvHoraFin"
                        type="time"
                        value={nvHoraFin}
                        onChange={(e) => setNvHoraFin(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nvComentario">Comentario (opcional)</Label>
                    <Textarea
                      id="nvComentario"
                      value={nvComentario}
                      onChange={(e) => setNvComentario(e.target.value)}
                      placeholder="Necesito proyector para las clases prácticas..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={crearSolicitud} disabled={nvSaving || !nvClaseId}>
                    {nvSaving ? "Enviando..." : "Enviar solicitud"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Profesor</TableHead>
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
                    <TableCell className="font-medium">
                      <div>{s.claseNombre}</div>
                      {textoRecurrencia(s) && (
                        <div className="text-xs font-normal text-muted-foreground">
                          {textoRecurrencia(s)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{s.profesorNombre}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <TipoUsoBadge tipoUso={s.tipoUso} />
                        {estaPenalizado(s) && (
                          <Badge
                            variant="outline"
                            className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                          >
                            Prioridad reducida
                          </Badge>
                        )}
                      </div>
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
                        {esAdmin && s.estado === "PENDIENTE" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAprobarId(s.id)}
                            >
                              <CheckIcon />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRechazarId(s.id)}
                            >
                              <XIcon />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {esProfesor &&
                          usuario &&
                          s.profesorId === usuario.id &&
                          (s.estado === "PENDIENTE" || s.estado === "APROBADA") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelarSolicitud(s.id)}
                            >
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
          )}
        </CardContent>
      </Card>

      <Dialog
        open={aprobarId !== null}
        onOpenChange={(v) => !v && setAprobarId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar solicitud</DialogTitle>
            <DialogDescription>
              Elegí el aula que se le asigna.
              {solicitudAprobar && textoRecurrencia(solicitudAprobar) && (
                <>
                  {" "}
                  Al aprobar se crean automáticamente los horarios: {textoRecurrencia(
                    solicitudAprobar
                  )?.replace("Pidió: ", "")}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label>Aula</Label>
            <Select
              value={aulaElegida}
              onValueChange={(v) => setAulaElegida(v ?? "")}
              items={Object.fromEntries(
                aulasHabilitadas.map((a) => [a.id, `${a.nombre} (capacidad ${a.capacidad})`])
              )}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un aula habilitada" />
              </SelectTrigger>
              <SelectContent>
                {aulasHabilitadas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre} (capacidad {a.capacidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={confirmarAprobacion} disabled={saving}>
              {saving ? "Confirmando..." : "Confirmar aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rechazarId !== null}
        onOpenChange={(v) => !v && setRechazarId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Contale al profesor por qué se rechaza (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="No hay aulas disponibles en ese horario..."
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmarRechazo} disabled={saving}>
              {saving ? "Confirmando..." : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
