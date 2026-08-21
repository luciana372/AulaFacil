import "server-only"

import { prisma } from "@/lib/prisma"

export async function getConfiguracion() {
  return prisma.configuracionReservas.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  })
}
