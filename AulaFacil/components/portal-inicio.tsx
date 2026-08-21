"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpenIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AulasFrecuentes } from "@/components/aulas-frecuentes"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ComoFunciona } from "@/components/como-funciona"
import { EspaciosDestacados } from "@/components/espacios-destacados"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api-client"
import type { Aula, Clase, Horario, Solicitud } from "@/lib/types"

export function PortalInicio() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [clases, setClases] = useState<Clase[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Clase[]>("/api/clases"),
      api.get<Aula[]>("/api/aulas"),
      api.get<Solicitud[]>("/api/solicitudes"),
      api.get<Horario[]>("/api/horarios"),
    ])
      .then(([clases, aulas, solicitudes, horarios]) => {
        setClases(clases)
        setAulas(aulas)
        setSolicitudes(solicitudes)
        setHorarios(horarios)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const q = busqueda.trim()
    router.push(`/portal/espacios${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  }

  const stats = [
    { label: "Mis clases", value: clases.length, icon: BookOpenIcon },
    { label: "Aulas disponibles", value: aulas.length, icon: DoorOpenIcon },
    {
      label: "Solicitudes pendientes",
      value: solicitudes.filter((s) => s.estado === "PENDIENTE").length,
      icon: ClipboardListIcon,
    },
    { label: "Horarios asignados", value: horarios.length, icon: CalendarClockIcon },
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
            Reservas en tiempo real
          </Badge>
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Reservá tu aula en segundos</h2>
            <p className="mt-1 text-muted-foreground">
              Buscá un espacio disponible y pedí tu reserva en un clic.
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <AulasFrecuentes />

      <EspaciosDestacados />

      <ComoFunciona />
    </div>
  )
}
