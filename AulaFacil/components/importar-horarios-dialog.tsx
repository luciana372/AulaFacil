"use client"

import { useRef, useState } from "react"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/lib/api-client"
import { EJEMPLO_CSV } from "@/lib/csv-horarios-cliente"
import type { ResultadoImportacion } from "@/lib/types"

export function ImportarHorariosDialog({ onImportado }: { onImportado: () => void }) {
  const [open, setOpen] = useState(false)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function elegirArchivo() {
    fileInputRef.current?.click()
  }

  async function onArchivoElegido(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const texto = await file.text()
    setImportando(true)
    setResultado(null)
    try {
      const res = await api.post<ResultadoImportacion>("/api/horarios/importar", { csv: texto })
      setResultado(res)
      if (res.creados > 0) {
        toast.success(`Se importaron ${res.creados} de ${res.total} horario(s).`)
        onImportado()
      } else if (res.total > 0) {
        toast.error("No se pudo importar ningún horario. Revisá los errores.")
      } else {
        toast.error("El archivo no tiene filas para importar.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo importar el archivo.")
    } finally {
      setImportando(false)
    }
  }

  function descargarPlantilla() {
    const blob = new Blob([EJEMPLO_CSV], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-horarios.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setResultado(null)
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UploadIcon />
        Importar CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar horarios oficiales</DialogTitle>
          <DialogDescription>
            Subí un CSV con las franjas asignadas por el sistema académico de la facultad.
            Cada fila se valida y crea contra los mismos chequeos de conflicto y duración que
            usa el resto del sistema, así que ninguna reserva manual puede pisarlas.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/50 p-3 text-xs">
          <p className="mb-1 font-medium">Columnas esperadas (con encabezado, separado por comas):</p>
          <code className="block whitespace-pre-wrap break-all">{EJEMPLO_CSV}</code>
          <Button variant="link" size="sm" className="mt-1 h-auto p-0" onClick={descargarPlantilla}>
            Descargar plantilla
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onArchivoElegido}
        />
        <Button onClick={elegirArchivo} disabled={importando} variant="outline">
          <UploadIcon />
          {importando ? "Importando..." : "Elegir archivo CSV"}
        </Button>

        {resultado && (
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto rounded-md border p-2">
            <p className="text-sm font-medium">
              {resultado.creados} de {resultado.total} importados
            </p>
            {resultado.filas.map((f) => (
              <div key={f.fila} className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={
                    f.ok
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400"
                  }
                >
                  Fila {f.fila}
                </Badge>
                <span className="text-muted-foreground">{f.ok ? "importada" : f.motivo}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
