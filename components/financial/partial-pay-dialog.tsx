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
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import type { AccountPayable } from "@/lib/types"

interface PartialPayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountPayable | null
  onSubmit: (data: { paidAmount: number; paymentDate: string; paymentMethod: string; creditCard?: string }) => void
}

export function PartialPayDialog({ open, onOpenChange, account, onSubmit }: PartialPayDialogProps) {
  const [paidAmount, setPaidAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [useCreditCard, setUseCreditCard] = useState(false)
  const [creditCard, setCreditCard] = useState("")
  const [remainingAmount, setRemainingAmount] = useState(0)

  useEffect(() => {
    if (account && paidAmount) {
      const paid = Number.parseFloat(paidAmount) || 0
      setRemainingAmount(account.remaining_value - paid)
    } else if (account) {
      setRemainingAmount(account.remaining_value)
    }
  }, [paidAmount, account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paidAmount || !paymentDate || !paymentMethod) return
    if (useCreditCard && !creditCard) return

    const paid = Number.parseFloat(paidAmount)
    if (paid <= 0 || paid > (account?.remaining_value || 0)) return

    onSubmit({
      paidAmount: paid,
      paymentDate,
      paymentMethod,
      ...(useCreditCard && { creditCard }),
    })

    // Reset form
    setPaidAmount("")
    setPaymentDate("")
    setPaymentMethod("")
    setUseCreditCard(false)
    setCreditCard("")
    onOpenChange(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagamento Parcial</DialogTitle>
          <DialogDescription>Registre um pagamento parcial da conta selecionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição da conta</Label>
              <Input value={account.description} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Valor total da conta</Label>
              <Input value={formatCurrency(account.remaining_value)} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paidAmount">Valor pago</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={account.remaining_value}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor restante</Label>
              <Input value={formatCurrency(remainingAmount)} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentDate">Data de pagamento</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox id="creditCard" checked={useCreditCard} onCheckedChange={setUseCreditCard} />
              <Label htmlFor="creditCard">Cartão de crédito</Label>
            </div>
            {useCreditCard && (
              <div className="grid gap-2">
                <Label htmlFor="creditCardSelect">Selecione o cartão</Label>
                <Select value={creditCard} onValueChange={setCreditCard} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão de crédito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa-1234">Visa **** 1234</SelectItem>
                    <SelectItem value="master-5678">Mastercard **** 5678</SelectItem>
                    <SelectItem value="elo-9012">Elo **** 9012</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Pagamento Parcial</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
