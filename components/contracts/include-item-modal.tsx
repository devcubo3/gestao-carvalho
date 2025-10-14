"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Car, MapPin, CreditCard } from "lucide-react"
import { mockProperties, mockVehicles, mockDevelopments, mockCredits } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

interface IncludeItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: (item: any) => void
  side: "A" | "B"
  itemType: string
}

export function IncludeItemModal({ open, onOpenChange, onItemAdded, side, itemType }: IncludeItemModalProps) {
  const [selectedItemId, setSelectedItemId] = React.useState("")
  const [percentage, setPercentage] = React.useState("")

  // Get items based on type
  const getItemsByType = (type: string) => {
    switch (type) {
      case "Imóveis":
        return mockProperties.map((p) => ({ ...p, type: "Imóvel", icon: Building }))
      case "Veículos":
        return mockVehicles.map((v) => ({ ...v, type: "Veículo", icon: Car }))
      case "Empreendimentos":
        return mockDevelopments.map((d) => ({ ...d, type: "Empreendimento", icon: MapPin }))
      case "Créditos":
        return mockCredits.map((c) => ({ ...c, type: "Crédito", icon: CreditCard }))
      default:
        return []
    }
  }

  const items = getItemsByType(itemType)
  const selectedItem = items.find((item) => item.id === selectedItemId)

  const handleConfirm = () => {
    if (!selectedItem || !percentage) return

    const percentageValue = Number.parseFloat(percentage) / 100
    const itemValue = (selectedItem.value || selectedItem.referenceValue || 0) * percentageValue

    onItemAdded({
      id: Date.now().toString(),
      name: selectedItem.name || selectedItem.description,
      type: selectedItem.type,
      value: itemValue,
      code: selectedItem.code,
      percentage: Number.parseFloat(percentage),
    })

    // Reset form
    setSelectedItemId("")
    setPercentage("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedItemId("")
    setPercentage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Incluir {itemType} - Lado {side}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-select">Selecionar Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder={`Buscar ${itemType.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{item.name || item.description}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {formatCurrency(item.value || item.referenceValue || 0)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage">Porcentagem (%)</Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Ex: 50"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </div>

          {selectedItem && percentage && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium">{selectedItem.name || selectedItem.description}</div>
                <div className="text-muted-foreground">
                  Valor total: {formatCurrency(selectedItem.value || selectedItem.referenceValue || 0)}
                </div>
                <div className="text-muted-foreground">Porcentagem: {percentage}%</div>
                <div className="font-medium text-primary">
                  Valor a incluir:{" "}
                  {formatCurrency(
                    ((selectedItem.value || selectedItem.referenceValue || 0) * Number.parseFloat(percentage || "0")) /
                      100,
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedItemId || !percentage} className="flex-1">
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
