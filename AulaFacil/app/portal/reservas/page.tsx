import { redirect } from "next/navigation"

import { PortalReservas } from "@/components/portal-reservas"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function ReservasPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario || usuario.role !== "PROFESOR") redirect("/portal")

  return <PortalReservas />
}
