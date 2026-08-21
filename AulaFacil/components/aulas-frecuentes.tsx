"use client"

import { useEffect, useState } from "react"
import { TrendingUpIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import type { AulaFrecuente } from "@/lib/types"

export function AulasFrecuentes() {
  const [frecuentes, setFrecuentes] = useState<AulaFrecuente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<AulaFrecuente[]>("/api/aulas/frecuentes")
      .then(setFrecuentes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && frecuentes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="size-4" />
          Aulas que más usás
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {frecuentes.map((f) => (
              <div
                key={f.aulaId}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{f.aulaNombre}</span>
                <span className="text-xs text-muted-foreground">
                  {f.usos} {f.usos === 1 ? "vez" : "veces"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
