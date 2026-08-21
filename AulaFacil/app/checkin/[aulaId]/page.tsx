import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2Icon, DoorOpenIcon, XCircleIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { ReportarAulaVaciaButton } from "@/components/reportar-aula-vacia-button"
import { bloqueoActivoHoy } from "@/lib/bloqueos"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
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

function Resultado({
  titulo,
  descripcion,
  ok,
  children,
}: {
  titulo: string
  descripcion: string
  ok: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          {ok ? (
            <CheckCircle2Icon className="size-12 text-emerald-500" />
          ) : (
            <XCircleIcon className="size-12 text-destructive" />
          )}
          <h1 className="text-xl font-bold">{titulo}</h1>
          <p className="text-muted-foreground">{descripcion}</p>
          {children}
          <Link
            href="/portal"
            className="mt-2 text-sm font-medium hover:underline"
          >
            Ir a mi portal
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ aulaId: string }>
}) {
  const { aulaId } = await params
  const session = await getSession()
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/checkin/${aulaId}`)}`)
  }

  const aula = await prisma.aula.findUnique({ where: { id: aulaId } })
  if (!aula) {
    return (
      <Resultado
        ok={false}
        titulo="Aula no encontrada"
        descripcion="Este código QR no corresponde a ningún aula registrada."
      />
    )
  }

  const motivoBloqueo = await bloqueoActivoHoy(aulaId)
  if (motivoBloqueo) {
    return (
      <Resultado
        ok={false}
        titulo={`${aula.nombre} — Bloqueada hoy`}
        descripcion={motivoBloqueo}
      />
    )
  }

  const dia = DIA_JS_A_DIASEMANA[new Date().getDay()]

  if (session.role === "PROFESOR" && dia) {
    const horarioDelProfesor = await prisma.horario.findFirst({
      where: { aulaId, dia, clase: { profesorId: session.userId } },
      include: { clase: { include: { materia: true } } },
    })

    if (horarioDelProfesor) {
      const hoy = new Date()
      const fecha = new Date(
        Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      )

      const existente = await prisma.ingreso.findUnique({
        where: { horarioId_fecha: { horarioId: horarioDelProfesor.id, fecha } },
      })

      if (!existente) {
        await prisma.ingreso.create({
          data: {
            horarioId: horarioDelProfesor.id,
            profesorId: session.userId,
            fecha,
          },
        })
      }

      return (
        <Resultado
          ok
          titulo={
            existente
              ? "Ya habías confirmado tu ingreso hoy"
              : "¡Ingreso confirmado!"
          }
          descripcion={`${horarioDelProfesor.clase.materia.nombre} en ${aula.nombre}, ${horarioDelProfesor.horaInicio}–${horarioDelProfesor.horaFin}.`}
        />
      )
    }
  }

  // Cualquier otro caso: mostrar quién tiene el aula ahora mismo (o si está libre)
  let horarioActual = null
  if (dia) {
    const minutosAhora = new Date().getHours() * 60 + new Date().getMinutes()
    const horariosDeHoy = await prisma.horario.findMany({
      where: { aulaId, dia },
      include: { clase: { include: { materia: true, profesor: true } } },
    })
    horarioActual =
      horariosDeHoy.find(
        (h) =>
          minutosDesdeMedianoche(h.horaInicio) <= minutosAhora &&
          minutosAhora < minutosDesdeMedianoche(h.horaFin)
      ) ?? null
  }

  if (horarioActual) {
    return (
      <Resultado
        ok={false}
        titulo={`${aula.nombre} — Ocupada ahora`}
        descripcion={`${horarioActual.clase.materia.nombre} — ${horarioActual.clase.profesor.nombre}, hasta las ${horarioActual.horaFin}.`}
      >
        <ReportarAulaVaciaButton aulaId={aula.id} />
      </Resultado>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <DoorOpenIcon className="size-12 text-emerald-500" />
          <h1 className="text-xl font-bold">
            {aula.nombre} — Libre en este momento
          </h1>
          <p className="text-muted-foreground">
            No hay ninguna clase programada ahora mismo en esta aula.
          </p>
          <Link
            href="/portal"
            className="mt-2 text-sm font-medium hover:underline"
          >
            Ir a mi portal
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
