import { redirect } from "next/navigation"

import { PortalCalendario } from "@/components/portal-calendario"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function CalendarioPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario || (usuario.role !== "PROFESOR" && usuario.role !== "ALUMNO")) redirect("/portal")

  return <PortalCalendario />
}
