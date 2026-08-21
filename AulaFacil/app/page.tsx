import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  ClockIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Sin doble reserva",
    description:
      "Validación automática a nivel de base de datos. Es imposible que dos personas reserven el mismo aula al mismo tiempo.",
  },
  {
    icon: ZapIcon,
    title: "En tiempo real",
    description:
      "Los cambios se reflejan al instante. Cada usuario ve siempre la información más actualizada.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Aprobación administrativa",
    description:
      "El admin aprueba o rechaza reservas según las políticas de tu institución.",
  },
  {
    icon: UsersIcon,
    title: "Roles y permisos",
    description: "Administradores y docentes tienen interfaces y capacidades diferenciadas.",
  },
  {
    icon: ClockIcon,
    title: "Horarios institucionales",
    description: "Define el rango horario permitido. Por defecto, de 08:00 a 22:00.",
  },
  {
    icon: GraduationCapIcon,
    title: "Pensado para educación",
    description:
      "Diseñado en torno a las necesidades reales de escuelas, institutos y universidades.",
  },
]

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCapIcon className="size-5" />
          </div>
          <span className="text-lg font-semibold">AulaFacil</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button nativeButton={false} render={<Link href="/login" />}>
            Entrar
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center lg:py-24">
        <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal">
          Para escuelas, institutos y universidades
        </Badge>

        <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Reserva aulas <span className="text-primary">sin conflictos</span>,
          en segundos.
        </h1>

        <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Centraliza la gestión de espacios de tu institución. Adiós a los
          cuadernos, las hojas de cálculo y las llamadas para preguntar &ldquo;¿está
          libre?&rdquo;.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
            Empezar ahora
            <ArrowRightIcon />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<a href="#features" />}>
            Ver demo
          </Button>
        </div>

        <div id="features" className="mt-16 grid w-full max-w-5xl scroll-mt-20 gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="text-left">
              <CardContent className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
