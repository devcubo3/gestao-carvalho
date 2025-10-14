"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { AccountsReceivableTable } from "@/components/financial/accounts-receivable-table"
import { ReceivablesSummaryCards } from "@/components/financial/receivables-summary-cards"
import {
  AccountsReceivableFilters,
  type AccountsReceivableFilters as FiltersType,
} from "@/components/financial/accounts-receivable-filters"
import { Button } from "@/components/ui/button"
import { mockAccountsReceivable } from "@/lib/mock-data"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AccountsReceivablePage() {
  const router = useRouter()
  const [filters, setFilters] = useState<FiltersType>({})
  const [filteredAccounts, setFilteredAccounts] = useState(mockAccountsReceivable)

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setFilteredAccounts(mockAccountsReceivable)
  }

  const handleApplyFilters = () => {
    let filtered = mockAccountsReceivable

    if (filters.dateFrom) {
      filtered = filtered.filter((account) => new Date(account.dueDate) >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      filtered = filtered.filter((account) => new Date(account.dueDate) <= filters.dateTo!)
    }

    if (filters.code) {
      filtered = filtered.filter((account) => account.code.toLowerCase().includes(filters.code!.toLowerCase()))
    }

    if (filters.vinculo) {
      filtered = filtered.filter((account) => account.vinculo === filters.vinculo)
    }

    if (filters.centroCusto) {
      filtered = filtered.filter((account) => account.centroCusto === filters.centroCusto)
    }

    if (filters.description) {
      filtered = filtered.filter((account) =>
        account.description.toLowerCase().includes(filters.description!.toLowerCase()),
      )
    }

    if (filters.valueMin) {
      filtered = filtered.filter((account) => account.value >= filters.valueMin!)
    }

    if (filters.valueMax) {
      filtered = filtered.filter((account) => account.value <= filters.valueMax!)
    }

    setFilteredAccounts(filtered)
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

        <ReceivablesSummaryCards accounts={filteredAccounts} />

        <AccountsReceivableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <AccountsReceivableTable accounts={filteredAccounts} />
      </div>
    </MainLayout>
  )
}
