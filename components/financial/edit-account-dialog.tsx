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
import { Textarea } from "@/components/ui/textarea"
import type { AccountReceivable, AccountPayable } from "@/lib/types"

interface EditAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | AccountPayable | null
  onSubmit: (data: any) => void
}

export function EditAccountDialog({ open, onOpenChange, account, onSubmit }: EditAccountDialogProps) {
  const [dueDate, setDueDate] = useState("")
  const [installments, setInstallments] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [vinculo, setVinculo] = useState("")
  const [description, setDescription] = useState("")
  const [installmentValue, setInstallmentValue] = useState("")

  useEffect(() => {
    if (account) {
      setDueDate(account.dueDate)
      setInstallments("1") // Default value
      setCostCenter(account.centroCusto)
      setVinculo(account.vinculo)
      setDescription(account.description)
      setInstallmentValue(account.value.toString())
    }
  }, [account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dueDate || !installments || !costCenter || !vinculo || !description || !installmentValue) return

    onSubmit({
      dueDate,
      installments: Number.parseInt(installments),
      costCenter,
      vinculo,
      description,
      installmentValue: Number.parseFloat(installmentValue),
    })

    onOpenChange(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
          <DialogDescription>Edite as informações da conta selecionada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Data de vencimento</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installments">Número de parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costCenter">Centro de custo</Label>
              <Select value={costCenter} onValueChange={setCostCenter} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vinculo">Vínculo</Label>
              <Select value={vinculo} onValueChange={setVinculo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="Funcionário">Funcionário</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da conta"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installmentValue">Valor da parcela</Label>
              <Input
                id="installmentValue"
                type="number"
                step="0.01"
                min="0.01"
                value={installmentValue}
                onChange={(e) => setInstallmentValue(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
