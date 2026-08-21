"use client"

import { useState } from "react"
import { KeyRoundIcon } from "lucide-react"

import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { Button } from "@/components/ui/button"

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <KeyRoundIcon />
        Cambiar contraseña
      </Button>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
