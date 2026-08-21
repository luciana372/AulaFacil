"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { AulaFavoritoButton } from "@/components/aula-favorito-button"
import { AulaReporteDialog } from "@/components/aula-reporte-dialog"
import { AulaValoracionDialog } from "@/components/aula-valoracion-dialog"
import { AulasFiltros } from "@/components/aulas-filtros"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EdificioMapa } from "@/components/edificio-mapa"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import {
  FILTROS_VACIOS,
  filtrarAulas,
  type FiltrosAula,
} from "@/lib/aulas-filtro"
import { EQUIPAMIENTO_LABEL, type Aula } from "@/lib/types"

const POLL_MS = 30000

export function PortalEspacios() {
  const searchParams = useSearchParams()
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState(searchParams.get("q") ?? "")
  const [filtros, setFiltros] = useState<FiltrosAula>(FILTROS_VACIOS)

  useEffect(() => {
    api
      .get<Aula[]>("/api/aulas")
      .then(setAulas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))

    // Refresco silencioso para que "disponible ahora" se mantenga al día
    const interval = setInterval(() => {
      api
        .get<Aula[]>("/api/aulas")
        .then(setAulas)
        .catch(() => {})
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  function actualizarAula(aulaActualizada: Aula) {
    setAulas((prev) =>
      prev.map((a) => (a.id === aulaActualizada.id ? aulaActualizada : a))
    )
  }

  const aulasFiltradas = filtrarAulas(
    aulas.filter((a) =>
      a.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
    ),
    filtros
  )

  return (
    <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Espacios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar aula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {!loading && aulas.length > 0 && (
            <AulasFiltros
              aulas={aulas}
              filtros={filtros}
              onChange={setFiltros}
            />
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : aulas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay aulas habilitadas por el momento.
            </p>
          ) : aulasFiltradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ningún aula coincide con los filtros elegidos.
            </p>
          ) : (
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
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Equipamiento</TableHead>
                      <TableHead>Ahora</TableHead>
                      <TableHead>Valoración</TableHead>
                      <TableHead>Problemas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aulasFiltradas.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <AulaFavoritoButton
                              aulaId={a.id}
                              favorito={a.favorito ?? false}
                              onChange={(favorito) =>
                                actualizarAula({ ...a, favorito })
                              }
                            />
                            {a.nombre}
                          </div>
                        </TableCell>
                        <TableCell>{a.capacidad}</TableCell>
                        <TableCell>{a.ubicacion ?? "—"}</TableCell>
                        <TableCell>
                          {a.equipamiento.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {a.equipamiento.map((eq) => (
                                <Badge
                                  key={eq}
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {EQUIPAMIENTO_LABEL[eq]}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            title={a.bloqueoActivo ?? undefined}
                            className={
                              a.bloqueoActivo
                                ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : a.disponibleAhora
                                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "border-muted-foreground/30 bg-muted text-muted-foreground"
                            }
                          >
                            {a.bloqueoActivo
                              ? "Bloqueada"
                              : a.disponibleAhora
                                ? "Libre"
                                : "Ocupada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AulaValoracionDialog
                            aula={a}
                            onUpdated={actualizarAula}
                          />
                        </TableCell>
                        <TableCell>
                          <AulaReporteDialog
                            aula={a}
                            onUpdated={actualizarAula}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="mapa" className="mt-4">
                <EdificioMapa aulas={aulasFiltradas} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
