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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import type { AccountReceivable } from "@/lib/types"

interface ReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | null
  onSubmit: (data: { receiveDate: string; paymentMethod: string }) => void
}

export function ReceiveDialog({ open, onOpenChange, account, onSubmit }: ReceiveDialogProps) {
  const [receiveDate, setReceiveDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiveDate || !paymentMethod) return

    onSubmit({
      receiveDate,
      paymentMethod,
    })

    // Reset form
    setReceiveDate("")
    setPaymentMethod("")
    onOpenChange(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receber</DialogTitle>
          <DialogDescription>Registre o recebimento da conta selecionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição da conta</Label>
              <Input value={account.description} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Valor total</Label>
              <Input value={formatCurrency(account.value)} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiveDate">Data de recebimento</Label>
              <Input
                id="receiveDate"
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Forma de recebimento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco-brasil">Banco do Brasil - CC 12345-6</SelectItem>
                  <SelectItem value="itau">Itaú - CC 98765-4</SelectItem>
                  <SelectItem value="santander">Santander - CC 55555-1</SelectItem>
                  <SelectItem value="caixa">Caixa Econômica - CC 77777-8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Recebimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
