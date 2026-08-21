"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, MapPinIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { TIPO_ICONO, TIPO_GRADIENTE } from "@/lib/tipo-espacio-estilos"
import { TIPO_ESPACIO_LABEL, type Aula } from "@/lib/types"

export function EspaciosDestacados({
  mostrarReservar = true,
}: {
  mostrarReservar?: boolean
}) {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Aula[]>("/api/aulas")
      .then(setAulas)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const destacados = [...aulas]
    .sort((a, b) => (b.valoracionPromedio ?? 0) - (a.valoracionPromedio ?? 0))
    .slice(0, 5)

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando espacios...</p>
  }
  if (destacados.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">Espacios destacados</h2>
          <p className="text-sm text-muted-foreground">
            Los espacios más solicitados del campus
          </p>
        </div>
        <Link
          href="/portal/espacios"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Ver todos <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destacados.map((aula) => {
          const Icono = TIPO_ICONO[aula.tipo]
          return (
            <Card key={aula.id} className="overflow-hidden py-0">
              <div
                className={`flex h-28 items-center justify-center bg-gradient-to-br ${TIPO_GRADIENTE[aula.tipo]}`}
              >
                <Icono className="size-8 text-foreground/40" />
              </div>
              <CardContent className="flex flex-col gap-2 py-4">
                <Badge variant="outline" className="w-fit text-xs font-normal">
                  {TIPO_ESPACIO_LABEL[aula.tipo]}
                </Badge>
                <h3 className="font-semibold">{aula.nombre}</h3>
                {aula.ubicacion && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPinIcon className="size-3.5" />
                    {aula.ubicacion}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersIcon className="size-3.5" />
                    {aula.capacidad} personas
                  </div>
                  {mostrarReservar && (
                    <Link
                      href="/portal/reservas"
                      className="flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      Reservar <ArrowRightIcon className="size-3.5" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
