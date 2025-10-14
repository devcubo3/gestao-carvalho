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

interface VehicleCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function VehicleCreateModal({ open, onOpenChange, onSuccess }: VehicleCreateModalProps) {
  const [formData, setFormData] = React.useState({
    type: "",
    code: "",
    brandModel: "",
    color: "",
    plate: "",
    year: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.type ||
      !formData.code ||
      !formData.brandModel ||
      !formData.color ||
      !formData.plate ||
      !formData.year
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
      title: "Veículo criado com sucesso!",
      description: `Veículo "${formData.brandModel}" foi adicionado ao patrimônio.`,
    })

    setIsLoading(false)
    onOpenChange(false)
    onSuccess?.()

    setFormData({
      type: "",
      code: "",
      brandModel: "",
      color: "",
      plate: "",
      year: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Veículo</DialogTitle>
          <DialogDescription>Adicione um novo veículo ao patrimônio da empresa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carro">Carro</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="caminhao">Caminhão</SelectItem>
                  <SelectItem value="barco">Barco</SelectItem>
                  <SelectItem value="onibus">Ônibus</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                placeholder="Ex: VEI001"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brandModel">Marca/Modelo *</Label>
              <Input
                id="brandModel"
                placeholder="Ex: Honda Civic"
                value={formData.brandModel}
                onChange={(e) => handleInputChange("brandModel", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Cor *</Label>
              <Input
                id="color"
                placeholder="Ex: Branco"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input
                id="plate"
                placeholder="Ex: ABC-1234"
                value={formData.plate}
                onChange={(e) => handleInputChange("plate", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2030"
                placeholder="Ex: 2020"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
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
