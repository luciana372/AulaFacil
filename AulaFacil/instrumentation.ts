const globalForScheduler = globalThis as unknown as {
  recordatoriosInterval: NodeJS.Timeout | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (globalForScheduler.recordatoriosInterval) return

  const { revisarRecordatorios } = await import("@/lib/recordatorios-scheduler")
  const { revisarAusencias } = await import("@/lib/ausencias-scheduler")

  globalForScheduler.recordatoriosInterval = setInterval(() => {
    revisarRecordatorios().catch((err) => {
      console.error("[recordatorios-scheduler]", err)
    })
    revisarAusencias().catch((err) => {
      console.error("[ausencias-scheduler]", err)
    })
  }, 60_000)
}
