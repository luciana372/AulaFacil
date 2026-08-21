import "server-only"

function escaparCampo(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor)
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export function generarCSV(headers: string[], filas: unknown[][]): string {
  const lineas = [headers, ...filas].map((fila) =>
    fila.map(escaparCampo).join(",")
  )
  return lineas.join("\r\n")
}

export function respuestaCSV(
  nombreArchivo: string,
  contenido: string
): Response {
  return new Response(`﻿${contenido}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  })
}
