"use client"

import { useState } from "react"
import { AlertTriangleIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"

export function ReportarAulaVaciaButton({ aulaId }: { aulaId: string }) {
  const [enviado, setEnviado] = useState(false)
  const [saving, setSaving] = useState(false)

  async function reportar() {
    setSaving(true)
    try {
      await api.post("/api/reportes", {
        aulaId,
        descripcion: "Figura ocupada en este horario pero está vacía.",
      })
      setEnviado(true)
      toast.success("Gracias, avisamos a administración.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el reporte.")
    } finally {
      setSaving(false)
    }
  }

  if (enviado) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckIcon className="size-4" />
        Reporte enviado
      </p>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={reportar} disabled={saving}>
      <AlertTriangleIcon />
      {saving ? "Enviando..." : "Está vacía, avisar a administración"}
    </Button>
  )
}
