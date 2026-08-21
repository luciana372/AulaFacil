"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { api } from "@/lib/api-client"
import type { Carrera, Role, Usuario } from "@/lib/types"

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administración",
  PROFESOR: "Profesor",
  ALUMNO: "Alumno",
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [propioId, setPropioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Usuario[]>("/api/usuarios"),
      api.get<Usuario>("/api/auth/me"),
      api.get<Carrera[]>("/api/carreras"),
    ])
      .then(([usuarios, propio, carreras]) => {
        setUsuarios(usuarios)
        setPropioId(propio.id)
        setCarreras(carreras)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function cambiarCarrera(usuario: Usuario, carreraId: string) {
    const anterior = usuario.carreraId
    const carreraElegida = carreras.find((c) => c.id === carreraId)
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuario.id
          ? { ...u, carreraId, carreraNombre: carreraElegida?.nombre ?? null }
          : u
      )
    )
    try {
      await api.patch(`/api/usuarios/${usuario.id}`, { carreraId })
      toast.success("Carrera actualizada.")
    } catch (e) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, carreraId: anterior } : u))
      )
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la carrera.")
    }
  }

  async function cambiarRol(usuario: Usuario, role: Role) {
    setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, role } : u)))
    try {
      await api.patch(`/api/usuarios/${usuario.id}`, { role })
      toast.success("Rol actualizado.")
    } catch (e) {
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? usuario : u)))
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el rol.")
    }
  }

  async function cambiarActivo(usuario: Usuario, activo: boolean) {
    setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, activo } : u)))
    try {
      await api.patch(`/api/usuarios/${usuario.id}`, { activo })
      toast.success(activo ? "Cuenta habilitada." : "Cuenta deshabilitada.")
    } catch (e) {
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? usuario : u)))
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la cuenta.")
    }
  }

  async function quitarPenalizacion(usuario: Usuario) {
    const anterior = usuario.penalizadoHasta
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, penalizadoHasta: null } : u))
    )
    try {
      await api.patch(`/api/usuarios/${usuario.id}`, { quitarPenalizacion: true })
      toast.success("Penalización levantada.")
    } catch (e) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, penalizadoHasta: anterior } : u))
      )
      toast.error(
        e instanceof Error ? e.message : "No se pudo levantar la penalización."
      )
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => {
                  const esUnoMismo = u.id === propioId
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.nombre}
                        {esUnoMismo && (
                          <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => v && cambiarRol(u, v as Role)}
                          disabled={esUnoMismo}
                          items={ROLE_LABEL}
                        >
                          <SelectTrigger size="sm" className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["ADMIN", "PROFESOR", "ALUMNO"] as Role[]).map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.role === "ALUMNO" ? (
                          <Select
                            value={u.carreraId ?? ""}
                            onValueChange={(v) => v && cambiarCarrera(u, v)}
                            items={Object.fromEntries(carreras.map((c) => [c.id, c.nombre]))}
                          >
                            <SelectTrigger size="sm" className="w-48">
                              <SelectValue placeholder="Sin asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              {carreras.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.role === "PROFESOR" &&
                        u.penalizadoHasta &&
                        new Date(u.penalizadoHasta).getTime() > Date.now() ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              title="Prioridad reducida por inasistencias reiteradas"
                              className="border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400"
                            >
                              Penalizado hasta{" "}
                              {new Date(u.penalizadoHasta).toLocaleDateString("es-AR")}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => quitarPenalizacion(u)}
                            >
                              Quitar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.activo
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "border-muted-foreground/30 bg-muted text-muted-foreground"
                          }
                        >
                          {u.activo ? "Activo" : "Deshabilitado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={u.activo ?? true}
                          disabled={esUnoMismo}
                          onCheckedChange={(v) => cambiarActivo(u, v)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
