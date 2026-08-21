"use client"

import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { RegistroAuditoria } from "@/lib/types"

const ACCION_LABEL: Record<string, string> = {
  SOLICITUD_CREADA: "Solicitud creada",
  SOLICITUD_AUTOAPROBADA: "Solicitud autoaprobada",
  SOLICITUD_APROBADA: "Solicitud aprobada",
  SOLICITUD_RECHAZADA: "Solicitud rechazada",
  SOLICITUD_CANCELADA: "Solicitud cancelada",
  HORARIO_CREADO: "Horario asignado",
  HORARIO_ELIMINADO: "Horario eliminado",
  AULA_CREADA: "Aula creada",
  AULA_HABILITADA: "Aula habilitada",
  AULA_DESHABILITADA: "Aula deshabilitada",
  AULA_MODIFICADA: "Aula modificada",
  CLASE_CREADA: "Clase creada",
  CLASE_MODIFICADA: "Clase modificada",
  USUARIO_MODIFICADO: "Usuario modificado",
  USUARIO_PENALIZADO: "Prioridad reducida por inasistencias",
  USUARIO_PENALIZACION_LEVANTADA: "Penalización levantada",
  CONFIGURACION_MODIFICADA: "Reglas de reserva modificadas",
  BLOQUEO_CREADO: "Bloqueo creado",
  BLOQUEO_ELIMINADO: "Bloqueo eliminado",
  SEDE_CREADA: "Sede creada",
  APIKEY_CREADA: "Clave de API creada",
  APIKEY_REVOCADA: "Clave de API revocada",
}

const ACCION_COLOR: Record<string, string> = {
  SOLICITUD_CREADA:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  SOLICITUD_AUTOAPROBADA:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SOLICITUD_APROBADA:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SOLICITUD_RECHAZADA:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  SOLICITUD_CANCELADA:
    "bg-muted text-muted-foreground border-muted-foreground/30",
  HORARIO_CREADO:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  HORARIO_ELIMINADO:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  AULA_CREADA:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  AULA_HABILITADA:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  AULA_DESHABILITADA:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  AULA_MODIFICADA:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  CLASE_CREADA:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  CLASE_MODIFICADA:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  USUARIO_MODIFICADO:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  USUARIO_PENALIZADO:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  USUARIO_PENALIZACION_LEVANTADA:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  CONFIGURACION_MODIFICADA:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  BLOQUEO_CREADO:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  BLOQUEO_ELIMINADO:
    "bg-muted text-muted-foreground border-muted-foreground/30",
  SEDE_CREADA:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  APIKEY_CREADA:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  APIKEY_REVOCADA:
    "bg-muted text-muted-foreground border-muted-foreground/30",
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    api
      .get<RegistroAuditoria[]>("/api/auditoria")
      .then(setRegistros)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const q = busqueda.trim().toLowerCase()
  const filtrados = registros.filter(
    (r) =>
      !q ||
      r.actorNombre.toLowerCase().includes(q) ||
      r.entidad.toLowerCase().includes(q) ||
      (r.detalle ?? "").toLowerCase().includes(q) ||
      (ACCION_LABEL[r.accion] ?? r.accion).toLowerCase().includes(q)
  )

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Auditoría</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por persona, acción o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay registros que coincidan con la búsqueda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ACCION_COLOR[r.accion] ?? ""}
                      >
                        {ACCION_LABEL[r.accion] ?? r.accion}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-96 truncate">
                      {r.detalle ?? "—"}
                    </TableCell>
                    <TableCell>{r.actorNombre}</TableCell>
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
