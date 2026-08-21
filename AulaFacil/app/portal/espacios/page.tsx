import { redirect } from "next/navigation"
import { Suspense } from "react"

import { PortalEspacios } from "@/components/portal-espacios"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function EspaciosPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario || (usuario.role !== "PROFESOR" && usuario.role !== "ALUMNO")) redirect("/portal")

  return (
    <Suspense>
      <PortalEspacios />
    </Suspense>
  )
}
