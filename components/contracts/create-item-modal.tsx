"use client"
import { PropertyCreateModal } from "@/components/database/property-create-modal"
import { VehicleCreateModal } from "@/components/database/vehicle-create-modal"
import { DevelopmentCreateModal } from "@/components/database/development-create-modal"
import { CreditCreateModal } from "@/components/database/credit-create-modal"

interface CreateItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemCreated: (item: any) => void
  side: "A" | "B"
  itemType: string
}

export function CreateItemModal({ open, onOpenChange, onItemCreated, side, itemType }: CreateItemModalProps) {
  const handleItemCreated = (newItem: any) => {
    // Transform the created item to match contract format
    const contractItem = {
      id: Date.now().toString(),
      name: newItem.name || newItem.description,
      type: getItemTypeLabel(itemType),
      value: newItem.value || newItem.referenceValue || 0,
      code: newItem.code,
      percentage: 100, // Default to 100% when creating new item
    }

    onItemCreated(contractItem)
    onOpenChange(false)
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "Imóveis":
        return "Imóvel"
      case "Veículos":
        return "Veículo"
      case "Empreendimentos":
        return "Empreendimento"
      case "Créditos":
        return "Crédito"
      default:
        return type
    }
  }

  const renderCreateModal = () => {
    switch (itemType) {
      case "Imóveis":
        return <PropertyCreateModal open={open} onOpenChange={onOpenChange} onSuccess={handleItemCreated} />
      case "Veículos":
        return <VehicleCreateModal open={open} onOpenChange={onOpenChange} onSuccess={handleItemCreated} />
      case "Empreendimentos":
        return <DevelopmentCreateModal open={open} onOpenChange={onOpenChange} onSuccess={handleItemCreated} />
      case "Créditos":
        return <CreditCreateModal open={open} onOpenChange={onOpenChange} onSuccess={handleItemCreated} />
      default:
        return null
    }
  }

  return renderCreateModal()
}
