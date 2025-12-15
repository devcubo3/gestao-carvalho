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
  const [formData, setFormData] = useState({
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    area: "",
    registry: "",
    reference_value: "",
    notes: "",
  })

  const [isLoadingCep, setIsLoadingCep] = useState(false)

  useEffect(() => {
    if (property) {
      setFormData({
        identification: property.identification || "",
        type: property.type || "",
        classe: property.classe || "",
        subclasse: property.subclasse || "",
        street: property.street || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        area: property.area?.toString() || "",
        registry: property.registry || "",
        reference_value: property.reference_value?.toString() || "",
        notes: property.notes || "",
      })
    }
  }, [property])

  const handleCepBlur = async () => {
    const cep = formData.zip_code.replace(/\D/g, "")
    if (cep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const dataToSubmit = {
      ...formData,
      area: formData.area ? parseFloat(formData.area) : 0,
      reference_value: formData.reference_value ? parseFloat(formData.reference_value) : 0,
    }

    onSubmit(dataToSubmit)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCepChange = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")
    
    // Limita a 8 dígitos
    const limited = numbers.slice(0, 8)
    
    // Formata: XXXXX-XXX
    let formatted = limited
    if (limited.length > 5) {
      formatted = `${limited.slice(0, 5)}-${limited.slice(5)}`
    }
    
    setFormData((prev) => ({ ...prev, zip_code: formatted }))
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
            <div className="grid gap-2">
              <Label htmlFor="identification">Nome/Identificação *</Label>
              <Input
                id="identification"
                placeholder="Ex: Apartamento Vila Madalena"
                value={formData.identification}
                onChange={(e) => handleInputChange("identification", e.target.value)}
                required
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="classe">Classe</Label>
                <Select value={formData.classe} onValueChange={(value) => handleInputChange("classe", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
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
                <Label htmlFor="subclasse">Subclasse</Label>
                <Select value={formData.subclasse} onValueChange={(value) => handleInputChange("subclasse", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a subclasse" />
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

            <div className="grid gap-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                placeholder="Ex: Rua Harmonia"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                disabled={isLoadingCep}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={formData.number}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  placeholder="Apto 45"
                  value={formData.complement}
                  onChange={(e) => handleInputChange("complement", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                placeholder="Ex: Vila Madalena"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                disabled={isLoadingCep}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={isLoadingCep}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">Estado (UF) *</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                  disabled={isLoadingCep}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zip_code">CEP *</Label>
              <Input
                id="zip_code"
                placeholder="01234-567"
                value={formData.zip_code}
                onChange={(e) => handleCepChange(e.target.value)}
                onBlur={handleCepBlur}
                disabled={isLoadingCep}
                maxLength={9}
                required
              />
              {isLoadingCep && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área (m²) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  placeholder="120.50"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="registry">Matrícula *</Label>
                <Input
                  id="registry"
                  placeholder="12345"
                  value={formData.registry}
                  onChange={(e) => handleInputChange("registry", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference_value">Valor do Imóvel (R$)</Label>
              <Input
                id="reference_value"
                type="number"
                step="0.01"
                placeholder="250000.00"
                value={formData.reference_value}
                onChange={(e) => handleInputChange("reference_value", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o imóvel"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
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
