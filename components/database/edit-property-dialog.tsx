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
import { useToast } from "@/hooks/use-toast"
import type { Property } from "@/lib/types"

interface EditPropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

export function EditPropertyDialog({ 
  open, 
  onOpenChange, 
  property, 
  onSubmit, 
  submitting = false 
}: EditPropertyDialogProps) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (property) {
      setFormData({
        code: property.code || "",
        identification: property.identification || "",
        type: property.type || "",
        classe: property.classe || "",
        subclasse: property.subclasse || "",
        street: property.street || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        area: property.area?.toString() || "",
        registry: property.registry || "",
        gra_percentage: property.gra_percentage?.toString() || "",
        ult_value: property.ult_value?.toString() || "",
        sale_value: property.sale_value?.toString() || "",
        sale_value_gra: property.sale_value_gra?.toString() || "",
      })
    }
  }, [property])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    // Validar campos obrigatórios
    if (!formData.identification || !formData.type || !formData.street || 
        !formData.neighborhood || !formData.city || !formData.area || !formData.registry) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
      })
      return
    }

    const dataToSubmit = {
      code: formData.code || "",
      identification: formData.identification,
      type: formData.type,
      classe: formData.classe || "",
      subclasse: formData.subclasse || "",
      street: formData.street,
      number: "S/N",
      complement: "",
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: "BR",
      zip_code: "00000-000",
      area: formData.area ? parseFloat(formData.area) : 0,
      registry: formData.registry,
      gra_percentage: formData.gra_percentage ? parseFloat(formData.gra_percentage) : 0,
      ult_value: formData.ult_value ? parseFloat(formData.ult_value) : 0,
      sale_value: formData.sale_value ? parseFloat(formData.sale_value) : 0,
      sale_value_gra: formData.sale_value_gra ? parseFloat(formData.sale_value_gra) : 0,
      notes: "",
    }

    onSubmit(dataToSubmit)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Imóvel</DialogTitle>
          <DialogDescription>Atualize as informações do imóvel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* CÓDIGO */}
            <div className="grid gap-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: I-00001"
                value={formData.code}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            {/* IDENTIFICAÇÃO */}
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

            {/* TIPO */}
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

            {/* CLASSE E SUBCLASSE */}
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

            {/* ENDEREÇO */}
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

            {/* BAIRRO E CIDADE */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* ÁREA E MATRÍCULA */}
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

            {/* % GRA E VALOR ULT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gra_percentage">
                  % GRA
                  <span className="text-xs text-muted-foreground ml-1">(0-100)</span>
                </Label>
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
                  placeholder="Ex: 350000.00"
                  value={formData.ult_value}
                  onChange={(e) => handleInputChange("ult_value", e.target.value)}
                />
              </div>
            </div>

            {/* VALOR DE VENDA E VALOR DE VENDA GRA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sale_value">Valor de Venda (R$)</Label>
                <Input
                  id="sale_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 450000.00"
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
                  placeholder="Ex: 520000.00"
                  value={formData.sale_value_gra}
                  onChange={(e) => handleInputChange("sale_value_gra", e.target.value)}
                />
              </div>
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
