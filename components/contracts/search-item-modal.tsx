"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building, Car, MapPin, CreditCard, X } from "lucide-react"
import { mockProperties, mockVehicles, mockDevelopments, mockCredits } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

interface SearchItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: (item: any) => void
  side: "A" | "B"
  itemType: string
}

export function SearchItemModal({ open, onOpenChange, onItemAdded, side, itemType }: SearchItemModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [percentage, setPercentage] = React.useState("")

  // Get items based on type
  const getItemsByType = (type: string) => {
    switch (type) {
      case "Imóveis":
        return mockProperties.map((p) => ({ ...p, type: "Imóvel", icon: Building, searchField: p.name }))
      case "Veículos":
        return mockVehicles.map((v) => ({
          ...v,
          type: "Veículo",
          icon: Car,
          searchField: `${v.brand} ${v.model}`,
        }))
      case "Empreendimentos":
        return mockDevelopments.map((d) => ({
          ...d,
          type: "Empreendimento",
          icon: MapPin,
          searchField: d.name,
        }))
      case "Créditos":
        return mockCredits.map((c) => ({
          ...c,
          type: "Crédito",
          icon: CreditCard,
          searchField: c.description,
        }))
      default:
        return []
    }
  }

  const allItems = getItemsByType(itemType)

  // Filter items based on search term
  const filteredItems = allItems.filter(
    (item) =>
      item.searchField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleItemSelect = (item: any) => {
    setSelectedItem(item)
  }

  const handleRemoveSelection = () => {
    setSelectedItem(null)
    setPercentage("")
  }

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
    setSelectedItem(null)
    setPercentage("")
    setSearchTerm("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedItem(null)
    setPercentage("")
    setSearchTerm("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Buscar {itemType} - {side === "A" ? "Entradas" : "Saídas"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedItem ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="search">Buscar {itemType}</Label>
                <Input
                  id="search"
                  placeholder={`Digite para buscar ${itemType.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{item.searchField}</div>
                            {(itemType === "Veículos" || itemType === "Empreendimentos") && (
                              <div className="text-xs text-muted-foreground">{item.code}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(item.value || item.referenceValue || 0)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    {searchTerm ? "Nenhum resultado encontrado" : `Digite para buscar ${itemType.toLowerCase()}`}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <selectedItem.icon className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">{selectedItem.searchField}</div>
                      {(itemType === "Veículos" || itemType === "Empreendimentos") && (
                        <div className="text-xs text-muted-foreground">{selectedItem.code}</div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveSelection}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Valor: {formatCurrency(selectedItem.value || selectedItem.referenceValue || 0)}
                </div>
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

              {percentage && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-primary">
                      Valor a incluir:{" "}
                      {formatCurrency(
                        ((selectedItem.value || selectedItem.referenceValue || 0) *
                          Number.parseFloat(percentage || "0")) /
                          100,
                      )}
                    </div>
                    <div className="text-muted-foreground">Porcentagem: {percentage}%</div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedItem || !percentage} className="flex-1">
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
