"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCapIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  )
}

function ResetPasswordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.")
      return
    }
    if (!token) {
      toast.error("Falta el token de recuperación.")
      return
    }
    setLoading(true)
    try {
      await api.post("/api/auth/reset-password", { token, password })
      toast.success("Contraseña actualizada. Ya podés iniciar sesión.")
      router.push("/login")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar la contraseña."
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
          <h1 className="text-2xl font-bold">Elegí tu nueva contraseña</h1>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardContent>
          {!token ? (
            <p className="text-center text-sm text-muted-foreground">
              Este link no es válido. Pedí uno nuevo desde{" "}
              <Link href="/forgot-password" className="underline">
                recuperar contraseña
              </Link>
              .
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
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
