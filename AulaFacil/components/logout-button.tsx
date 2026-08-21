"use client"

import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    await api.post("/api/auth/logout", {})
    router.push("/login")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleLogout}>
      <LogOutIcon />
      Cerrar sesión
    </Button>
  )
}
