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
import { Textarea } from "@/components/ui/textarea"
import { useCategories } from "@/hooks/use-categories"
import { formatCurrency } from "@/lib/utils"

interface AccountFormData {
  description: string
  installment_value: number
  due_date: string
  vinculo: string
  centro_custo: string
  installment_total: number
  periodicity: 'semanal' | 'mensal' | 'semestral' | 'anual'
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onSubmit: (data: AccountFormData) => void
  submitting?: boolean
}

export function AccountFormDialog({ open, onOpenChange, title, description, onSubmit, submitting = false }: AccountFormDialogProps) {
  const { categories: vinculos } = useCategories('vinculo')
  const { categories: centrosCusto } = useCategories('centro_custo')
  const [formData, setFormData] = useState<AccountFormData>({
    description: "",
    installment_value: 0,
    due_date: "",
    vinculo: "",
    centro_custo: "",
    installment_total: 1,
    periodicity: "mensal",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    
    // Reset form
    setFormData({
      description: "",
      installment_value: 0,
      due_date: "",
      vinculo: "",
      centro_custo: "",
      installment_total: 1,
      periodicity: "mensal",
    })
  }

  const handleChange = (key: keyof AccountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Ex: Fornecimento de Material de Construção"
              required
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
            />
          </div>

          {/* Vencimento */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Vencimento da 1ª Parcela *</Label>
            <Input
              id="due_date"
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
            />
          </div>

          {/* Vínculo e Centro de Custo */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Número de Parcelas e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installment_total">Número de Parcelas *</Label>
              <Input
                id="installment_total"
                type="number"
                min="1"
                required
                value={formData.installment_total || 1}
                onChange={(e) => handleChange("installment_total", parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment_value">Valor da Parcela (R$) *</Label>
              <Input
                id="installment_value"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.installment_value || ""}
                onChange={(e) => handleChange("installment_value", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Periodicidade - Mostrar apenas quando houver mais de 1 parcela */}
          {formData.installment_total > 1 && (
            <div className="space-y-2">
              <Label htmlFor="periodicity">Periodicidade *</Label>
              <Select 
                value={formData.periodicity} 
                onValueChange={(value) => handleChange("periodicity", value as 'semanal' | 'mensal' | 'anual')} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Exibir Valor Total Calculado */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-semibold">
                {formatCurrency((formData.installment_total || 1) * (formData.installment_value || 0))}
              </span>
            </div>
            {formData.installment_total > 1 && (
              <p className="text-xs text-muted-foreground">
                {formData.installment_total} parcelas de {formatCurrency(formData.installment_value || 0)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
