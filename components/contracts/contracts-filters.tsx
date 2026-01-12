"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface ContractFilters {
  dateFrom?: Date
  dateTo?: Date
  code?: string
  currency?: string
  person?: string
  company?: string
  valueMin?: number
  valueMax?: number
}

interface ContractsFiltersProps {
  filters: ContractFilters
  onFiltersChange: (filters: ContractFilters) => void
  onClearFilters: () => void
  onApplyFilters: () => void
}

export function ContractsFilters({ filters, onFiltersChange, onClearFilters, onApplyFilters }: ContractsFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof ContractFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== "" && value !== null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expandir
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Primeira linha - sempre visível */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pessoa */}
          <div className="space-y-2">
            <Label htmlFor="person" className="text-sm font-medium">
              Pessoa
            </Label>
            <Input
              id="person"
              placeholder="Nome ou CPF"
              value={filters.person || ""}
              onChange={(e) => updateFilter("person", e.target.value)}
            />
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Empresa
            </Label>
            <Input
              id="company"
              placeholder="Razão social ou CNPJ"
              value={filters.company || ""}
              onChange={(e) => updateFilter("company", e.target.value)}
            />
          </div>
        </div>

        {/* Linhas expandidas - mostradas apenas quando expandido */}
        {isExpanded && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Período */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Período</Label>
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

              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Código
                </Label>
                <Input
                  id="code"
                  placeholder="Ex: CT-2024-001"
                  value={filters.code || ""}
                  onChange={(e) => updateFilter("code", e.target.value)}
                />
              </div>

              {/* Moeda */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Moeda
                </Label>
                <Input
                  id="currency"
                  placeholder="Ex: BRL, USD, EUR"
                  value={filters.currency || ""}
                  onChange={(e) => updateFilter("currency", e.target.value)}
                />
              </div>

              {/* Valor */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
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
          </div>
        )}

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
