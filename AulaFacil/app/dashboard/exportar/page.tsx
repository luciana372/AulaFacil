import {
  BuildingIcon,
  CalendarOffIcon,
  ClipboardListIcon,
  DownloadIcon,
  GraduationCapIcon,
  ScrollTextIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DATASETS = [
  {
    href: "/api/exportar/solicitudes",
    titulo: "Solicitudes",
    descripcion:
      "Todas las solicitudes de aula, con estado, aula asignada y fechas.",
    icon: ClipboardListIcon,
  },
  {
    href: "/api/exportar/horarios",
    titulo: "Horarios",
    descripcion: "Franjas horarias asignadas: materia, profesor, aula y día.",
    icon: ScrollTextIcon,
  },
  {
    href: "/api/exportar/asistencias",
    titulo: "Asistencias",
    descripcion: "Check-ins por QR y ausencias registradas, por fecha.",
    icon: DownloadIcon,
  },
  {
    href: "/api/exportar/reportes",
    titulo: "Reportes de aulas",
    descripcion: "Problemas reportados en aulas, con estado de resolución.",
    icon: TriangleAlertIcon,
  },
  {
    href: "/api/exportar/usuarios",
    titulo: "Usuarios",
    descripcion: "Todos los usuarios registrados, rol, carrera y estado.",
    icon: UsersIcon,
  },
  {
    href: "/api/exportar/aulas",
    titulo: "Aulas",
    descripcion: "Todas las aulas con capacidad, equipamiento y estado.",
    icon: BuildingIcon,
  },
  {
    href: "/api/exportar/clases",
    titulo: "Clases",
    descripcion: "Todas las clases con materia, profesor y carrera.",
    icon: GraduationCapIcon,
  },
  {
    href: "/api/exportar/bloqueos",
    titulo: "Bloqueos",
    descripcion:
      "Feriados, semanas de examen y eventos que bloquearon aulas.",
    icon: CalendarOffIcon,
  },
  {
    href: "/api/exportar/auditoria",
    titulo: "Auditoría",
    descripcion:
      "Historial completo de quién reservó, canceló o modificó qué, y cuándo.",
    icon: ScrollTextIcon,
  },
]

export default function ExportarPage() {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {DATASETS.map((d) => (
              <Card key={d.href}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <d.icon className="size-4.5" />
                    </div>
                    <h3 className="font-semibold">{d.titulo}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {d.descripcion}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    render={<a href={d.href} download />}
                    nativeButton={false}
                  >
                    <DownloadIcon />
                    Descargar CSV
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
