"use client"

import { useEffect, useState } from "react"
import { BellIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-client"
import { tiempoRelativo } from "@/lib/tiempo-relativo"
import type { Notificacion } from "@/lib/types"

const POLL_MS = 30000

export function NotificacionesBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  useEffect(() => {
    function cargar() {
      api
        .get<Notificacion[]>("/api/notificaciones")
        .then(setNotificaciones)
        .catch(() => {})
    }
    cargar()
    const interval = setInterval(cargar, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  async function marcarUna(id: string) {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    try {
      await api.patch(`/api/notificaciones/${id}`, { leida: true })
    } catch {
      // no bloqueamos la UI por un fallo al marcar como leída
    }
  }

  async function marcarTodas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      await api.post("/api/notificaciones/marcar-leidas", {})
    } catch {
      // no bloqueamos la UI por un fallo al marcar como leída
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="relative" />
        }
      >
        <BellIcon />
        {noLeidas > 0 && (
          <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
            {noLeidas}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs font-normal text-muted-foreground hover:text-foreground"
              >
                Marcar todas como leídas
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {notificaciones.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No tenés notificaciones.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notificaciones.map((n) => (
              <DropdownMenuItem
                key={n.id}
                closeOnClick={false}
                onClick={() => !n.leida && marcarUna(n.id)}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <div className="flex w-full items-start gap-2">
                  {!n.leida && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className={n.leida ? "text-muted-foreground" : ""}>{n.mensaje}</span>
                </div>
                <span className="pl-3.5 text-xs text-muted-foreground">
                  {tiempoRelativo(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
