"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building, Car, MapPin, CreditCard, X, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Property, Vehicle, Credit, Development } from "@/lib/types"

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
  const [loading, setLoading] = React.useState(false)
  const [properties, setProperties] = React.useState<Property[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [credits, setCredits] = React.useState<Credit[]>([])
  const [developments, setDevelopments] = React.useState<Development[]>([])

  // Fetch data based on item type
  React.useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      try {
        switch (itemType) {
          case "Imóveis":
            const { data: propsData } = await supabase
              .from('properties')
              .select('*')
              .eq('status', 'disponivel')
              .order('identification')
            setProperties(propsData || [])
            break

          case "Veículos":
            const { data: veicData } = await supabase
              .from('vehicles')
              .select('*')
              .eq('status', 'disponivel')
              .order('model')
            setVehicles(veicData || [])
            break

          case "Créditos":
            const { data: credData } = await supabase
              .from('credits')
              .select('*')
              .eq('status', 'disponivel')
              .order('code')
            setCredits(credData || [])
            break

          case "Empreendimentos":
            const { data: devData } = await supabase
              .from('developments')
              .select('*')
              .eq('status', 'disponivel')
              .order('name')
            setDevelopments(devData || [])
            break
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, itemType])

  // Get items based on type
  const getItemsByType = (type: string) => {
    switch (type) {
      case "Imóveis":
        return properties.map((p) => ({ ...p, type: "Imóvel", icon: Building, searchField: p.identification, value: p.reference_value }))
      case "Veículos":
        return vehicles.map((v) => ({
          ...v,
          type: "Veículo",
          icon: Car,
          searchField: `${v.brand} ${v.model}`,
          value: v.reference_value || 0,
        }))
      case "Empreendimentos":
        return developments.map((d) => ({
          ...d,
          type: "Empreendimento",
          icon: MapPin,
          searchField: d.name,
          value: d.reference_value || 0,
        }))
      case "Créditos":
        return credits.map((c) => ({
          ...c,
          type: "Crédito",
          icon: CreditCard,
          searchField: c.code,
          value: c.current_balance,
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
    const itemValue = (selectedItem.value || 0) * percentageValue

    onItemAdded({
      id: selectedItem.id,
      name: selectedItem.searchField,
      type: selectedItem.type,
      value: itemValue,
      code: selectedItem.code,
      percentage: Number.parseFloat(percentage),
    })

    // Reset form
    setSelectedItem(null)
    setPercentage("")
    setSearchTerm("")
    setProperties([])
    setVehicles([])
    setCredits([])
    setDevelopments([])
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedItem(null)
    setPercentage("")
    setSearchTerm("")
    setProperties([])
    setVehicles([])
    setCredits([])
    setDevelopments([])
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !selectedItem ? (
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
                            {item.code && (
                              <div className="text-xs text-muted-foreground">{item.code}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(item.value || 0)}
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
                      {selectedItem.code && (
                        <div className="text-xs text-muted-foreground">{selectedItem.code}</div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveSelection}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Valor: {formatCurrency(selectedItem.value || 0)}
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
                        ((selectedItem.value || 0) *
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
