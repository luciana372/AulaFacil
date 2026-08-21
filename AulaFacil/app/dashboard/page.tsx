"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { SectionCards } from "@/components/section-cards"
import { SolicitudEstadoBadge } from "@/components/solicitud-estado-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { Aula, Clase, Horario, Solicitud } from "@/lib/types"

export default function Page() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [clases, setClases] = useState<Clase[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Aula[]>("/api/aulas"),
      api.get<Solicitud[]>("/api/solicitudes"),
      api.get<Clase[]>("/api/clases"),
      api.get<Horario[]>("/api/horarios"),
    ])
      .then(([aulas, solicitudes, clases, horarios]) => {
        setAulas(aulas)
        setSolicitudes(solicitudes)
        setClases(clases)
        setHorarios(horarios)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="px-4 text-sm text-muted-foreground lg:px-6">Cargando...</div>
  }

  const recientes = solicitudes.slice(0, 5)

  return (
    <>
      <SectionCards
        aulasHabilitadas={aulas.filter((a) => a.habilitada).length}
        aulasTotal={aulas.length}
        solicitudesPendientes={solicitudes.filter((s) => s.estado === "PENDIENTE").length}
        clasesActivas={clases.length}
        horariosAsignados={horarios.length}
      />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Solicitudes recientes</CardTitle>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/solicitudes" />}
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recientes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.claseNombre}</TableCell>
                    <TableCell>{s.profesorNombre}</TableCell>
                    <TableCell>{s.aulaNombre ?? "Sin asignar"}</TableCell>
                    <TableCell>
                      <SolicitudEstadoBadge estado={s.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
