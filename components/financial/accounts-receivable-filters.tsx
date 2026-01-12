"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { useCategories } from "@/hooks/use-categories"

export interface AccountsReceivableFilters {
  dateFrom?: Date
  dateTo?: Date
  code?: string
  status?: string
  vinculo?: string
  centroCusto?: string
  description?: string
  valueMin?: number
  valueMax?: number
}

interface AccountsReceivableFiltersProps {
  filters: AccountsReceivableFilters
  onFiltersChange: (filters: AccountsReceivableFilters) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function AccountsReceivableFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  onApplyFilters,
}: AccountsReceivableFiltersProps) {
  const { categories: vinculos } = useCategories('vinculo')
  const { categories: centrosCusto } = useCategories('centro_custo')
  
  const updateFilter = (key: keyof AccountsReceivableFilters, value: any) => {
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
              value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value + "T00:00:00") : undefined
                updateFilter("dateTo", date)
              }}
            />
          </div>

          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Código
            </Label>
            <Input
              id="code"
              placeholder="Ex: CR-240001"
              value={filters.code || ""}
              onChange={(e) => updateFilter("code", e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select value={filters.status || ""} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="em_aberto">Em Aberto</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="parcialmente_pago">Parcialmente Pago</SelectItem>
                <SelectItem value="quitado">Quitado</SelectItem>
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
