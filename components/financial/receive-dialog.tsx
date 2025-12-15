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

interface ReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | null
  onSubmit: (data: { receiveDate: string; paymentMethod: string; bankAccountId: string }) => void
  submitting?: boolean
}

export function ReceiveDialog({ open, onOpenChange, account, onSubmit, submitting = false }: ReceiveDialogProps) {
  const [receiveDate, setReceiveDate] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  useEffect(() => {    if (open) {
      loadBankAccounts()
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0]
      setReceiveDate(today)
    }
  }, [open])

  const loadBankAccounts = async () => {
    const result = await getBankAccounts()
    if (result.success && result.data) {
      setBankAccounts(result.data.filter((acc: BankAccount) => acc.status === 'ativo'))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiveDate || !bankAccountId) return

    onSubmit({
      receiveDate,
      paymentMethod: 'Transferência',
      bankAccountId,
    })

    // Reset form
    setReceiveDate("")
    setBankAccountId("")
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
              <Label>Código</Label>
              <Input value={account.code} disabled className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição da conta</Label>
              <Input value={account.description} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Valor a receber</Label>
              <Input value={formatCurrency(account.remaining_value)} disabled className="font-bold text-green-600" />
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
              {submitting ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
