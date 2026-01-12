"use client"

import type React from "react"
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
import type { Property } from "@/lib/types"

interface ViewPropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property | null
}

export function ViewPropertyDialog({ 
  open, 
  onOpenChange, 
  property 
}: ViewPropertyDialogProps) {
  if (!property) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residencial: "Residencial",
      comercial: "Comercial",
      industrial: "Industrial",
      rural: "Rural",
      terreno: "Terreno",
    }
    return labels[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Imóvel</DialogTitle>
          <DialogDescription>Visualize as informações cadastradas do imóvel.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* CÓDIGO */}
          <div className="grid gap-2">
            <Label>Código</Label>
            <Input
              value={property.code}
              disabled
              className="bg-muted"
            />
          </div>

          {/* TIPO */}
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Input
              value={getTypeLabel(property.type)}
              disabled
              className="bg-muted"
            />
          </div>

          {/* CLASSE E SUBCLASSE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Classe</Label>
              <Input
                value={property.classe || "-"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Sub-classe</Label>
              <Input
                value={property.subclasse || "-"}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* NOME USUAL */}
          <div className="grid gap-2">
            <Label>Nome Usual</Label>
            <Input
              value={property.identification}
              disabled
              className="bg-muted"
            />
          </div>

          {/* ENDEREÇO */}
          <div className="grid gap-2">
            <Label>Endereço</Label>
            <Input
              value={property.street}
              disabled
              className="bg-muted"
            />
          </div>

          {/* BAIRRO E CIDADE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Bairro</Label>
              <Input
                value={property.neighborhood}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Input
                value={property.city}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* ÁREA E MATRÍCULA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Área (m²)</Label>
              <Input
                value={property.area.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Matrícula</Label>
              <Input
                value={property.registry}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* % GRA E VALOR ULT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>% GRA</Label>
              <Input
                value={`${property.gra_percentage.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Valor ULT</Label>
              <Input
                value={formatCurrency(property.ult_value)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* VALOR DE VENDA E VALOR DE VENDA GRA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Valor de Venda</Label>
              <Input
                value={formatCurrency(property.sale_value)}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Valor de Venda GRA</Label>
              <Input
                value={formatCurrency(property.sale_value_gra)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* DATA DE ATUALIZAÇÃO */}
          <div className="grid gap-2">
            <Label>Data da Atualização</Label>
            <Input
              value={formatDate(property.updated_at)}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
