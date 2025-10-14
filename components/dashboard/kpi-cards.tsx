"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { FileText, AlertTriangle, Building2, TrendingDown } from "lucide-react"

interface KPICardsProps {
  activeContracts: number
  contractsExpiringThisMonth: number
  totalAssetValue: number
  defaultRate: number
}

export function KPICards({ activeContracts, contractsExpiringThisMonth, totalAssetValue, defaultRate }: KPICardsProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{activeContracts}</div>
          <p className="text-xs text-muted-foreground">contratos em andamento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencendo no Mês</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{contractsExpiringThisMonth}</div>
          <p className="text-xs text-muted-foreground">contratos próximos ao vencimento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Patrimônio Vinculado</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalAssetValue)}</div>
          <p className="text-xs text-muted-foreground">valor total dos ativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatPercentage(defaultRate)}</div>
          <p className="text-xs text-muted-foreground">contas em atraso</p>
        </CardContent>
      </Card>
    </>
  )
}
