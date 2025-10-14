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
import { mockVinculos, mockCentrosCusto } from "@/lib/mock-data"

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
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  const updateFilter = (key: keyof CashFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
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
          {/* Data Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data</Label>
            <div className="flex gap-2">
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => {
                      updateFilter("dateFrom", date)
                      setDateFromOpen(false)
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => {
                      updateFilter("dateTo", date)
                      setDateToOpen(false)
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                {mockVinculos.map((vinculo) => (
                  <SelectItem key={vinculo} value={vinculo}>
                    {vinculo}
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
                {mockCentrosCusto.map((centro) => (
                  <SelectItem key={centro} value={centro}>
                    {centro}
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
