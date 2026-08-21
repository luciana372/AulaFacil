import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DoorOpenIcon, ClipboardListIcon, BookOpenIcon, CalendarClockIcon } from "lucide-react"

export function SectionCards({
  aulasHabilitadas,
  aulasTotal,
  solicitudesPendientes,
  clasesActivas,
  horariosAsignados,
}: {
  aulasHabilitadas: number
  aulasTotal: number
  solicitudesPendientes: number
  clasesActivas: number
  horariosAsignados: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aulas habilitadas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {aulasHabilitadas} / {aulasTotal}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DoorOpenIcon />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Disponibles para asignar horarios</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Solicitudes pendientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {solicitudesPendientes}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ClipboardListIcon />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Esperando aprobación de administración</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Clases activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {clasesActivas}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <BookOpenIcon />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Materias con profesor asignado</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Horarios asignados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {horariosAsignados}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CalendarClockIcon />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Franjas de aula + día + hora activas</div>
        </CardFooter>
      </Card>
    </div>
  )
}
