"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { AccountsPayableTable } from "@/components/financial/accounts-payable-table"
import { PayablesSummaryCards } from "@/components/financial/payables-summary-cards"
import {
  AccountsPayableFilters,
  type AccountsPayableFilters as FiltersType,
} from "@/components/financial/accounts-payable-filters"
import { Button } from "@/components/ui/button"
import { getAccountsPayable } from "@/app/actions/payables"
import type { AccountPayable } from "@/lib/types"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function AccountsPayablePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState<FiltersType>({})
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
  const [loading, setLoading] = useState(true)

  const loadAccounts = async () => {
    setLoading(true)
    try {
      // Preparar filtros para API
      const apiFilters: any = {}

      if (filters.dateFrom) {
        apiFilters.dateFrom = filters.dateFrom.toISOString().split('T')[0]
      }
      if (filters.dateTo) {
        apiFilters.dateTo = filters.dateTo.toISOString().split('T')[0]
      }
      if (filters.status && filters.status !== '_all') {
        apiFilters.status = filters.status
      }
      if (filters.code) {
        apiFilters.code = filters.code
      }
      if (filters.vinculo) {
        apiFilters.vinculo = filters.vinculo
      }
      if (filters.centroCusto) {
        apiFilters.centroCusto = filters.centroCusto
      }
      if (filters.description) {
        apiFilters.description = filters.description
      }
      if (filters.valueMin) {
        apiFilters.valueMin = filters.valueMin
      }
      if (filters.valueMax) {
        apiFilters.valueMax = filters.valueMax
      }

      const result = await getAccountsPayable(apiFilters)

      if (result.success) {
        setAccounts(result.data || [])
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao carregar contas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar contas:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar contas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handleApplyFilters = () => {
    loadAccounts()
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Contas a Pagar" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie valores a pagar de contratos e despesas</p>
          </div>
          <Button onClick={() => router.push("/financeiro/contas-pagar/lote")} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pagamentos
          </Button>
        </div>

        <PayablesSummaryCards accounts={accounts} />

        <AccountsPayableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <AccountsPayableTable accounts={accounts} loading={loading} onRefresh={loadAccounts} />
      </div>
    </MainLayout>
  )
}
