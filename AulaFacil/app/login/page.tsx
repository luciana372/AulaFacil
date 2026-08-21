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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import type { Role, Usuario } from "@/lib/types"

function redirectPathFor(role: Role) {
  return role === "ADMIN" ? "/dashboard" : "/portal"
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [rol, setRol] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const usuario = await api.post<Usuario>("/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      })
      router.push(next || redirectPathFor(usuario.role))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!rol) {
      toast.error("Elegí tu rol.")
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error("Las contraseñas no coinciden.")
      return
    }
    setLoading(true)
    try {
      const usuario = await api.post<Usuario>("/api/auth/register", {
        nombre,
        email: registerEmail,
        password: registerPassword,
        role: rol,
      })
      router.push(next || redirectPathFor(usuario.role))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la cuenta.")
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
          <h1 className="text-2xl font-bold">AulaFácil</h1>
          <p className="text-muted-foreground">
            Sistema de reserva de aulas para tu institución
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form className="grid gap-4" onSubmit={handleLogin}>
                <div className="grid gap-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="docente@institucion.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form className="grid gap-4" onSubmit={handleRegister}>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-nombre">Nombre completo</Label>
                  <Input
                    id="register-nombre"
                    placeholder="Marcela Ríos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="docente@institucion.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Soy</Label>
                  <Select
                    value={rol}
                    onValueChange={(v) => setRol(v ?? "")}
                    items={{ PROFESOR: "Profesor", ALUMNO: "Alumno" }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí tu rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESOR">Profesor</SelectItem>
                      <SelectItem value="ALUMNO">Alumno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver al inicio
      </Link>
    </div>
  )
}
