import { redirect } from "next/navigation"

import { PortalInicio } from "@/components/portal-inicio"
import { PortalInicioAlumno } from "@/components/portal-inicio-alumno"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function PortalPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario) redirect("/login")

  if (usuario.role === "PROFESOR") return <PortalInicio />
  if (usuario.role === "ALUMNO") return <PortalInicioAlumno />

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-muted-foreground">Tu vista todavía está en construcción.</p>
    </main>
  )
}
