"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { CashTransactionsTable } from "@/components/financial/cash-transactions-table"
import { CashSummaryCards } from "@/components/financial/cash-summary-cards"
import { CashFilters, type CashFilters as CashFiltersType } from "@/components/financial/cash-filters"
import { CreateTransactionModal } from "@/components/financial/create-transaction-modal"
import { ManageBankAccountsModal } from "@/components/financial/manage-bank-accounts-modal"
import { Button } from "@/components/ui/button"
import { Calculator, Calendar, Building2 } from "lucide-react"
import Link from "next/link"
import { getCashTransactions, getBankAccounts, getUserPermissions } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import type { CashTransaction, BankAccount } from "@/lib/types"

export default function CashPage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<CashFiltersType>({ dateTo: new Date() })
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isManageAccountsModalOpen, setIsManageAccountsModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const checkPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setIsAdmin(result.data.role === 'admin')
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    
    // Converter filtros de Date para string no formato YYYY-MM-DD
    const apiFilters: any = {}
    
    if (filters.dateFrom) {
      apiFilters.dateFrom = filters.dateFrom.toISOString().split('T')[0]
      console.log('Date From:', apiFilters.dateFrom)
    }
    if (filters.dateTo) {
      apiFilters.dateTo = filters.dateTo.toISOString().split('T')[0]
      console.log('Date To:', apiFilters.dateTo)
    }
    if (filters.type) {
      apiFilters.type = filters.type
    }
    if (filters.vinculo) {
      apiFilters.vinculo = filters.vinculo
    }
    if (filters.forma) {
      apiFilters.forma = filters.forma
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
    
    console.log('Filters being sent to API:', apiFilters)
    
    const [transactionsResult, accountsResult] = await Promise.all([
      getCashTransactions(apiFilters),
      getBankAccounts(),
    ])

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data || [])
    } else {
      toast({
        title: "Erro",
        description: transactionsResult.error,
        variant: "destructive",
      })
    }

    if (accountsResult.success) {
      setAccounts(accountsResult.data || [])
    }

    setIsLoading(false)
  }

  const handleFiltersChange = (newFilters: CashFiltersType) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    loadData()
  }

  const handleClearFilters = () => {
    setFilters({})
    setRefreshKey(prev => prev + 1)
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
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
            {isAdmin && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-transparent"
                onClick={() => setIsManageAccountsModalOpen(true)}
              >
                <Building2 className="h-4 w-4" />
                Gerenciar Contas
              </Button>
            )}
            <Link href="/financeiro/caixa/dia">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Caixa do Dia
              </Button>
            </Link>
          </div>
        </div>

        {!isLoading && <CashSummaryCards transactions={transactions} />}

        <CashFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <CashTransactionsTable 
          transactions={transactions}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onTransactionDeleted={handleSuccess}
        />
      </div>

      <CreateTransactionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        accounts={accounts}
        onSuccess={handleSuccess}
      />

      <ManageBankAccountsModal
        open={isManageAccountsModalOpen}
        onOpenChange={setIsManageAccountsModalOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
