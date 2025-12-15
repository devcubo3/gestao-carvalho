"use client"

import React, { useState, useEffect } from "react"
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
import type { Development } from "@/lib/types"

interface EditDevelopmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  development: Development | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

const ESTADOS_BRASILEIROS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
]

export function EditDevelopmentDialog({
  open,
  onOpenChange,
  development,
  onSubmit,
  submitting = false,
}: EditDevelopmentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "" as 'predio' | 'loteamento' | 'chacaramento' | 'condominio' | 'comercial' | '',
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    participation_percentage: "",
    total_units: "",
    status: "disponivel" as 'disponivel' | 'comprometido' | 'vendido',
    notes: "",
  })
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const handleCepBlur = async () => {
    const cep = formData.zip_code.replace(/\D/g, '')
    
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
      // Silently fail - user can fill manually
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 8)
    let formatted = limited
    if (limited.length > 5) {
      formatted = `${limited.slice(0, 5)}-${limited.slice(5)}`
    }
    setFormData((prev) => ({ ...prev, zip_code: formatted }))
  }

  useEffect(() => {
    if (development) {
      setFormData({
        name: development.name || "",
        type: development.type || "",
        street: development.street || "",
        neighborhood: development.neighborhood || "",
        city: development.city || "",
        state: development.state || "",
        zip_code: development.zip_code || "",
        participation_percentage: development.participation_percentage?.toString() || "",
        total_units: development.total_units?.toString() || "",
        status: development.status || "disponivel",
        notes: development.notes || "",
      })
    }
  }, [development])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const dataToSubmit = {
      name: formData.name,
      type: formData.type,
      street: formData.street || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code || undefined,
      participation_percentage: formData.participation_percentage ? parseFloat(formData.participation_percentage) : undefined,
      total_units: formData.total_units ? parseInt(formData.total_units) : undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    }

    onSubmit(dataToSubmit)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Editar Empreendimento</DialogTitle>
          <DialogDescription>Atualize as informações do empreendimento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input value={development?.code || ""} disabled />
            </div>

            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Usual *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nome do empreendimento"
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
                    <SelectItem value="predio">Prédio</SelectItem>
                    <SelectItem value="loteamento">Loteamento</SelectItem>
                    <SelectItem value="chacaramento">Chacaramento</SelectItem>
                    <SelectItem value="condominio">Condomínio</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Endereço</h4>
              
              <div className="grid gap-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  disabled={isLoadingCep}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  placeholder="01234-567"
                  value={formData.zip_code}
                  onChange={(e) => handleCepChange(e.target.value)}
                  onBlur={handleCepBlur}
                  disabled={isLoadingCep}
                  maxLength={9}
                />
                {isLoadingCep && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Cidade"
                    disabled={isLoadingCep}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} disabled={isLoadingCep}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BRASILEIROS.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                    placeholder="Bairro"
                    disabled={isLoadingCep}
                  />
                </div>
              </div>
            </div>

            {/* Informações do Empreendimento */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Informações do Empreendimento</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="participation_percentage">Participação (%)</Label>
                  <Input
                    id="participation_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.participation_percentage}
                    onChange={(e) => handleInputChange("participation_percentage", e.target.value)}
                    placeholder="0-100"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="total_units">Total de Unidades</Label>
                  <Input
                    id="total_units"
                    type="number"
                    min="1"
                    value={formData.total_units}
                    onChange={(e) => handleInputChange("total_units", e.target.value)}
                    placeholder="Quantidade"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="comprometido">Comprometido</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div className="grid gap-2 border-t pt-4">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Observações adicionais sobre o empreendimento"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={submitting}
            >
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
