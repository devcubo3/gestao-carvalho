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
import type { Vehicle } from "@/lib/types"

interface EditVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

export function EditVehicleDialog({ 
  open, 
  onOpenChange, 
  vehicle, 
  onSubmit, 
  submitting = false 
}: EditVehicleDialogProps) {
  const [formData, setFormData] = useState({
    type: "",
    brand: "",
    model: "",
    year: "",
    plate: "",
    color: "",
    fuel_type: "",
    notes: "",
  })

  useEffect(() => {
    if (vehicle) {
      setFormData({
        type: vehicle.type || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year?.toString() || "",
        plate: vehicle.plate || "",
        color: vehicle.color || "",
        fuel_type: vehicle.fuel_type || "",
        notes: vehicle.notes || "",
      })
    }
  }, [vehicle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const dataToSubmit = {
      type: formData.type,
      brand: formData.brand,
      model: formData.model,
      year: parseInt(formData.year),
      plate: formData.plate,
      color: formData.color || undefined,
      fuel_type: formData.fuel_type || undefined,
      notes: formData.notes || undefined,
    }

    onSubmit(dataToSubmit)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlateChange = (value: string) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    cleaned = cleaned.slice(0, 7)
    let formatted = cleaned
    if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    }
    setFormData((prev) => ({ ...prev, plate: formatted }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Veículo</DialogTitle>
          <DialogDescription>Atualize as informações do veículo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  placeholder="Ex: Toyota"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="Ex: Corolla"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="2022"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plate">Placa *</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1D23"
                  value={formData.plate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  maxLength={8}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                placeholder="Ex: Prata"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fuel_type">Tipo de Combustível</Label>
              <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange("fuel_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="eletrico">Elétrico</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="gnv">GNV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o veículo"
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
