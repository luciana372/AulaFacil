"use client"

import { useState } from "react"
import { MenuIcon } from "lucide-react"

import { ChangePasswordButton } from "@/components/change-password-button"
import { NotificacionesBell } from "@/components/notificaciones-bell"
import { PortalSidebar } from "@/components/portal-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import type { Role } from "@/lib/types"

export function PortalShell({
  role,
  nombre,
  email,
  children,
}: {
  role: Extract<Role, "PROFESOR" | "ALUMNO">
  nombre: string
  email: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-svh overflow-hidden">
      <PortalSidebar
        role={role}
        nombre={nombre}
        email={email}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-4 lg:justify-end lg:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <div className="flex items-center gap-2">
            <NotificacionesBell />
            <ThemeToggle />
            <ChangePasswordButton />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
