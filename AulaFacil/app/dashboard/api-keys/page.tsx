"use client"

import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon, PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import type { ApiKey } from "@/lib/types"

type RespuestaCreacion = ApiKey & { clave: string }

export default function ApiKeysPage() {
  const [claves, setClaves] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")
  const [claveRecienCreada, setClaveRecienCreada] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    api
      .get<ApiKey[]>("/api/api-keys")
      .then(setClaves)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function crearClave() {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const { clave, ...nueva } = await api.post<RespuestaCreacion>(
        "/api/api-keys",
        { nombre: nombre.trim() }
      )
      setClaves((prev) => [nueva, ...prev])
      setClaveRecienCreada(clave)
      setCopiado(false)
      setNombre("")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la clave.")
    } finally {
      setSaving(false)
    }
  }

  async function copiarClave() {
    if (!claveRecienCreada) return
    await navigator.clipboard.writeText(claveRecienCreada)
    setCopiado(true)
    toast.success("Clave copiada.")
  }

  async function revocarClave(id: string) {
    try {
      await api.delete(`/api/api-keys/${id}`)
      setClaves((prev) => prev.filter((k) => k.id !== id))
      toast.success("Clave revocada.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo revocar la clave.")
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {claveRecienCreada && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Copiá esta clave ahora: no se va a volver a mostrar.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-2 py-1.5 text-sm">
              {claveRecienCreada}
            </code>
            <Button size="sm" variant="outline" onClick={copiarClave}>
              {copiado ? <CheckIcon /> : <CopyIcon />}
              {copiado ? "Copiada" : "Copiar"}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="w-fit"
            onClick={() => setClaveRecienCreada(null)}
          >
            Listo, ya la guardé
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Claves de API</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <PlusIcon />
              Nueva clave
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva clave de API</DialogTitle>
                <DialogDescription>
                  Para que otro sistema de la universidad consuma la API
                  pública de disponibilidad. La clave se muestra una sola vez
                  al crearla.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="nombre">Nombre / sistema</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Sistema académico"
                />
              </div>
              <DialogFooter>
                <Button onClick={crearClave} disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : claves.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay claves creadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Clave</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claves.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.nombre}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {k.prefijo}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          k.activa
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "border-muted-foreground/30 bg-muted text-muted-foreground"
                        }
                      >
                        {k.activa ? "Activa" : "Revocada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {k.ultimoUsoAt
                        ? new Date(k.ultimoUsoAt).toLocaleString("es-AR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => revocarClave(k.id)}
                      >
                        <TrashIcon />
                        <span className="sr-only">Revocar clave</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 text-sm">
          <p className="text-muted-foreground">
            API de solo lectura para que otros sistemas de la universidad
            consulten disponibilidad de aulas y horarios. Todas las
            solicitudes deben incluir el header <code>x-api-key</code> con
            una clave activa; sin ella, o con una revocada, responde{" "}
            <code>401</code>.
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium">GET /api/v1/aulas</h3>
            <p className="text-muted-foreground">
              Lista las aulas habilitadas. Parámetro opcional:{" "}
              <code>?sedeId=</code>.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`curl https://tu-dominio/api/v1/aulas \\
  -H "x-api-key: af_xxxxxxxx..."`}
            </pre>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`[
  {
    "id": "cabc123",
    "nombre": "Aula 101",
    "tipo": "AULA",
    "capacidad": 30,
    "ubicacion": "Planta baja",
    "sedeId": "cxyz456",
    "sedeNombre": "Sede Centro",
    "disponibleAhora": true,
    "bloqueoActivo": null
  }
]`}
            </pre>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium">GET /api/v1/horarios</h3>
            <p className="text-muted-foreground">
              Lista las franjas horarias asignadas. Parámetros opcionales:{" "}
              <code>?aulaId=</code>, <code>?sedeId=</code>,{" "}
              <code>?dia=LUNES..SABADO</code>.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`curl "https://tu-dominio/api/v1/horarios?dia=MARTES" \\
  -H "x-api-key: af_xxxxxxxx..."`}
            </pre>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`[
  {
    "id": "hdef789",
    "aulaId": "cabc123",
    "aulaNombre": "Aula 101",
    "sedeId": "cxyz456",
    "sedeNombre": "Sede Centro",
    "materia": "Matemática II",
    "profesor": "Marcela Ríos",
    "dia": "MARTES",
    "horaInicio": "14:00",
    "horaFin": "16:00",
    "origen": "MANUAL"
  }
]`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
