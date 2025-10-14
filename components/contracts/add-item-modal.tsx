"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Building, Car, MapPin, CreditCard, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { mockProperties, mockVehicles, mockDevelopments, mockCredits } from "@/lib/mock-data"
import { PropertyCreateModal } from "@/components/database/property-create-modal"
import { VehicleCreateModal } from "@/components/database/vehicle-create-modal"
import { DevelopmentCreateModal } from "@/components/database/development-create-modal"
import { CreditCreateModal } from "@/components/database/credit-create-modal"
import { formatCurrency } from "@/lib/utils"

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: (item: any) => void
  side: "A" | "B"
}

export function AddItemModal({ open, onOpenChange, onItemAdded, side }: AddItemModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [propertyModalOpen, setPropertyModalOpen] = React.useState(false)
  const [vehicleModalOpen, setVehicleModalOpen] = React.useState(false)
  const [developmentModalOpen, setDevelopmentModalOpen] = React.useState(false)
  const [creditModalOpen, setCreditModalOpen] = React.useState(false)

  // Combine all items from patrimônio
  const allItems = React.useMemo(() => {
    const properties = mockProperties.map((p) => ({ ...p, type: "Imóvel", icon: Building }))
    const vehicles = mockVehicles.map((v) => ({ ...v, type: "Veículo", icon: Car }))
    const developments = mockDevelopments.map((d) => ({ ...d, type: "Empreendimento", icon: MapPin }))
    const credits = mockCredits.map((c) => ({ ...c, type: "Crédito", icon: CreditCard }))

    return [...properties, ...vehicles, ...developments, ...credits]
  }, [])

  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return allItems
    return allItems.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [allItems, searchTerm])

  const handleItemSelect = (item: any) => {
    onItemAdded({
      id: item.id,
      name: item.name || item.description,
      type: item.type,
      value: item.value || item.referenceValue || 0,
      code: item.code,
    })
    onOpenChange(false)
    setSearchTerm("")
  }

  const handleNewItemCreated = (newItem: any) => {
    onItemAdded(newItem)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Item - Lado {side}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* New Item dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0 bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Item
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPropertyModalOpen(true)}>
                    <Building className="h-4 w-4 mr-2" />
                    Imóvel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVehicleModalOpen(true)}>
                    <Car className="h-4 w-4 mr-2" />
                    Veículo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDevelopmentModalOpen(true)}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Empreendimento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreditModalOpen(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Crédito
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator />

            {/* Results */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Itens Disponíveis</h3>
                <span className="text-xs text-muted-foreground">{filteredItems.length} item(s) encontrado(s)</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <IconComponent className="h-4 w-4 text-slate-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name || item.description}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.code && <span>Código: {item.code}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.value || item.referenceValue || 0)}</div>
                      </div>
                    </div>
                  )
                })}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item encontrado</p>
                    <p className="text-sm">Tente ajustar sua busca ou criar um novo item</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Creation modals */}
      <PropertyCreateModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        onSuccess={handleNewItemCreated}
      />
      <VehicleCreateModal open={vehicleModalOpen} onOpenChange={setVehicleModalOpen} onSuccess={handleNewItemCreated} />
      <DevelopmentCreateModal
        open={developmentModalOpen}
        onOpenChange={setDevelopmentModalOpen}
        onSuccess={handleNewItemCreated}
      />
      <CreditCreateModal open={creditModalOpen} onOpenChange={setCreditModalOpen} onSuccess={handleNewItemCreated} />
    </>
  )
}
