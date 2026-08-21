import type { DiaSemana, Horario } from "@/lib/types"

const DIA_A_BYDAY: Record<DiaSemana, string> = {
  LUNES: "MO",
  MARTES: "TU",
  MIERCOLES: "WE",
  JUEVES: "TH",
  VIERNES: "FR",
  SABADO: "SA",
}

// Date.getDay(): 0=domingo..6=sábado
const DIA_A_JS_DAY: Record<DiaSemana, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
}

function proximaFecha(diaSemanaJs: number): Date {
  const hoy = new Date()
  const diff = (diaSemanaJs - hoy.getDay() + 7) % 7
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diff)
  return fecha
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function formatFechaHora(fecha: Date, hora: string) {
  const [h, m] = hora.split(":").map(Number)
  return `${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}T${pad(h)}${pad(m)}00`
}

function escapeTexto(texto: string) {
  return texto.replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n")
}

export function generarICS(horarios: Horario[], nombreCalendario = "AulaFacil"): string {
  const ahora = new Date()
  const stamp = `${ahora.getUTCFullYear()}${pad(ahora.getUTCMonth() + 1)}${pad(ahora.getUTCDate())}T${pad(ahora.getUTCHours())}${pad(ahora.getUTCMinutes())}${pad(ahora.getUTCSeconds())}Z`

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AulaFacil//Horarios//ES",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeTexto(nombreCalendario)}`,
  ]

  for (const h of horarios) {
    const fecha = proximaFecha(DIA_A_JS_DAY[h.dia])
    lineas.push(
      "BEGIN:VEVENT",
      `UID:${h.id}@aulafacil`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatFechaHora(fecha, h.horaInicio)}`,
      `DTEND:${formatFechaHora(fecha, h.horaFin)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${DIA_A_BYDAY[h.dia]}`,
      `SUMMARY:${escapeTexto(h.claseNombre)}`,
      `LOCATION:${escapeTexto(h.aulaNombre)}`,
      "END:VEVENT"
    )
  }

  lineas.push("END:VCALENDAR")
  return lineas.join("\r\n")
}

export function descargarICS(horarios: Horario[], nombreArchivo = "aulafacil-horarios.ics") {
  const contenido = generarICS(horarios)
  const blob = new Blob([contenido], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
