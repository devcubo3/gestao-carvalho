"use client"
import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { CashTransactionsTable } from "@/components/financial/cash-transactions-table"
import { CashSummaryCards } from "@/components/financial/cash-summary-cards"
import { CashFilters, type CashFilters as CashFiltersType } from "@/components/financial/cash-filters"
import { Button } from "@/components/ui/button"
import { mockCashTransactions } from "@/lib/mock-data"
import { Calculator } from "lucide-react"
import { Calendar } from "lucide-react"
import Link from "next/link"

export default function CashPage() {
  const [filters, setFilters] = useState<CashFiltersType>({})
  const [filteredTransactions, setFilteredTransactions] = useState(mockCashTransactions)

  const handleFiltersChange = (newFilters: CashFiltersType) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    let filtered = mockCashTransactions

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((transaction) => new Date(transaction.date) >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter((transaction) => new Date(transaction.date) <= filters.dateTo!)
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter((transaction) => transaction.type === filters.type)
    }

    // Apply vinculo filter
    if (filters.vinculo) {
      filtered = filtered.filter((transaction) => transaction.vinculo === filters.vinculo)
    }

    // Apply forma filter
    if (filters.forma) {
      filtered = filtered.filter((transaction) => transaction.forma === filters.forma)
    }

    // Apply centro de custo filter
    if (filters.centroCusto) {
      filtered = filtered.filter((transaction) => transaction.centroCusto === filters.centroCusto)
    }

    // Apply description filter
    if (filters.description) {
      filtered = filtered.filter((transaction) =>
        transaction.description.toLowerCase().includes(filters.description!.toLowerCase()),
      )
    }

    // Apply value filters
    if (filters.valueMin) {
      filtered = filtered.filter((transaction) => transaction.value >= filters.valueMin!)
    }
    if (filters.valueMax) {
      filtered = filtered.filter((transaction) => transaction.value <= filters.valueMax!)
    }

    setFilteredTransactions(filtered)
  }

  const handleClearFilters = () => {
    setFilters({})
    setFilteredTransactions(mockCashTransactions)
  }

  const handleCashClosing = () => {
    console.log("Fechamento de Caixa clicked")
    // TODO: Implement cash closing functionality
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Caixa" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Caixa</h1>
            <p className="text-muted-foreground">Controle de movimentações financeiras efetivadas</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/financeiro/caixa/dia">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Caixa do Dia
              </Button>
            </Link>
            <Link href="/financeiro/caixa/fechamento">
              <Button className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Fechamento de Caixa
              </Button>
            </Link>
          </div>
        </div>

        <CashSummaryCards transactions={filteredTransactions} />

        <CashFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <CashTransactionsTable transactions={filteredTransactions} />
      </div>
    </MainLayout>
  )
}
