import {
  DoorOpenIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  PresentationIcon,
  UsersRoundIcon,
} from "lucide-react"

import type { TipoEspacio } from "@/lib/types"

export const TIPO_ICONO: Record<TipoEspacio, typeof DoorOpenIcon> = {
  AULA: DoorOpenIcon,
  LABORATORIO: FlaskConicalIcon,
  AUDITORIO: PresentationIcon,
  SALA_REUNIONES: UsersRoundIcon,
  ESPACIO_DEPORTIVO: DumbbellIcon,
}

export const TIPO_GRADIENTE: Record<TipoEspacio, string> = {
  AULA: "from-blue-500/25 to-blue-500/5",
  LABORATORIO: "from-fuchsia-500/25 to-fuchsia-500/5",
  AUDITORIO: "from-slate-500/25 to-slate-500/5",
  SALA_REUNIONES: "from-emerald-500/25 to-emerald-500/5",
  ESPACIO_DEPORTIVO: "from-orange-500/25 to-orange-500/5",
}
