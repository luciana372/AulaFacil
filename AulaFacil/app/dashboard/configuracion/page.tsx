"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"
import type { ConfiguracionReservas } from "@/lib/types"

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionReservas | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get<ConfiguracionReservas>("/api/configuracion")
      .then(setConfig)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function actualizarCampo(campo: keyof ConfiguracionReservas, valor: string) {
    if (!config) return
    const numero = Number(valor)
    setConfig({ ...config, [campo]: Number.isNaN(numero) ? 0 : numero })
  }

  async function guardar() {
    if (!config) return
    setSaving(true)
    try {
      const actualizada = await api.patch<ConfiguracionReservas>(
        "/api/configuracion",
        config
      )
      setConfig(actualizada)
      toast.success("Reglas de reserva actualizadas.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la configuración.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Reglas de reserva</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !config ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="grid max-w-md gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="anticipacionMinDias">
                  Anticipación mínima para aprobar (días)
                </Label>
                <Input
                  id="anticipacionMinDias"
                  type="number"
                  min={0}
                  value={config.anticipacionMinDias}
                  onChange={(e) => actualizarCampo("anticipacionMinDias", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  No se puede aprobar una solicitud antes de que pasen estos días desde
                  que se creó.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="anticipacionMaxDias">
                  Anticipación máxima para aprobar (días)
                </Label>
                <Input
                  id="anticipacionMaxDias"
                  type="number"
                  min={0}
                  value={config.anticipacionMaxDias}
                  onChange={(e) => actualizarCampo("anticipacionMaxDias", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Pasado este plazo desde la creación, la solicitud ya no se puede
                  aprobar.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="duracionMaximaMinutos">
                  Duración máxima por reserva (minutos)
                </Label>
                <Input
                  id="duracionMaximaMinutos"
                  type="number"
                  min={1}
                  value={config.duracionMaximaMinutos}
                  onChange={(e) => actualizarCampo("duracionMaximaMinutos", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="maxReservasSimultaneasPorUsuario">
                  Máximo de reservas simultáneas por profesor
                </Label>
                <Input
                  id="maxReservasSimultaneasPorUsuario"
                  type="number"
                  min={1}
                  value={config.maxReservasSimultaneasPorUsuario}
                  onChange={(e) =>
                    actualizarCampo("maxReservasSimultaneasPorUsuario", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Cuenta las solicitudes pendientes o aprobadas de un mismo profesor.
                </p>
              </div>
              <Button onClick={guardar} disabled={saving} className="w-fit">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
