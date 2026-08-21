"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { EstadoSolicitud, Metricas } from "@/lib/types"

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
}

const ESTADO_COLOR: Record<EstadoSolicitud, string> = {
  PENDIENTE: "var(--color-status-warning)",
  APROBADA: "var(--color-status-good)",
  RECHAZADA: "var(--color-status-critical)",
  CANCELADA: "var(--muted-foreground)",
}

const ocupacionConfig: ChartConfig = {
  horas: { label: "Horas/semana", color: "var(--chart-1)" },
}

const horariosConfig: ChartConfig = {
  cantidad: { label: "Clases", color: "var(--chart-1)" },
}

const estadoConfig: ChartConfig = {
  cantidad: { label: "Solicitudes" },
}

const asistenciaConfig: ChartConfig = {
  ingresos: { label: "Asistió", color: "var(--color-status-good)" },
  ausencias: { label: "No se presentó", color: "var(--color-status-critical)" },
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
    </Card>
  )
}

export default function MetricasPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Metricas>("/api/metricas")
      .then(setMetricas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="px-4 text-sm text-muted-foreground lg:px-6">Cargando...</div>
  }
  if (!metricas) {
    return (
      <div className="px-4 text-sm text-muted-foreground lg:px-6">
        No se pudieron cargar las métricas.
      </div>
    )
  }

  const { kpis } = metricas

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <StatTile
          label="Tasa de aprobación"
          value={kpis.tasaAprobacion !== null ? `${kpis.tasaAprobacion}%` : "—"}
          hint="Aprobadas sobre aprobadas + rechazadas"
        />
        <StatTile
          label="Tasa de asistencia"
          value={kpis.tasaAsistencia !== null ? `${kpis.tasaAsistencia}%` : "—"}
          hint="Check-ins sobre check-ins + ausencias (8 semanas)"
        />
        <StatTile
          label="Aula más ocupada"
          value={kpis.aulaMasOcupada?.aula ?? "—"}
          hint={
            kpis.aulaMasOcupada
              ? `${kpis.aulaMasOcupada.horas} hs/semana reservadas`
              : "Sin horarios asignados todavía"
          }
        />
        <StatTile
          label="Aula mejor valorada"
          value={kpis.aulaMejorValorada?.aula ?? "—"}
          hint={
            kpis.aulaMejorValorada
              ? `${kpis.aulaMejorValorada.promedio} / 5 (${kpis.aulaMejorValorada.cantidad} valoraciones)`
              : "Sin valoraciones todavía"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ocupación por aula</CardTitle>
            <CardDescription>Horas reservadas por semana, top 8</CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.ocupacionPorAula.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin horarios asignados.</p>
            ) : (
              <ChartContainer config={ocupacionConfig} className="aspect-auto h-72 w-full">
                <BarChart
                  data={metricas.ocupacionPorAula}
                  layout="vertical"
                  margin={{ left: 8, right: 24 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="0" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="aula"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="horas"
                    fill="var(--color-horas)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por estado</CardTitle>
            <CardDescription>Histórico completo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={estadoConfig} className="aspect-auto h-72 w-full">
              <BarChart
                data={metricas.solicitudesEstado.map((s) => ({
                  estadoLabel: ESTADO_LABEL[s.estado],
                  estado: s.estado,
                  cantidad: s.cantidad,
                }))}
                margin={{ top: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="0" />
                <XAxis dataKey="estadoLabel" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {metricas.solicitudesEstado.map((s) => (
                    <Cell key={s.estado} fill={ESTADO_COLOR[s.estado]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios pico</CardTitle>
            <CardDescription>Clases que arrancan en cada franja horaria</CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.horariosPorHora.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin horarios asignados.</p>
            ) : (
              <ChartContainer config={horariosConfig} className="aspect-auto h-72 w-full">
                <BarChart data={metricas.horariosPorHora} margin={{ top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" />
                  <XAxis dataKey="hora" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="cantidad"
                    fill="var(--color-cantidad)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asistencia semanal</CardTitle>
            <CardDescription>Check-ins vs. ausencias, últimas 8 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.asistenciaSemanal.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin check-ins ni ausencias registradas todavía.
              </p>
            ) : (
              <ChartContainer config={asistenciaConfig} className="aspect-auto h-72 w-full">
                <LineChart data={metricas.asistenciaSemanal} margin={{ top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" />
                  <XAxis dataKey="semana" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="ingresos"
                    stroke="var(--color-ingresos)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-ingresos)" }}
                  />
                  <Line
                    dataKey="ausencias"
                    stroke="var(--color-ausencias)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-ausencias)" }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mejor valoradas</CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.aulasValoracion.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin valoraciones todavía.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aula</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead className="text-right">Valoraciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas.aulasValoracion.map((a) => (
                    <TableRow key={a.aula}>
                      <TableCell className="font-medium">{a.aula}</TableCell>
                      <TableCell>{a.promedio} / 5</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {a.cantidad}
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
            <CardTitle>Más reportadas</CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.aulasReportes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin reportes todavía.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aula</TableHead>
                    <TableHead className="text-right">Reportes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas.aulasReportes.map((a) => (
                    <TableRow key={a.aula}>
                      <TableCell className="font-medium">{a.aula}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {a.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
