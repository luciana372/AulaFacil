"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  DoorOpenIcon,
  ClipboardListIcon,
  CalendarClockIcon,
  BookOpenIcon,
  LibraryIcon,
  UsersRoundIcon,
  Settings2Icon,
  CircleHelpIcon,
  GraduationCapIcon,
  ScrollTextIcon,
  CalendarXIcon,
  DownloadIcon,
  Building2Icon,
  KeyRoundIcon,
  ChartColumnIcon,
} from "lucide-react"

import { api } from "@/lib/api-client"
import type { Usuario } from "@/lib/types"

const data = {
  navMain: [
    {
      title: "Resumen",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Aulas",
      url: "/dashboard/aulas",
      icon: <DoorOpenIcon />,
    },
    {
      title: "Métricas",
      url: "/dashboard/metricas",
      icon: <ChartColumnIcon />,
    },
    {
      title: "Solicitudes",
      url: "/dashboard/solicitudes",
      icon: <ClipboardListIcon />,
    },
    {
      title: "Horarios",
      url: "/dashboard/horarios",
      icon: <CalendarClockIcon />,
    },
    {
      title: "Clases",
      url: "/dashboard/clases",
      icon: <BookOpenIcon />,
    },
    {
      title: "Carreras",
      url: "/dashboard/carreras",
      icon: <LibraryIcon />,
    },
    {
      title: "Sedes",
      url: "/dashboard/sedes",
      icon: <Building2Icon />,
    },
    {
      title: "Usuarios",
      url: "/dashboard/usuarios",
      icon: <UsersRoundIcon />,
    },
    {
      title: "Bloqueos",
      url: "/dashboard/bloqueos",
      icon: <CalendarXIcon />,
    },
    {
      title: "Auditoría",
      url: "/dashboard/auditoria",
      icon: <ScrollTextIcon />,
    },
    {
      title: "Exportar",
      url: "/dashboard/exportar",
      icon: <DownloadIcon />,
    },
    {
      title: "API",
      url: "/dashboard/api-keys",
      icon: <KeyRoundIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Configuración",
      url: "/dashboard/configuracion",
      icon: <Settings2Icon />,
    },
    {
      title: "Ayuda",
      url: "/dashboard/ayuda",
      icon: <CircleHelpIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [usuario, setUsuario] = React.useState<Usuario | null>(null)

  React.useEffect(() => {
    api
      .get<Usuario>("/api/auth/me")
      .then(setUsuario)
      .catch(() => setUsuario(null))
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/dashboard" />}
            >
              <GraduationCapIcon className="size-5!" />
              <span className="text-base font-semibold">AulaFacil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {usuario && (
          <NavUser user={{ name: usuario.nombre, email: usuario.email }} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
