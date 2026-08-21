import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const FAQ: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: "¿Cómo habilito una aula nueva para que se pueda reservar?",
    respuesta:
      "Las aulas se crean deshabilitadas por defecto. En Aulas, activá la llave (Switch) de la columna Habilitada. Recién ahí aparece como opción para los profesores y se le pueden asignar horarios.",
  },
  {
    pregunta: "¿Por qué no puedo aprobar una solicitud?",
    respuesta:
      "Puede chocar con las reglas configuradas en Configuración: anticipación mínima/máxima desde que se creó la solicitud, o el aula elegida no está habilitada. El mensaje de error indica cuál de las dos reglas frena la aprobación.",
  },
  {
    pregunta: "¿En qué orden aparecen las solicitudes pendientes?",
    respuesta:
      "Se ordenan automáticamente por prioridad: primero Cátedra, después Proyecto de investigación, y al final los profesores penalizados por inasistencias reiteradas (3 o más ausencias sin check-in en 30 días) — sin importar su tipo de uso real. Dentro del mismo nivel de prioridad, se ordenan por fecha de creación.",
  },
  {
    pregunta: "¿Cómo bloqueo aulas para un feriado o la semana de exámenes?",
    respuesta:
      "En Bloqueos, creá uno nuevo con el rango de fechas y, opcionalmente, un aula específica (si dejás \"Todas las aulas\", aplica a todo el edificio). No impide crear horarios nuevos que caigan en esas fechas, pero avisa con una advertencia al admin al crearlos o aprobarlos.",
  },
  {
    pregunta: "¿Qué significa que un profesor esté \"penalizado\"?",
    respuesta:
      "El sistema registra automáticamente una ausencia cuando un profesor no hace check-in por QR dentro de los primeros 20 minutos de su clase. Con 3 o más ausencias en 30 días, sus solicitudes pasan a la prioridad más baja durante 15 días. Se puede ver y levantar manualmente desde Usuarios.",
  },
  {
    pregunta: "¿Cómo dejo que otro sistema de la universidad consulte la disponibilidad de aulas?",
    respuesta:
      "En API, generá una clave nueva — se muestra una sola vez, copiala en ese momento. El otro sistema la manda en el header x-api-key contra /api/v1/aulas y /api/v1/horarios (documentación con ejemplos en esa misma página). Podés revocarla en cualquier momento.",
  },
  {
    pregunta: "¿Qué diferencia hay entre un horario \"Oficial\" y uno \"Manual\"?",
    respuesta:
      "Oficial es el que vino de una importación por CSV del sistema académico (Horarios → Importar). Manual es el que se creó a mano acá, sea por vos o por la aprobación de una solicitud. Ambos conviven sin pisarse: la importación respeta los mismos chequeos de conflicto que la carga manual.",
  },
  {
    pregunta: "¿Cómo consigo un reporte histórico si hay un reclamo?",
    respuesta:
      "Auditoría muestra quién hizo qué y cuándo, con buscador. Para un reporte completo para exportar o adjuntar, andá a Exportar y descargá el CSV de Auditoría (o el de la entidad puntual: Solicitudes, Horarios, Asistencias, etc.).",
  },
]

const SECCIONES: { titulo: string; descripcion: string }[] = [
  {
    titulo: "Resumen",
    descripcion:
      "Panorama general: aulas habilitadas, solicitudes pendientes, clases activas y horarios asignados, más las últimas solicitudes recibidas.",
  },
  {
    titulo: "Aulas",
    descripcion:
      "Alta de aulas (nombre, capacidad, ubicación, tipo, equipamiento, sede), habilitar/deshabilitar con motivo, definir si requieren aprobación manual, ver valoraciones y reportes de problemas, generar el código QR de check-in, y el mapa esquemático del edificio por piso.",
  },
  {
    titulo: "Métricas",
    descripcion:
      "Estadísticas del uso del sistema: tasa de aprobación, tasa de asistencia, ocupación por aula, horarios pico, distribución de solicitudes por estado, y rankings de aulas mejor valoradas o más reportadas.",
  },
  {
    titulo: "Solicitudes",
    descripcion:
      "Cola de pedidos de aula de los profesores, ya ordenada por prioridad. Aprobar asigna el aula (y crea los horarios recurrentes si el profesor pidió varios días de una vez); rechazar pide un motivo opcional.",
  },
  {
    titulo: "Horarios",
    descripcion:
      "Franjas fijas de aula + clase + día + hora. Se pueden cargar a mano, importar en bloque por CSV desde el sistema académico, o eliminar (avisa automáticamente a quien estaba en lista de espera por ese horario). Vista en tabla o en agenda semanal.",
  },
  {
    titulo: "Clases",
    descripcion:
      "Una clase es una materia dictada por un profesor para una carrera puntual. Acá se crean y se les puede corregir la carrera asignada.",
  },
  {
    titulo: "Carreras",
    descripcion:
      "Programas de estudio. Determinan qué clases y horarios ve automáticamente cada alumno, según la carrera que le asignaste en Usuarios.",
  },
  {
    titulo: "Sedes",
    descripcion:
      "Solo hace falta si la universidad tiene más de un edificio o campus. Cada aula se puede asignar a una sede para filtrarlas por separado en toda la app.",
  },
  {
    titulo: "Usuarios",
    descripcion:
      "Cambiar rol, activar/desactivar cuentas, asignar carrera a los alumnos, y ver/levantar la penalización por inasistencias de un profesor.",
  },
  {
    titulo: "Bloqueos",
    descripcion:
      "Feriados, semana de exámenes o eventos especiales que bloquean una o todas las aulas durante un rango de fechas puntual.",
  },
  {
    titulo: "Auditoría",
    descripcion:
      "Registro completo de quién reservó, canceló, aprobó, rechazó o modificó qué, y cuándo — con buscador por persona, acción o detalle.",
  },
  {
    titulo: "Exportar",
    descripcion:
      "Descarga en CSV de cada entidad (solicitudes, horarios, asistencias, reportes, usuarios, aulas, clases, bloqueos, auditoría) para reportes históricos o reclamos.",
  },
  {
    titulo: "API",
    descripcion:
      "Generación y revocación de claves para que otros sistemas de la universidad consulten disponibilidad de aulas y horarios en modo solo lectura, sin necesidad de una cuenta en AulaFácil.",
  },
  {
    titulo: "Configuración",
    descripcion:
      "Reglas globales de reserva: anticipación mínima y máxima para aprobar, duración máxima por reserva, y límite de reservas simultáneas por profesor.",
  },
]

export default function AyudaPage() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Preguntas frecuentes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {FAQ.map((item) => (
            <details key={item.pregunta} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.pregunta}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.respuesta}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guía por sección</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SECCIONES.map((s) => (
            <div key={s.titulo} className="rounded-lg border p-3">
              <h3 className="mb-1 text-sm font-semibold">{s.titulo}</h3>
              <p className="text-sm text-muted-foreground">{s.descripcion}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
