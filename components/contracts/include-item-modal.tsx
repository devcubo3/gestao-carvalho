"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Car, MapPin, CreditCard, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch items from database when modal opens or type changes
  React.useEffect(() => {
    if (open && itemType) {
      fetchItems()
    }
  }, [open, itemType])

  const fetchItems = async () => {
    setLoading(true)
    try {
      let data: any[] = []
      
      switch (itemType) {
        case "Imóveis":
          const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('*')
            .in('status', ['disponivel', 'comprometido'])
            .order('identification', { ascending: true })
          
          if (propError) throw propError
          data = (properties || []).map((p) => ({
            id: p.id,
            name: p.identification,
            code: p.code || `IMOV-${p.id.slice(0, 8)}`,
            value: p.reference_value || 0,
            type: "Imóvel",
            icon: Building
          }))
          break

        case "Veículos":
          const { data: vehicles, error: vehError } = await supabase
            .from('vehicles')
            .select('*')
            .in('status', ['disponivel', 'comprometido'])
            .order('brand', { ascending: true })
          
          if (vehError) throw vehError
          data = (vehicles || []).map((v) => ({
            id: v.id,
            name: `${v.brand} ${v.model} (${v.year})`,
            code: v.code || `VEI-${v.id.slice(0, 8)}`,
            value: v.reference_value || 0,
            type: "Veículo",
            icon: Car
          }))
          break

        case "Empreendimentos":
          const { data: developments, error: devError } = await supabase
            .from('developments')
            .select('*')
            .in('status', ['disponivel', 'comprometido'])
            .order('name', { ascending: true })
          
          if (devError) throw devError
          data = (developments || []).map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code || `EMP-${d.id.slice(0, 8)}`,
            value: d.reference_value || 0,
            type: "Empreendimento",
            icon: MapPin
          }))
          break

        case "Créditos":
          const { data: credits, error: credError } = await supabase
            .from('credits')
            .select('*')
            .in('status', ['disponivel', 'comprometido'])
            .order('origin', { ascending: true })
          
          if (credError) throw credError
          data = (credits || []).map((c) => ({
            id: c.id,
            name: `${c.origin} - ${c.creditor_type}`,
            code: c.code || `CRED-${c.id.slice(0, 8)}`,
            value: c.current_balance || 0,
            type: "Crédito",
            icon: CreditCard
          }))
          break

        default:
          data = []
      }

      setItems(data)
    } catch (error) {
      console.error('Erro ao buscar itens:', error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar ${itemType.toLowerCase()}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const selectedItem = items.find((item) => item.id === selectedItemId)

  const handleConfirm = () => {
    if (!selectedItem || !percentage) return

    const percentageValue = Number.parseFloat(percentage) / 100
    const itemValue = (selectedItem.value || 0) * percentageValue

    onItemAdded({
      id: Date.now().toString(),
      name: selectedItem.name,
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
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p>Nenhum {itemType.toLowerCase().slice(0, -1)} ativo encontrado</p>
                <p className="text-xs mt-1">Cadastre itens na aba Patrimônio</p>
              </div>
            ) : (
              <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={`Buscar ${itemType.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(item.value || 0)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                <div className="font-medium">{selectedItem.name}</div>
                <div className="text-muted-foreground">
                  Valor total: {formatCurrency(selectedItem.value || 0)}
                </div>
                <div className="text-muted-foreground">Porcentagem: {percentage}%</div>
                <div className="font-medium text-primary">
                  Valor a incluir:{" "}
                  {formatCurrency(
                    ((selectedItem.value || 0) * Number.parseFloat(percentage || "0")) / 100,
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedItemId || !percentage || loading} className="flex-1">
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
