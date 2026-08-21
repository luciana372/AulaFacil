"use client"

import { usePathname } from "next/navigation"

import { NotificacionesBell } from "@/components/notificaciones-bell"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

const TITLES: Record<string, string> = {
  "/dashboard": "Resumen",
  "/dashboard/aulas": "Aulas",
  "/dashboard/metricas": "Métricas",
  "/dashboard/solicitudes": "Solicitudes",
  "/dashboard/horarios": "Horarios",
  "/dashboard/clases": "Clases",
  "/dashboard/carreras": "Carreras",
  "/dashboard/sedes": "Sedes",
  "/dashboard/usuarios": "Usuarios",
  "/dashboard/bloqueos": "Bloqueos",
  "/dashboard/auditoria": "Auditoría",
  "/dashboard/exportar": "Exportar",
  "/dashboard/api-keys": "API",
  "/dashboard/configuracion": "Configuración",
  "/dashboard/ayuda": "Ayuda",
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = TITLES[pathname] ?? "AulaFacil"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificacionesBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
