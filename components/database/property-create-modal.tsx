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

interface PropertyCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PropertyCreateModal({ open, onOpenChange, onSuccess }: PropertyCreateModalProps) {
  const [formData, setFormData] = React.useState({
    codigo: "",
    tipo: "",
    classe: "",
    subclasse: "",
    nomeUsual: "",
    endereco: "",
    cidade: "",
    area: "",
    matricula: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.codigo ||
      !formData.tipo ||
      !formData.classe ||
      !formData.nomeUsual ||
      !formData.endereco ||
      !formData.cidade ||
      !formData.area ||
      !formData.matricula
    ) {
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

    toast({
      title: "Imóvel criado com sucesso!",
      description: `Imóvel "${formData.nomeUsual}" foi adicionado ao patrimônio.`,
    })

    setIsLoading(false)
    onOpenChange(false)
    onSuccess?.()

    setFormData({
      codigo: "",
      tipo: "",
      classe: "",
      subclasse: "",
      nomeUsual: "",
      endereco: "",
      cidade: "",
      area: "",
      matricula: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Imóvel</DialogTitle>
          <DialogDescription>Adicione um novo imóvel ao patrimônio da empresa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Ex: IM001"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="classe">Classe *</Label>
              <Select value={formData.classe} onValueChange={(value) => handleInputChange("classe", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="sala">Sala Comercial</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="galpao">Galpão</SelectItem>
                  <SelectItem value="terreno-urbano">Terreno Urbano</SelectItem>
                  <SelectItem value="terreno-rural">Terreno Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subclasse">Subclasse *</Label>
              <Select value={formData.subclasse} onValueChange={(value) => handleInputChange("subclasse", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subclasse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="alto-padrao">Alto Padrão</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="luxo">Luxo</SelectItem>
                  <SelectItem value="economico">Econômico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nomeUsual">Nome Usual *</Label>
              <Input
                id="nomeUsual"
                placeholder="Ex: Casa da Praia"
                value={formData.nomeUsual}
                onChange={(e) => handleInputChange("nomeUsual", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Select value={formData.cidade} onValueChange={(value) => handleInputChange("cidade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sao-paulo">São Paulo - SP</SelectItem>
                  <SelectItem value="rio-de-janeiro">Rio de Janeiro - RJ</SelectItem>
                  <SelectItem value="belo-horizonte">Belo Horizonte - MG</SelectItem>
                  <SelectItem value="brasilia">Brasília - DF</SelectItem>
                  <SelectItem value="salvador">Salvador - BA</SelectItem>
                  <SelectItem value="fortaleza">Fortaleza - CE</SelectItem>
                  <SelectItem value="curitiba">Curitiba - PR</SelectItem>
                  <SelectItem value="recife">Recife - PE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">Área (m²) *</Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                placeholder="Ex: 120.50"
                value={formData.area}
                onChange={(e) => handleInputChange("area", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="matricula">Matrícula *</Label>
              <Input
                id="matricula"
                placeholder="Ex: 12345"
                value={formData.matricula}
                onChange={(e) => handleInputChange("matricula", e.target.value)}
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
