"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Building, Car, MapPin, CreditCard } from "lucide-react"

interface SelectItemTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTypeSelected: (type: string) => void
  side: "A" | "B"
}

export function SelectItemTypeModal({ open, onOpenChange, onTypeSelected, side }: SelectItemTypeModalProps) {
  const handleSelectType = (type: string) => {
    onTypeSelected(type)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Tipo de Item - Lado {side}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleSelectType("Imóveis")}
          >
            <Building className="h-8 w-8" />
            <span>Imóveis</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleSelectType("Veículos")}
          >
            <Car className="h-8 w-8" />
            <span>Veículos</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleSelectType("Créditos")}
          >
            <CreditCard className="h-8 w-8" />
            <span>Créditos</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleSelectType("Empreendimentos")}
          >
            <MapPin className="h-8 w-8" />
            <span>Empreendimentos</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
