import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-guard"
import { importarHorariosCSV } from "@/lib/csv-horarios"

const importarSchema = z.object({
  csv: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const guard = await requireRole("ADMIN")
  if (guard.error) return guard.error

  const body = await request.json()
  const parsed = importarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const resultado = await importarHorariosCSV(parsed.data.csv)
  return NextResponse.json(resultado)
}
