import { Badge } from "@/components/ui/badge"
import type { TipoUso } from "@/lib/types"

const TIPO_USO_STYLE: Record<TipoUso, string> = {
  CATEDRA: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  INVESTIGACION:
    "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  LIBRE: "bg-muted text-muted-foreground border-muted-foreground/30",
}

const TIPO_USO_LABEL: Record<TipoUso, string> = {
  CATEDRA: "Cátedra",
  INVESTIGACION: "Investigación",
  LIBRE: "Uso libre",
}

export function TipoUsoBadge({ tipoUso }: { tipoUso: TipoUso }) {
  return (
    <Badge variant="outline" className={TIPO_USO_STYLE[tipoUso]}>
      {TIPO_USO_LABEL[tipoUso]}
    </Badge>
  )
}
