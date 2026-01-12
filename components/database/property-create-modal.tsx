"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createProperty } from "@/app/actions/properties"
import { useRouter } from "next/navigation"

interface PropertyCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PropertyCreateModal({ open, onOpenChange, onSuccess }: PropertyCreateModalProps) {
  const router = useRouter()
  const [formData, setFormData] = React.useState({
    code: "",
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    neighborhood: "",
    city: "",
    area: "",
    registry: "",
    gra_percentage: "",
    ult_value: "",
    sale_value: "",
    sale_value_gra: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.identification ||
      !formData.type ||
      !formData.street ||
      !formData.neighborhood ||
      !formData.city ||
      !formData.area ||
      !formData.registry
    ) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const result = await createProperty({
      code: formData.code || undefined,
      identification: formData.identification,
      type: formData.type as any,
      classe: formData.classe || undefined,
      subclasse: formData.subclasse || undefined,
      street: formData.street,
      number: "S/N",
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: "BR",
      zip_code: "00000-000",
      area: Number(formData.area),
      registry: formData.registry,
      gra_percentage: Number(formData.gra_percentage) || 0,
      ult_value: Number(formData.ult_value) || 0,
      sale_value: Number(formData.sale_value) || 0,
      sale_value_gra: Number(formData.sale_value_gra) || 0,
    })

    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Imóvel criado com sucesso!",
        description: `Imóvel "${formData.identification}" foi adicionado ao patrimônio.`,
      })
      onOpenChange(false)
      router.refresh()
      onSuccess?.()
      
      // Limpar formulário
      setFormData({
        code: "",
        identification: "",
        type: "",
        classe: "",
        subclasse: "",
        street: "",
        neighborhood: "",
        city: "",
        area: "",
        registry: "",
        gra_percentage: "",
        ult_value: "",
        sale_value: "",
        sale_value_gra: "",
      })
    } else {
      toast({
        title: "Erro ao criar imóvel",
        description: result.error,
        variant: "destructive",
      })
    }
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
            {/* Código */}
            <div className="grid gap-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: I-00001 (deixe vazio para gerar automaticamente)"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
              />
            </div>

            {/* Nome Usual */}
            <div className="grid gap-2">
              <Label htmlFor="identification">Nome Usual *</Label>
              <Input
                id="identification"
                placeholder="Ex: Apartamento Vila Madalena"
                value={formData.identification}
                onChange={(e) => handleInputChange("identification", e.target.value)}
                required
              />
            </div>

            {/* Tipo */}
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
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

            {/* Classe e Subclasse */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="classe">Classe</Label>
                <Select value={formData.classe} onValueChange={(value) => handleInputChange("classe", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casa">Casa</SelectItem>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Sala Comercial">Sala Comercial</SelectItem>
                    <SelectItem value="Loja">Loja</SelectItem>
                    <SelectItem value="Galpão">Galpão</SelectItem>
                    <SelectItem value="Terreno Urbano">Terreno Urbano</SelectItem>
                    <SelectItem value="Terreno Rural">Terreno Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subclasse">Sub-classe</Label>
                <Select value={formData.subclasse} onValueChange={(value) => handleInputChange("subclasse", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Padrão">Padrão</SelectItem>
                    <SelectItem value="Alto Padrão">Alto Padrão</SelectItem>
                    <SelectItem value="Popular">Popular</SelectItem>
                    <SelectItem value="Luxo">Luxo</SelectItem>
                    <SelectItem value="Econômico">Econômico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Endereço */}
            <div className="grid gap-2">
              <Label htmlFor="street">Endereço *</Label>
              <Input
                id="street"
                placeholder="Ex: Rua Harmonia, 123"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                required
              />
            </div>

            {/* Bairro */}
            <div className="grid gap-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                placeholder="Ex: Vila Madalena"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                required
              />
            </div>

            {/* Cidade */}
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                placeholder="Ex: São Paulo"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                required
              />
            </div>

            {/* Área e Matrícula */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="registry">Matrícula *</Label>
                <Input
                  id="registry"
                  placeholder="Ex: 12345"
                  value={formData.registry}
                  onChange={(e) => handleInputChange("registry", e.target.value)}
                  required
                />
              </div>
            </div>


            {/* % GRA e Valor ULT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gra_percentage">% GRA (0-100)</Label>
                <Input
                  id="gra_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 15.50"
                  value={formData.gra_percentage}
                  onChange={(e) => handleInputChange("gra_percentage", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ult_value">Valor ULT (R$)</Label>
                <Input
                  id="ult_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 350000"
                  value={formData.ult_value}
                  onChange={(e) => handleInputChange("ult_value", e.target.value)}
                />
              </div>
            </div>

            {/* Valor de Venda e Valor GRA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sale_value">Valor de Venda (R$)</Label>
                <Input
                  id="sale_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 4500"
                  value={formData.sale_value}
                  onChange={(e) => handleInputChange("sale_value", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sale_value_gra">Valor de Venda GRA (R$)</Label>
                <Input
                  id="sale_value_gra"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 520000"
                  value={formData.sale_value_gra}
                  onChange={(e) => handleInputChange("sale_value_gra", e.target.value)}
                />
              </div>
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
