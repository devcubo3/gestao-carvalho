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
import type { AccountReceivable, BankAccount } from "@/lib/types"
import { getBankAccounts } from "@/app/actions/cash"

interface PartialReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | null
  onSubmit: (data: { receivedAmount: number; receiveDate: string; paymentMethod: string; bankAccountId: string }) => void
  submitting?: boolean
}

export function PartialReceiveDialog({ open, onOpenChange, account, onSubmit, submitting = false }: PartialReceiveDialogProps) {
  const [receivedAmount, setReceivedAmount] = useState("")
  const [receiveDate, setReceiveDate] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [remainingAmount, setRemainingAmount] = useState(0)

  useEffect(() => {
    if (open) {
      loadBankAccounts()
      const today = new Date().toISOString().split('T')[0]
      setReceiveDate(today)
    }
  }, [open])

  useEffect(() => {
    if (account && receivedAmount) {
      const received = Number.parseFloat(receivedAmount) || 0
      setRemainingAmount(account.remaining_value - received)
    } else if (account) {
      setRemainingAmount(account.remaining_value)
    }
  }, [receivedAmount, account])

  const loadBankAccounts = async () => {
    const result = await getBankAccounts()
    if (result.success && result.data) {
      setBankAccounts(result.data.filter((acc: BankAccount) => acc.status === 'ativo'))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivedAmount || !receiveDate || !bankAccountId) return

    const received = Number.parseFloat(receivedAmount)
    if (received <= 0 || received > (account?.remaining_value || 0)) return

    onSubmit({
      receivedAmount: received,
      receiveDate,
      paymentMethod: 'Transferência',
      bankAccountId,
    })

    // Reset form
    setReceivedAmount("")
    setReceiveDate("")
    setBankAccountId("")
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
              <Label>Código</Label>
              <Input value={account.code} disabled className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição da conta</Label>
              <Input value={account.description} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Valor pendente atual</Label>
              <Input value={formatCurrency(account.remaining_value)} disabled className="font-bold" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receivedAmount">Valor a receber agora *</Label>
              <Input
                id="receivedAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={account.remaining_value}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor que restará pendente</Label>
              <Input 
                value={formatCurrency(remainingAmount)} 
                disabled 
                className={remainingAmount > 0 ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiveDate">Data de recebimento *</Label>
              <Input
                id="receiveDate"
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankAccount">Conta bancária *</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {formatCurrency(acc.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Processando..." : "Confirmar Recebimento Parcial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
