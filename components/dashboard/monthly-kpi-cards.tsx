"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react"

interface MonthlyKPICardsProps {
  monthlyPayables: number
  monthlyReceivables: number
  monthlyBalance: number
  newContractsThisMonth: number
}

export function MonthlyKPICards({
  monthlyPayables,
  monthlyReceivables,
  monthlyBalance,
  newContractsThisMonth,
}: MonthlyKPICardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor a Pagar no Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyPayables)}</div>
          <p className="text-xs text-muted-foreground">contas a pagar este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor a Receber no Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyReceivables)}</div>
          <p className="text-xs text-muted-foreground">contas a receber este mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Financeiro no Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? "text-green-600" : "text-destructive"}`}>
            {formatCurrency(monthlyBalance)}
          </div>
          <p className="text-xs text-muted-foreground">saldo previsto para o mês</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Novos Contratos no Mês</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{newContractsThisMonth}</div>
          <p className="text-xs text-muted-foreground">contratos criados este mês</p>
        </CardContent>
      </Card>
    </>
  )
}
