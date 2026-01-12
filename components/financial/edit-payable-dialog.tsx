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
import { useCategories } from "@/hooks/use-categories"
import type { AccountPayable } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface EditPayableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountPayable | null
  onSubmit: (data: { description: string; due_date: string; vinculo: string; centro_custo: string }) => void
  submitting?: boolean
}

export function EditPayableDialog({ open, onOpenChange, account, onSubmit, submitting = false }: EditPayableDialogProps) {
  const { categories: vinculos } = useCategories('vinculo')
  const { categories: centrosCusto } = useCategories('centro_custo')
  
  const [formData, setFormData] = useState({
    description: "",
    due_date: "",
    vinculo: "",
    centro_custo: "",
  })

  useEffect(() => {
    if (account) {
      const dateStr = typeof account.due_date === 'string' 
        ? account.due_date.split('T')[0] 
        : new Date(account.due_date).toISOString().split('T')[0]

      setFormData({
        description: account.description || "",
        due_date: dateStr,
        vinculo: account.vinculo || "",
        centro_custo: account.centro_custo || "",
      })
    }
  }, [account])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!account) return null

  const installmentInfo = account.installment_total && account.installment_total > 1
    ? `${account.installment_total}par de ${formatCurrency(account.installment_value || 0)}`
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
          <DialogDescription>
            Edite as informações da conta. Apenas descrição, vencimento e categorias podem ser alterados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={account.code} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Valor Original</Label>
              <Input value={formatCurrency(account.original_value)} disabled className="bg-muted" />
            </div>
          </div>

          {installmentInfo && (
            <div className="space-y-2">
              <Label>Parcelamento</Label>
              <Input value={installmentInfo} disabled className="bg-muted" />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Digite a descrição da conta"
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select 
                value={formData.vinculo} 
                onValueChange={(value) => handleChange("vinculo", value)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar vínculo" />
                </SelectTrigger>
                <SelectContent>
                  {vinculos.map((vinculo) => (
                    <SelectItem key={vinculo.id} value={vinculo.name}>
                      {vinculo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="centro_custo">Centro de Custo *</Label>
              <Select 
                value={formData.centro_custo} 
                onValueChange={(value) => handleChange("centro_custo", value)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {centrosCusto.map((centro) => (
                    <SelectItem key={centro.id} value={centro.name}>
                      {centro.name}
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
              {submitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
