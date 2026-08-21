import { Badge } from "@/components/ui/badge"
import type { EstadoSolicitud } from "@/lib/types"

const ESTADO_STYLE: Record<EstadoSolicitud, string> = {
  PENDIENTE: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  APROBADA: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  RECHAZADA: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  CANCELADA: "bg-muted text-muted-foreground border-muted-foreground/30",
}

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
}

export function SolicitudEstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <Badge variant="outline" className={ESTADO_STYLE[estado]}>
      {ESTADO_LABEL[estado]}
    </Badge>
  )
}
