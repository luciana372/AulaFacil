"use client"

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DiaSemana, Horario } from "@/lib/types"

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const DIAS_HEADER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// JS Date.getDay(): 0=domingo..6=sábado. Nuestro enum no tiene domingo.
const DIA_JS_A_DIASEMANA: Record<number, DiaSemana | null> = {
  0: null,
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7 // 0=lunes
  const start = new Date(year, month, 1 - firstWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function MonthlyCalendar({ horarios }: { horarios: Horario[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const days = buildMonthGrid(cursor.getFullYear(), cursor.getMonth())

  function irAHoy() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
  }
  function mesAnterior() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  }
  function mesSiguiente() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }

  function horariosDelDia(d: Date) {
    const dia = DIA_JS_A_DIASEMANA[d.getDay()]
    if (!dia) return []
    return horarios
      .filter((h) => h.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={irAHoy}>
            Hoy
          </Button>
          <Button variant="outline" size="icon-sm" onClick={mesAnterior} aria-label="Mes anterior">
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={mesSiguiente} aria-label="Mes siguiente">
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border">
        {DIAS_HEADER.map((d) => (
          <div
            key={d}
            className="border-b bg-muted/40 px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const eventos = horariosDelDia(d)
          const esDelMes = d.getMonth() === cursor.getMonth()
          const esHoy = d.toDateString() === today.toDateString()
          return (
            <div
              key={i}
              className={cn(
                "min-h-24 border-r border-b p-1.5 text-sm",
                (i + 1) % 7 === 0 && "border-r-0",
                !esDelMes && "bg-muted/20 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs",
                  esHoy && "bg-primary font-semibold text-primary-foreground"
                )}
              >
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {eventos.slice(0, 2).map((h) => (
                  <div
                    key={h.id}
                    className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary"
                    title={`${h.claseNombre} — ${h.aulaNombre} (${h.horaInicio}-${h.horaFin})`}
                  >
                    {h.horaInicio} {h.claseNombre}
                  </div>
                ))}
                {eventos.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{eventos.length - 2} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
