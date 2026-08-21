"use client"

import { useEffect, useState } from "react"
import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MonthlyCalendar } from "@/components/monthly-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeeklyAgenda } from "@/components/weekly-agenda"
import { api } from "@/lib/api-client"
import { descargarICS } from "@/lib/ics"
import type { Horario } from "@/lib/types"

export function PortalCalendario() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Horario[]>("/api/horarios")
      .then(setHorarios)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function exportar() {
    if (horarios.length === 0) {
      toast.error("No tenés horarios para exportar todavía.")
      return
    }
    descargarICS(horarios)
    toast.success("Descargado. Importalo en Google Calendar, Outlook o tu app de calendario.")
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="mt-1 text-muted-foreground">
            Tus clases y horarios asignados — oficiales (del sistema académico) y
            reservados por vos, en un solo lugar.
          </p>
        </div>
        <Button variant="outline" onClick={exportar} disabled={loading}>
          <DownloadIcon />
          Exportar a calendario
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Tabs defaultValue="semana">
              <div className="mb-4 flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="semana">Mi semana</TabsTrigger>
                  <TabsTrigger value="mes">Mes</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="h-4 border-blue-500/30 bg-blue-500/15 px-1 text-[9px] text-blue-600 dark:text-blue-400"
                    >
                      Oficial
                    </Badge>
                    del sistema académico
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="h-4 border-muted-foreground/30 bg-muted px-1 text-[9px] text-muted-foreground"
                    >
                      Reservada
                    </Badge>
                    pedida en AulaFácil
                  </span>
                </div>
              </div>
              <TabsContent value="semana">
                <WeeklyAgenda horarios={horarios} />
              </TabsContent>
              <TabsContent value="mes">
                <MonthlyCalendar horarios={horarios} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
