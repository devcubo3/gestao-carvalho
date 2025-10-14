"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface PartialReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | null
  onSubmit: (data: { receivedAmount: number; receiveDate: string; paymentMethod: string }) => void
}

export function PartialReceiveDialog({ open, onOpenChange, account, onSubmit }: PartialReceiveDialogProps) {
  const [receivedAmount, setReceivedAmount] = useState("")
  const [receiveDate, setReceiveDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [remainingAmount, setRemainingAmount] = useState(0)

  useEffect(() => {
    if (account && receivedAmount) {
      const received = Number.parseFloat(receivedAmount) || 0
      setRemainingAmount(account.value - received)
    } else if (account) {
      setRemainingAmount(account.value)
    }
  }, [receivedAmount, account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivedAmount || !receiveDate || !paymentMethod) return

    const received = Number.parseFloat(receivedAmount)
    if (received <= 0 || received > (account?.value || 0)) return

    onSubmit({
      receivedAmount: received,
      receiveDate,
      paymentMethod,
    })

    // Reset form
    setReceivedAmount("")
    setReceiveDate("")
    setPaymentMethod("")
    onOpenChange(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receber Parcial</DialogTitle>
          <DialogDescription>Registre um recebimento parcial da conta selecionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição da conta</Label>
              <Input value={account.description} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Valor total da conta</Label>
              <Input value={formatCurrency(account.value)} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receivedAmount">Valor recebido</Label>
              <Input
                id="receivedAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={account.value}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor restante</Label>
              <Input value={formatCurrency(remainingAmount)} disabled />
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
            <Button type="submit">Confirmar Recebimento Parcial</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
