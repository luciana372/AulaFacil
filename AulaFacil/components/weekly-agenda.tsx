import { Badge } from "@/components/ui/badge"
import { DIAS_SEMANA, DIA_LABEL, type Horario } from "@/lib/types"

const PX_PER_HOUR = 56

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function WeeklyAgenda({ horarios }: { horarios: Horario[] }) {
  if (horarios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay horarios para mostrar.</p>
    )
  }

  const starts = horarios.map((h) => toMinutes(h.horaInicio))
  const ends = horarios.map((h) => toMinutes(h.horaFin))
  const rangeStart = Math.floor(Math.min(...starts) / 60) * 60
  const rangeEnd = Math.ceil(Math.max(...ends) / 60) * 60
  const totalHours = Math.max(1, (rangeEnd - rangeStart) / 60)
  const hours = Array.from({ length: totalHours }, (_, i) => rangeStart / 60 + i)
  const columnHeight = totalHours * PX_PER_HOUR

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[56px_repeat(6,1fr)]">
        <div />
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="border-b px-2 pb-2 text-center text-sm font-medium">
            {DIA_LABEL[d]}
          </div>
        ))}

        <div className="relative" style={{ height: columnHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
              style={{ top: (h * 60 - rangeStart) * (PX_PER_HOUR / 60) }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {DIAS_SEMANA.map((d) => (
          <div key={d} className="relative border-l" style={{ height: columnHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t"
                style={{ top: (h * 60 - rangeStart) * (PX_PER_HOUR / 60) }}
              />
            ))}
            {horarios
              .filter((hor) => hor.dia === d)
              .map((hor) => {
                const top = (toMinutes(hor.horaInicio) - rangeStart) * (PX_PER_HOUR / 60)
                const height =
                  (toMinutes(hor.horaFin) - toMinutes(hor.horaInicio)) * (PX_PER_HOUR / 60)
                return (
                  <div
                    key={hor.id}
                    className="absolute inset-x-1 overflow-hidden rounded-md border border-primary/30 bg-primary/10 p-1 text-xs"
                    style={{ top, height }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate font-medium">{hor.claseNombre}</div>
                      {hor.origen === "OFICIAL" ? (
                        <Badge
                          variant="outline"
                          className="h-4 shrink-0 border-blue-500/30 bg-blue-500/15 px-1 text-[9px] text-blue-600 dark:text-blue-400"
                        >
                          Oficial
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-4 shrink-0 border-muted-foreground/30 bg-muted px-1 text-[9px] text-muted-foreground"
                        >
                          Reservada
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-muted-foreground">{hor.aulaNombre}</div>
                    <div className="truncate text-muted-foreground">
                      {hor.horaInicio}-{hor.horaFin}
                    </div>
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}
