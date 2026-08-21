"use client"

import { useState } from "react"
import QRCode from "qrcode"
import { QrCodeIcon } from "lucide-react"
import { toast } from "sonner"

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

export function AulaQrDialog({
  aulaId,
  aulaNombre,
}: {
  aulaId: string
  aulaNombre: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  async function generar() {
    try {
      const url = `${window.location.origin}/checkin/${aulaId}`
      const png = await QRCode.toDataURL(url, { width: 320, margin: 2 })
      setDataUrl(png)
    } catch {
      toast.error("No se pudo generar el código QR.")
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) generar()
        else setDataUrl(null)
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <QrCodeIcon />
        <span className="sr-only">Ver código QR</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR de ingreso — {aulaNombre}</DialogTitle>
          <DialogDescription>
            Imprimí y pegá este código en la puerta del aula. Los profesores lo
            escanean para confirmar su clase del día.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR de ${aulaNombre}`} className="size-64" />
          ) : (
            <p className="text-sm text-muted-foreground">Generando...</p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!dataUrl}
            onClick={() => {
              if (!dataUrl) return
              const a = document.createElement("a")
              a.href = dataUrl
              a.download = `qr-${aulaNombre.toLowerCase().replace(/\s+/g, "-")}.png`
              a.click()
            }}
          >
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
