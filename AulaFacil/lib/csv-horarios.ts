import "server-only"

import { COLUMNAS_CSV } from "@/lib/csv-horarios-cliente"
import { intentarCrearHorario } from "@/lib/horarios"
import { prisma } from "@/lib/prisma"
import { DiaSemana } from "@/lib/generated/prisma/enums"
import type { ResultadoImportacion } from "@/lib/types"

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

function parseCSV(texto: string): string[][] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(",").map((c) => c.trim()))
}

export async function importarHorariosCSV(texto: string): Promise<ResultadoImportacion> {
  const filas = parseCSV(texto)
  if (filas.length === 0) {
    return { total: 0, creados: 0, filas: [] }
  }

  // La primera fila es el encabezado si coincide con las columnas esperadas; si no, se procesa como dato.
  const primeraEsHeader = COLUMNAS_CSV.every(
    (col, i) => filas[0][i]?.toLowerCase() === col.toLowerCase()
  )
  const datos = primeraEsHeader ? filas.slice(1) : filas

  const resultado: ResultadoImportacion = { total: datos.length, creados: 0, filas: [] }
  // Cache para no re-crear la misma Clase en filas sucesivas del mismo import (p.ej. Martes y Jueves)
  const claseCache = new Map<string, string>()

  for (let i = 0; i < datos.length; i++) {
    const numeroFila = i + 1
    const [materiaNombre, profesorEmail, carreraNombre, aulaNombre, diaRaw, horaInicio, horaFin] =
      datos[i]

    if (!materiaNombre || !profesorEmail || !carreraNombre || !aulaNombre || !diaRaw || !horaInicio || !horaFin) {
      resultado.filas.push({ fila: numeroFila, ok: false, motivo: "faltan columnas." })
      continue
    }

    const dia = diaRaw.toUpperCase() as DiaSemana
    if (!Object.values(DiaSemana).includes(dia)) {
      resultado.filas.push({
        fila: numeroFila,
        ok: false,
        motivo: `día inválido "${diaRaw}" (usar LUNES..SABADO).`,
      })
      continue
    }
    if (!TIME_REGEX.test(horaInicio) || !TIME_REGEX.test(horaFin) || horaInicio >= horaFin) {
      resultado.filas.push({ fila: numeroFila, ok: false, motivo: "horario inválido." })
      continue
    }

    const [profesor, carrera, aula] = await Promise.all([
      prisma.usuario.findUnique({ where: { email: profesorEmail } }),
      prisma.carrera.findUnique({ where: { nombre: carreraNombre } }),
      prisma.aula.findUnique({ where: { nombre: aulaNombre } }),
    ])
    if (!profesor || profesor.role !== "PROFESOR") {
      resultado.filas.push({
        fila: numeroFila,
        ok: false,
        motivo: `no existe un profesor con email "${profesorEmail}".`,
      })
      continue
    }
    if (!carrera) {
      resultado.filas.push({
        fila: numeroFila,
        ok: false,
        motivo: `no existe la carrera "${carreraNombre}".`,
      })
      continue
    }
    if (!aula || !aula.habilitada) {
      resultado.filas.push({
        fila: numeroFila,
        ok: false,
        motivo: `no existe el aula "${aulaNombre}" o no está habilitada.`,
      })
      continue
    }

    const materia = await prisma.materia.upsert({
      where: { nombre: materiaNombre },
      update: {},
      create: { nombre: materiaNombre },
    })

    const claveClase = `${materia.id}:${profesor.id}:${carrera.id}`
    let claseId = claseCache.get(claveClase)
    if (!claseId) {
      const claseExistente = await prisma.clase.findFirst({
        where: { materiaId: materia.id, profesorId: profesor.id, carreraId: carrera.id },
      })
      claseId =
        claseExistente?.id ??
        (
          await prisma.clase.create({
            data: { materiaId: materia.id, profesorId: profesor.id, carreraId: carrera.id },
          })
        ).id
      claseCache.set(claveClase, claseId)
    }

    const creado = await intentarCrearHorario({
      claseId,
      aulaId: aula.id,
      dia,
      horaInicio,
      horaFin,
      origen: "OFICIAL",
    })
    if (creado.ok) {
      resultado.creados++
      resultado.filas.push({ fila: numeroFila, ok: true })
    } else {
      resultado.filas.push({ fila: numeroFila, ok: false, motivo: creado.motivo })
    }
  }

  return resultado
}
