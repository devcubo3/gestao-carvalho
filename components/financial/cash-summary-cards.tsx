"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type { CashTransaction } from "@/lib/types"

interface CashSummaryCardsProps {
  transactions: CashTransaction[]
}

export function CashSummaryCards({ transactions }: CashSummaryCardsProps) {
  const currentBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0

  const totalIncome = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)

  const totalExpenses = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(currentBalance)}</div>
          <p className="text-xs text-muted-foreground">saldo em caixa</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">recebimentos efetivados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">pagamentos efetivados</p>
        </CardContent>
      </Card>
    </div>
  )
}
