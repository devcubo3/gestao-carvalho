"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface CashSummaryCardProps {
  balance: number
  todayIncome: number
  todayExpenses: number
  onCloseCash: () => void
}

export function CashSummaryCard({ balance, todayIncome, todayExpenses, onCloseCash }: CashSummaryCardProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Resumo de Caixa - Hoje</CardTitle>
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Entradas</p>
            </div>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(todayIncome)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Saídas</p>
            </div>
            <p className="text-xl font-semibold text-red-600">{formatCurrency(todayExpenses)}</p>
          </div>
        </div>
        <div className="flex justify-center pt-2">
          <Button onClick={onCloseCash} variant="outline" className="w-full max-w-xs bg-transparent">
            Fechar Caixa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
