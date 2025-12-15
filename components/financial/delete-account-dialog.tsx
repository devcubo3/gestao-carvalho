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
import { AlertTriangle, Trash2 } from "lucide-react"
import type { AccountReceivable, AccountPayable } from "@/lib/types"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | AccountPayable | null
  onConfirm: () => void
  submitting?: boolean
}

export function DeleteAccountDialog({ open, onOpenChange, account, onConfirm, submitting = false }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText.toLowerCase() !== "excluir" || submitting) return

    onConfirm()
  }

  const isValid = confirmText.toLowerCase() === "excluir" && !submitting
  
  // Resetar o campo quando o dialog fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !submitting) {
      setConfirmText("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Conta Permanentemente
          </DialogTitle>
          <DialogDescription className="text-destructive">⚠️ Esta ação NÃO pode ser desfeita! Os dados serão removidos permanentemente do banco de dados.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive mb-3">Você está prestes a excluir PERMANENTEMENTE:</p>
              <div className="space-y-1 bg-background/50 p-3 rounded">
                <p className="font-medium">{account?.description}</p>
                <p className="text-sm text-muted-foreground">Código: {account?.code}</p>
              </div>
              <p className="text-xs text-destructive/80 mt-3">⚠️ Todos os dados relacionados serão removidos permanentemente</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmText" className="text-sm">
                Para confirmar a <strong className="text-destructive">exclusão permanente</strong>, digite <strong>excluir</strong> abaixo:
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite 'excluir' para confirmar"
                className="border-destructive focus-visible:ring-destructive"
                required
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!isValid || submitting}>
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
