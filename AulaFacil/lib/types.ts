export type Role = "ADMIN" | "PROFESOR" | "ALUMNO"

export type EstadoSolicitud =
  "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA"

export type EstadoReporte = "PENDIENTE" | "RESUELTO"

export type TipoUso = "CATEDRA" | "INVESTIGACION" | "LIBRE"

export type TipoEspacio =
  "AULA" | "LABORATORIO" | "AUDITORIO" | "SALA_REUNIONES" | "ESPACIO_DEPORTIVO"

export type DiaSemana =
  "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO"

export type TipoEquipamiento = "PROYECTOR" | "PC" | "PIZARRA_DIGITAL"

export interface Usuario {
  id: string
  nombre: string
  email: string
  role: Role
  activo?: boolean
  createdAt?: string
  carreraId?: string | null
  carreraNombre?: string | null
  penalizadoHasta?: string | null
}

export interface Carrera {
  id: string
  nombre: string
}

export interface Sede {
  id: string
  nombre: string
  direccion: string | null
}

export interface Aula {
  id: string
  nombre: string
  capacidad: number
  ubicacion: string | null
  tipo: TipoEspacio
  equipamiento: TipoEquipamiento[]
  habilitada: boolean
  motivoBloqueo: string | null
  requiereAprobacion: boolean
  sedeId?: string | null
  sedeNombre?: string | null
  favorito?: boolean
  valoracionPromedio?: number | null
  valoracionCount?: number
  reportesPendientes?: number
  disponibleAhora?: boolean
  bloqueoActivo?: string | null
}

export interface Valoracion {
  id: string
  aulaId: string
  usuarioId: string
  usuarioNombre: string
  puntaje: number
  comentario: string | null
  createdAt: string
}

export interface ReporteAula {
  id: string
  aulaId: string
  usuarioId: string
  usuarioNombre: string
  descripcion: string
  estado: EstadoReporte
  createdAt: string
  resueltaAt: string | null
}

export interface Materia {
  id: string
  nombre: string
}

export interface Clase {
  id: string
  materiaId: string
  materiaNombre: string
  profesorId: string
  profesorNombre: string
  carreraId: string
  carreraNombre: string
}

export interface Solicitud {
  id: string
  claseId: string
  claseNombre: string
  profesorId: string
  profesorNombre: string
  aulaId: string | null
  aulaNombre: string | null
  estado: EstadoSolicitud
  tipoUso: TipoUso
  profesorPenalizadoHasta: string | null
  comentario: string | null
  createdAt: string
  diasPreferidos: DiaSemana[]
  horaInicioPreferida: string | null
  horaFinPreferida: string | null
}

export type OrigenHorario = "MANUAL" | "OFICIAL"

export interface Horario {
  id: string
  claseId: string
  claseNombre: string
  aulaId: string
  aulaNombre: string
  dia: DiaSemana
  horaInicio: string
  horaFin: string
  origen: OrigenHorario
}

export interface FilaResultadoImportacion {
  fila: number
  ok: boolean
  motivo?: string
}

export interface ResultadoImportacion {
  total: number
  creados: number
  filas: FilaResultadoImportacion[]
}

export interface EsperaHorario {
  id: string
  claseId: string
  claseNombre: string
  profesorNombre: string
  aulaId: string
  aulaNombre: string
  dia: DiaSemana
  horaInicio: string
  horaFin: string
  createdAt: string
}

export interface Recordatorio {
  id: string
  horarioId: string
  minutosAntes: number
}

export interface HistorialSolicitud {
  id: string
  solicitudId: string
  estadoAnterior: EstadoSolicitud | null
  estadoNuevo: EstadoSolicitud
  actorNombre: string | null
  comentario: string | null
  createdAt: string
}

export interface Notificacion {
  id: string
  mensaje: string
  leida: boolean
  solicitudId: string | null
  createdAt: string
}

export interface AulaFrecuente {
  aulaId: string
  aulaNombre: string
  usos: number
}

export interface ConfiguracionReservas {
  anticipacionMinDias: number
  anticipacionMaxDias: number
  duracionMaximaMinutos: number
  maxReservasSimultaneasPorUsuario: number
}

export interface RegistroAuditoria {
  id: string
  actorNombre: string
  accion: string
  entidad: string
  entidadId: string
  detalle: string | null
  createdAt: string
}

export interface BloqueoFecha {
  id: string
  fechaInicio: string
  fechaFin: string
  aulaId: string | null
  aulaNombre: string | null
  motivo: string
  creadoPorNombre: string
  createdAt: string
}

export interface ApiKey {
  id: string
  nombre: string
  prefijo: string
  activa: boolean
  ultimoUsoAt: string | null
  createdAt: string
}

export interface Metricas {
  kpis: {
    tasaAprobacion: number | null
    tasaAsistencia: number | null
    aulaMasOcupada: { aula: string; horas: number } | null
    aulaMejorValorada: { aula: string; promedio: number; cantidad: number } | null
  }
  ocupacionPorAula: { aula: string; horas: number }[]
  horariosPorHora: { hora: string; cantidad: number }[]
  solicitudesEstado: { estado: EstadoSolicitud; cantidad: number }[]
  asistenciaSemanal: { semana: string; ingresos: number; ausencias: number }[]
  aulasValoracion: { aula: string; promedio: number; cantidad: number }[]
  aulasReportes: { aula: string; total: number }[]
}

export const DIAS_SEMANA: DiaSemana[] = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
]

export const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
}

export const TIPOS_ESPACIO: TipoEspacio[] = [
  "AULA",
  "LABORATORIO",
  "AUDITORIO",
  "SALA_REUNIONES",
  "ESPACIO_DEPORTIVO",
]

export const TIPO_ESPACIO_LABEL: Record<TipoEspacio, string> = {
  AULA: "Aula",
  LABORATORIO: "Laboratorio",
  AUDITORIO: "Auditorio",
  SALA_REUNIONES: "Sala de reuniones",
  ESPACIO_DEPORTIVO: "Espacio deportivo",
}

export const TIPOS_EQUIPAMIENTO: TipoEquipamiento[] = [
  "PROYECTOR",
  "PC",
  "PIZARRA_DIGITAL",
]

export const EQUIPAMIENTO_LABEL: Record<TipoEquipamiento, string> = {
  PROYECTOR: "Proyector",
  PC: "PC",
  PIZARRA_DIGITAL: "Pizarra digital",
}
