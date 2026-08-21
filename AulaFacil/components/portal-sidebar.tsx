"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarDaysIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react"

import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

const NAV_PROFESOR = [
  { title: "Inicio", href: "/portal", icon: LayoutDashboardIcon },
  { title: "Espacios", href: "/portal/espacios", icon: DoorOpenIcon },
  { title: "Mis reservas", href: "/portal/reservas", icon: ClipboardListIcon },
  { title: "Calendario", href: "/portal/calendario", icon: CalendarDaysIcon },
]

const NAV_ALUMNO = [
  { title: "Inicio", href: "/portal", icon: LayoutDashboardIcon },
  { title: "Espacios", href: "/portal/espacios", icon: DoorOpenIcon },
  { title: "Calendario", href: "/portal/calendario", icon: CalendarDaysIcon },
]

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function PortalSidebar({
  role,
  nombre,
  email,
  open,
  onClose,
}: {
  role: Extract<Role, "PROFESOR" | "ALUMNO">
  nombre: string
  email: string
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = role === "PROFESOR" ? NAV_PROFESOR : NAV_ALUMNO

  async function handleLogout() {
    await api.post("/api/auth/logout", {})
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-svh w-64 shrink-0 flex-col bg-zinc-950 text-zinc-100 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900">
            <GraduationCapIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">Aula Fácil</div>
            <div className="truncate text-[10px] tracking-wide text-zinc-400">
              RESERVAS DE ESPACIOS
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {nav.map((item) => {
            const active =
              item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-800 px-3 py-4">
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium">
              {initials(nombre)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{nombre}</div>
              <div className="truncate text-xs text-zinc-400">{email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <LogOutIcon className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
