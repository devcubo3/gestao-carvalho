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
import { mockVinculos, mockCentrosCusto } from "@/lib/mock-data"

interface AccountFormData {
  vencimento: string
  vinculo: string
  centroCusto: string
  descricao: string
  numeroParcelas: number
  valorParcela: number
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onSubmit: (data: AccountFormData) => void
}

export function AccountFormDialog({ open, onOpenChange, title, description, onSubmit }: AccountFormDialogProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    vencimento: "",
    vinculo: "",
    centroCusto: "",
    descricao: "",
    numeroParcelas: 1,
    valorParcela: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      vencimento: "",
      vinculo: "",
      centroCusto: "",
      descricao: "",
      numeroParcelas: 1,
      valorParcela: 0,
    })
    onOpenChange(false)
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento *</Label>
              <Input
                id="vencimento"
                type="date"
                required
                value={formData.vencimento}
                onChange={(e) => handleChange("vencimento", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select value={formData.vinculo} onValueChange={(value) => handleChange("vinculo", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar vínculo" />
                </SelectTrigger>
                <SelectContent>
                  {mockVinculos.map((vinculo) => (
                    <SelectItem key={vinculo} value={vinculo}>
                      {vinculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="centro-custo">Centro de Custo *</Label>
            <Select value={formData.centroCusto} onValueChange={(value) => handleChange("centroCusto", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar centro de custo" />
              </SelectTrigger>
              <SelectContent>
                {mockCentrosCusto.map((centro) => (
                  <SelectItem key={centro} value={centro}>
                    {centro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva a conta..."
              required
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero-parcelas">Número de Parcelas *</Label>
              <Input
                id="numero-parcelas"
                type="number"
                min="1"
                required
                value={formData.numeroParcelas}
                onChange={(e) => handleChange("numeroParcelas", Number.parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-parcela">Valor da Parcela (R$) *</Label>
              <Input
                id="valor-parcela"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.valorParcela}
                onChange={(e) => handleChange("valorParcela", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
