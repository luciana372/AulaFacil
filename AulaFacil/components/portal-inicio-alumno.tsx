"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpenIcon,
  CalendarClockIcon,
  DoorOpenIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AulasFrecuentes } from "@/components/aulas-frecuentes"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EspaciosDestacados } from "@/components/espacios-destacados"
import { HorarioRecordatorioButton } from "@/components/horario-recordatorio-button"
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
import { DIA_LABEL, type Aula, type Horario, type Recordatorio } from "@/lib/types"

export function PortalInicioAlumno() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [aulas, setAulas] = useState<Aula[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Aula[]>("/api/aulas"),
      api.get<Horario[]>("/api/horarios"),
      api.get<Recordatorio[]>("/api/recordatorios"),
    ])
      .then(([aulas, horarios, recordatorios]) => {
        setAulas(aulas)
        setHorarios(horarios)
        setRecordatorios(recordatorios)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function recordatorioDe(horarioId: string) {
    return recordatorios.find((r) => r.horarioId === horarioId) ?? null
  }

  function actualizarRecordatorio(horarioId: string, recordatorio: Recordatorio | null) {
    setRecordatorios((prev) => {
      const sinEste = prev.filter((r) => r.horarioId !== horarioId)
      return recordatorio ? [...sinEste, recordatorio] : sinEste
    })
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const q = busqueda.trim()
    router.push(`/portal/espacios${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  }

  const clasesUnicas = new Set(horarios.map((h) => h.claseNombre)).size

  const stats = [
    { label: "Mis clases", value: clasesUnicas, icon: BookOpenIcon },
    { label: "Horarios asignados", value: horarios.length, icon: CalendarClockIcon },
    { label: "Aulas disponibles", value: aulas.length, icon: DoorOpenIcon },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 py-2">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-normal"
          >
            <SparklesIcon className="size-3.5" />
            Todo tu campus, en un lugar
          </Badge>
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">¿Dónde tenés clase hoy?</h2>
            <p className="mt-1 text-muted-foreground">
              Consultá tus horarios y encontrá cualquier espacio del campus.
            </p>
          </div>
          <form onSubmit={buscar} className="relative max-w-md">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="bg-background pl-9"
              placeholder="Buscar aula, laboratorio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="size-4.5" />
              </div>
              <div>
                <div className="text-xl font-semibold tabular-nums">
                  {loading ? "…" : stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis próximas clases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : horarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay clases con horario asignado para tu carrera. Si
              creés que es un error, consultá con administración.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead className="text-right">Recordatorio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.claseNombre}</TableCell>
                    <TableCell>{DIA_LABEL[h.dia]}</TableCell>
                    <TableCell>
                      {h.horaInicio} - {h.horaFin}
                    </TableCell>
                    <TableCell>{h.aulaNombre}</TableCell>
                    <TableCell className="text-right">
                      <HorarioRecordatorioButton
                        horarioId={h.id}
                        recordatorio={recordatorioDe(h.id)}
                        onChange={(r) => actualizarRecordatorio(h.id, r)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AulasFrecuentes />

      <EspaciosDestacados mostrarReservar={false} />
    </div>
  )
}
