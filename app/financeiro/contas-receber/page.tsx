"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { AccountsReceivableTable } from "@/components/financial/accounts-receivable-table"
import { ReceivablesSummaryCards } from "@/components/financial/receivables-summary-cards"
import {
  AccountsReceivableFilters,
  type AccountsReceivableFilters as FiltersType,
} from "@/components/financial/accounts-receivable-filters"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAccountsReceivable } from "@/app/actions/receivables"
import type { AccountReceivable } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AccountsReceivablePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState<FiltersType>({})
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    setIsLoading(true)

    // Converter filtros de Date para string
    const apiFilters: any = {}
    if (filters.dateFrom) {
      apiFilters.dateFrom = filters.dateFrom.toISOString().split('T')[0]
    }
    if (filters.dateTo) {
      apiFilters.dateTo = filters.dateTo.toISOString().split('T')[0]
    }
    if (filters.code) apiFilters.code = filters.code
    if (filters.status && filters.status !== '_all') apiFilters.status = filters.status
    if (filters.vinculo) apiFilters.vinculo = filters.vinculo
    if (filters.centroCusto) apiFilters.centroCusto = filters.centroCusto
    if (filters.description) apiFilters.description = filters.description
    if (filters.valueMin) apiFilters.valueMin = filters.valueMin
    if (filters.valueMax) apiFilters.valueMax = filters.valueMax

    const result = await getAccountsReceivable(apiFilters)

    if (result.success) {
      setAccounts(result.data || [])
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setRefreshKey(prev => prev + 1)
  }

  const handleApplyFilters = () => {
    loadData()
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Contas a Receber" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground">Gerencie valores a receber de contratos e operações</p>
          </div>
          <Button onClick={() => router.push("/financeiro/contas-receber/lote")} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recebimento em lote
          </Button>
        </div>

        {!isLoading && <ReceivablesSummaryCards accounts={accounts} />}

        <AccountsReceivableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <AccountsReceivableTable accounts={accounts} onSuccess={handleSuccess} />
      </div>
    </MainLayout>
  )
}
