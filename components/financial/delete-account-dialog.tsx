"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import type { AccountReceivable, AccountPayable } from "@/lib/types"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | AccountPayable | null
  onConfirm: () => void
}

export function DeleteAccountDialog({ open, onOpenChange, account, onConfirm }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText.toLowerCase() !== "excluir") return

    onConfirm()
    setConfirmText("")
    onOpenChange(false)
  }

  const isValid = confirmText.toLowerCase() === "excluir"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Conta
          </DialogTitle>
          <DialogDescription>Essa é uma ação irreversível.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground mb-2">Você está prestes a excluir a conta:</p>
              <p className="font-medium">{account?.description}</p>
              <p className="text-sm text-muted-foreground">Código: {account?.code}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmText">
                Para confirmar, digite <strong>excluir</strong> no campo abaixo:
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite 'excluir' para confirmar"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!isValid}>
              Excluir Conta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
