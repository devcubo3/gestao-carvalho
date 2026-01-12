"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Search, RotateCcw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useCategories } from "@/hooks/use-categories"

export interface CashFilters {
  dateFrom?: Date
  dateTo?: Date
  type?: string
  vinculo?: string
  forma?: string
  centroCusto?: string
  description?: string
  valueMin?: number
  valueMax?: number
}

interface CashFiltersProps {
  filters: CashFilters
  onFiltersChange: (filters: CashFilters) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function CashFilters({ filters, onFiltersChange, onClearFilters, onApplyFilters }: CashFiltersProps) {
  const { categories: vinculos } = useCategories('vinculo')
  const { categories: centrosCusto } = useCategories('centro_custo')
  
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  const updateFilter = (key: keyof CashFilters, value: any) => {
    // Se o valor for undefined ou string vazia, remove do objeto
    const newFilters = { ...filters }
    if (value === undefined || value === "" || value === null) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange(newFilters)
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== "" && value !== null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Data Inicial */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-sm font-medium">
              Data Inicial
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined
                updateFilter("dateFrom", date)
              }}
            />
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-sm font-medium">
              Data Final
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined
                updateFilter("dateTo", date)
              }}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo
            </Label>
            <Select value={filters.type || ""} onValueChange={(value) => updateFilter("type", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vínculo */}
          <div className="space-y-2">
            <Label htmlFor="vinculo" className="text-sm font-medium">
              Vínculo
            </Label>
            <Select value={filters.vinculo || ""} onValueChange={(value) => updateFilter("vinculo", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar vínculo" />
              </SelectTrigger>
              <SelectContent>
                {vinculos.map((vinculo) => (
                  <SelectItem key={vinculo.id} value={vinculo.name}>
                    {vinculo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Forma */}
          <div className="space-y-2">
            <Label htmlFor="forma" className="text-sm font-medium">
              Forma
            </Label>
            <Select value={filters.forma || ""} onValueChange={(value) => updateFilter("forma", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Caixa">Caixa</SelectItem>
                <SelectItem value="Permuta">Permuta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Centro de Custo */}
          <div className="space-y-2">
            <Label htmlFor="centroCusto" className="text-sm font-medium">
              Centro de Custo
            </Label>
            <Select value={filters.centroCusto || ""} onValueChange={(value) => updateFilter("centroCusto", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar centro de custo" />
              </SelectTrigger>
              <SelectContent>
                {centrosCusto.map((centro) => (
                  <SelectItem key={centro.id} value={centro.name}>
                    {centro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Input
              id="description"
              placeholder="Buscar na descrição"
              value={filters.description || ""}
              onChange={(e) => updateFilter("description", e.target.value)}
            />
          </div>

          {/* Valor Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Valor</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Valor mín."
                value={filters.valueMin || ""}
                onChange={(e) => updateFilter("valueMin", e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Valor máx."
                value={filters.valueMax || ""}
                onChange={(e) => updateFilter("valueMax", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex items-center gap-2 bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button onClick={onApplyFilters} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Search className="h-4 w-4" />
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
