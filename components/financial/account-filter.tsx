"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X } from "lucide-react"
import { useCategories } from "@/hooks/use-categories"
import type { AccountFilterType } from "@/lib/types"

interface AccountFilterProps {
  onFilter: (filters: AccountFilterType) => void
  onClear: () => void
}

export function AccountFilter({ onFilter, onClear }: AccountFilterProps) {
  const { categories: vinculos } = useCategories('vinculo')
  const { categories: centrosCusto } = useCategories('centro_custo')
  const [filters, setFilters] = useState<AccountFilterType>({})

  const handleFilterChange = (key: keyof AccountFilterType, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilter(filters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onClear()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros de Busca
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              placeholder="Ex: PAG-0001"
              value={filters.codigo || ""}
              onChange={(e) => handleFilterChange("codigo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vencimento-inicial">Vencimento Inicial</Label>
            <Input
              id="vencimento-inicial"
              type="date"
              value={filters.vencimentoInicial?.toISOString().split("T")[0] || ""}
              onChange={(e) =>
                handleFilterChange("vencimentoInicial", e.target.value ? new Date(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vencimento-final">Vencimento Final</Label>
            <Input
              id="vencimento-final"
              type="date"
              value={filters.vencimentoFinal?.toISOString().split("T")[0] || ""}
              onChange={(e) =>
                handleFilterChange("vencimentoFinal", e.target.value ? new Date(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vinculo">Vínculo</Label>
            <Select value={filters.vinculo || ""} onValueChange={(value) => handleFilterChange("vinculo", value)}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="centro-custo">Centro de Custo</Label>
            <Select
              value={filters.centroCusto || ""}
              onValueChange={(value) => handleFilterChange("centroCusto", value)}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Buscar na descrição"
              value={filters.descricao || ""}
              onChange={(e) => handleFilterChange("descricao", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor-inicial">Valor Inicial (R$)</Label>
            <Input
              id="valor-inicial"
              type="number"
              placeholder="0,00"
              value={filters.valorInicial || ""}
              onChange={(e) =>
                handleFilterChange("valorInicial", e.target.value ? Number.parseFloat(e.target.value) : undefined)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor-final">Valor Final (R$)</Label>
            <Input
              id="valor-final"
              type="number"
              placeholder="0,00"
              value={filters.valorFinal || ""}
              onChange={(e) =>
                handleFilterChange("valorFinal", e.target.value ? Number.parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
