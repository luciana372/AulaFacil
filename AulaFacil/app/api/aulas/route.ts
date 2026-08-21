import { NextResponse } from "next/server"
import { z } from "zod"

import { registrarAuditoria } from "@/lib/auditoria"
import { requireRole } from "@/lib/auth-guard"
import { bloqueosActivosHoyPorAula } from "@/lib/bloqueos"
import { prisma } from "@/lib/prisma"
import { TipoEquipamiento, TipoEspacio } from "@/lib/generated/prisma/enums"
import type { DiaSemana } from "@/lib/types"

// JS Date.getDay(): 0=domingo..6=sábado. Nuestro enum no tiene domingo.
const DIA_JS_A_DIASEMANA: Record<number, DiaSemana | null> = {
  0: null,
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export async function GET() {
  const guard = await requireRole("ADMIN", "PROFESOR", "ALUMNO")
  if (guard.error) return guard.error

  const ahora = new Date()
  const diaHoy = DIA_JS_A_DIASEMANA[ahora.getDay()]
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  const [aulas, favoritos, valoraciones, reportesPendientes, horariosDeHoy] =
    await Promise.all([
      prisma.aula.findMany({
        where:
          guard.session.role !== "ADMIN" ? { habilitada: true } : undefined,
        include: { sede: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.favorito.findMany({ where: { usuarioId: guard.session.userId } }),
      prisma.valoracion.groupBy({
        by: ["aulaId"],
        _avg: { puntaje: true },
        _count: { puntaje: true },
      }),
      prisma.reporteAula.groupBy({
        by: ["aulaId"],
        where: { estado: "PENDIENTE" },
        _count: { id: true },
      }),
      diaHoy
        ? prisma.horario.findMany({ where: { dia: diaHoy } })
        : Promise.resolve([]),
    ])

  const favoritoSet = new Set(favoritos.map((f) => f.aulaId))
  const valoracionMap = new Map(valoraciones.map((v) => [v.aulaId, v]))
  const reportesMap = new Map(
    reportesPendientes.map((r) => [r.aulaId, r._count.id])
  )
  const ocupadasAhora = new Set(
    horariosDeHoy
      .filter(
        (h) =>
          minutosDesdeMedianoche(h.horaInicio) <= minutosAhora &&
          minutosAhora < minutosDesdeMedianoche(h.horaFin)
      )
      .map((h) => h.aulaId)
  )
  const bloqueosMap = await bloqueosActivosHoyPorAula(aulas.map((a) => a.id))

  const shaped = aulas.map(({ sede, ...a }) => ({
    ...a,
    sedeNombre: sede?.nombre ?? null,
    favorito: favoritoSet.has(a.id),
    valoracionPromedio: valoracionMap.get(a.id)?._avg.puntaje ?? null,
    valoracionCount: valoracionMap.get(a.id)?._count.puntaje ?? 0,
    reportesPendientes: reportesMap.get(a.id) ?? 0,
    disponibleAhora:
      a.habilitada && !ocupadasAhora.has(a.id) && !bloqueosMap.has(a.id),
    bloqueoActivo: bloqueosMap.get(a.id) ?? null,
  }))

  return NextResponse.json(shaped)
}

const createAulaSchema = z.object({
  nombre: z.string().trim().min(1),
  capacidad: z.number().int().positive(),
  ubicacion: z.string().trim().min(1).nullable().optional(),
  tipo: z.enum(TipoEspacio).optional(),
  equipamiento: z.array(z.enum(TipoEquipamiento)).optional(),
  requiereAprobacion: z.boolean().optional(),
  sedeId: z.string().min(1).nullable().optional(),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = createAulaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  if (parsed.data.sedeId) {
    const sede = await prisma.sede.findUnique({
      where: { id: parsed.data.sedeId },
    })
    if (!sede) {
      return NextResponse.json({ error: "Sede inválida." }, { status: 400 })
    }
  }

  try {
    const aula = await prisma.aula.create({
      data: {
        nombre: parsed.data.nombre,
        capacidad: parsed.data.capacidad,
        ubicacion: parsed.data.ubicacion ?? null,
        tipo: parsed.data.tipo ?? "AULA",
        equipamiento: parsed.data.equipamiento ?? [],
        requiereAprobacion: parsed.data.requiereAprobacion ?? true,
        sedeId: parsed.data.sedeId ?? null,
        habilitada: false,
      },
    })
    await registrarAuditoria({
      actorId: guard.session.userId,
      accion: "AULA_CREADA",
      entidad: "Aula",
      entidadId: aula.id,
      detalle: aula.nombre,
    })
    return NextResponse.json(aula, { status: 201 })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un aula con ese nombre." },
        { status: 409 }
      )
    }
    throw err
  }
}
