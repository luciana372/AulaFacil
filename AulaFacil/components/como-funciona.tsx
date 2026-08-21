const PASOS = [
  {
    numero: "01",
    titulo: "Elegí tu clase",
    descripcion: "Seleccioná para qué clase necesitás un aula.",
  },
  {
    numero: "02",
    titulo: "Enviá tu solicitud",
    descripcion: "Contanos qué necesitás: capacidad, equipamiento, horario.",
  },
  {
    numero: "03",
    titulo: "La administración confirma",
    descripcion: "Te asigna un aula disponible y te avisamos apenas se resuelve.",
  },
]

export function ComoFunciona() {
  return (
    <div className="rounded-xl bg-muted/40 px-6 py-10 text-center">
      <h2 className="text-2xl font-bold">¿Cómo funciona?</h2>
      <div className="mx-auto mt-8 grid max-w-3xl gap-8 sm:grid-cols-3">
        {PASOS.map((paso) => (
          <div key={paso.numero} className="flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
              <span className="text-sm font-bold">{paso.numero}</span>
            </div>
            <h3 className="font-semibold">{paso.titulo}</h3>
            <p className="text-sm text-muted-foreground">{paso.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
