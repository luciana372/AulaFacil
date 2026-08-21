import { redirect } from "next/navigation"

import { PortalShell } from "@/components/portal-shell"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const usuario = await prisma.usuario.findUnique({ where: { id: session.userId } })
  if (!usuario) redirect("/login")

  if (usuario.role === "PROFESOR" || usuario.role === "ALUMNO") {
    return (
      <PortalShell role={usuario.role} nombre={usuario.nombre} email={usuario.email}>
        {children}
      </PortalShell>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-muted-foreground">Tu vista todavía está en construcción.</p>
    </main>
  )
}
