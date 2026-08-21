"use client"

import { useState } from "react"
import Link from "next/link"
import { GraduationCapIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<{ message: string }>("/api/auth/forgot-password", {
        email,
      })
      setEnviado(true)
      toast.success(res.message)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo procesar el pedido."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCapIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
          <p className="text-muted-foreground">
            Te enviamos un link para elegir una nueva
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardContent>
          {enviado ? (
            <p className="text-center text-sm text-muted-foreground">
              Si ese email está registrado, revisá tu bandeja de entrada (y la
              carpeta de spam) para continuar.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="docente@institucion.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperación"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a iniciar sesión
      </Link>
    </div>
  )
}
