"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { mockPeople, mockCompanies } from "@/lib/mock-data"

interface CreditCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreditCreateModal({ open, onOpenChange, onSuccess }: CreditCreateModalProps) {
  const [formData, setFormData] = React.useState({
    cedente: "",
    descricao: "",
    valor: "",
    codigo: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  const cedenteOptions = [
    ...mockPeople.map((person) => ({ value: person.id, label: person.name, type: "Pessoa" })),
    ...mockCompanies.map((company) => ({ value: company.id, label: company.name, type: "Empresa" })),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cedente || !formData.descricao || !formData.valor || !formData.codigo) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simular criação
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const cedenteLabel = cedenteOptions.find((opt) => opt.value === formData.cedente)?.label
    toast({
      title: "Crédito criado com sucesso!",
      description: `Crédito "${formData.descricao}" com cedente "${cedenteLabel}" foi adicionado ao patrimônio.`,
    })

    setIsLoading(false)
    onOpenChange(false)
    onSuccess?.()

    setFormData({
      cedente: "",
      descricao: "",
      valor: "",
      codigo: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Crédito</DialogTitle>
          <DialogDescription>Adicione um novo crédito ao patrimônio da empresa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cedente">Cedente *</Label>
              <Select value={formData.cedente} onValueChange={(value) => handleInputChange("cedente", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cedente" />
                </SelectTrigger>
                <SelectContent>
                  {cedenteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">({option.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                type="text"
                placeholder="Ex: Empréstimo para capital de giro"
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Ex: 50000"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Ex: CRD-001"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
