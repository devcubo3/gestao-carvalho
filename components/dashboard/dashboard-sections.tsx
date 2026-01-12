import { MonthlyKPICards } from "@/components/dashboard/monthly-kpi-cards"
import { TodayMovementsCards } from "@/components/dashboard/today-movements-cards"
import { ContractTimeline } from "@/components/dashboard/contract-timeline"
import { RecentAdditions } from "@/components/dashboard/recent-additions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"
import {
  getMonthlyKPIs,
  getTodayMovements,
  getRecentContracts,
  getRecentAdditions,
  getBankAccountsSummary,
} from "@/app/actions/dashboard"

export async function BankSummarySection() {
  const bankSummary = await getBankAccountsSummary()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Resumo Bancário</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Contas Bancárias</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(bankSummary.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {bankSummary.totalAccounts} {bankSummary.totalAccounts === 1 ? "conta ativa" : "contas ativas"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export async function MonthlyKPIsSection() {
  const monthlyKPIs = await getMonthlyKPIs()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Mensal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MonthlyKPICards
          monthlyPayables={monthlyKPIs.monthlyPayables}
          monthlyReceivables={monthlyKPIs.monthlyReceivables}
          monthlyBalance={monthlyKPIs.monthlyBalance}
          newContractsThisMonth={monthlyKPIs.newContractsThisMonth}
        />
      </div>
    </div>
  )
}

export async function TodayMovementsSection() {
  const todayData = await getTodayMovements()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Movimentações de Hoje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TodayMovementsCards
          todayPayables={todayData.todayPayables}
          todayReceivables={todayData.todayReceivables}
          todayPayablesCount={todayData.todayPayablesCount}
          todayReceivablesCount={todayData.todayReceivablesCount}
          todayPayablesList={todayData.todayPayablesList}
          todayReceivablesList={todayData.todayReceivablesList}
        />
      </div>
    </div>
  )
}

export async function RecentActivitySection() {
  const [recentContracts, recentAdditions] = await Promise.all([getRecentContracts(), getRecentAdditions()])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-3">Últimos Contratos</h3>
          <ContractTimeline contracts={recentContracts} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-3">Últimas Adições</h3>
          <RecentAdditions additions={recentAdditions} />
        </div>
      </div>
    </div>
  )
}
