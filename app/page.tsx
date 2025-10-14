import { MainLayout } from "@/components/main-layout"
import { MonthlyKPICards } from "@/components/dashboard/monthly-kpi-cards"
import { TodayMovementsCards } from "@/components/dashboard/today-movements-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ContractTimeline } from "@/components/dashboard/contract-timeline"
import { RecentAdditions } from "@/components/dashboard/recent-additions"
import { getMonthlyKPIs, getTodayMovements, getTodayMovementsList } from "@/lib/dashboard-data"
import { mockContracts } from "@/lib/mock-data"

export default function HomePage() {
  const monthlyKPIs = getMonthlyKPIs()
  const todayMovements = getTodayMovements()
  const todayMovementsList = getTodayMovementsList()

  return (
    <MainLayout breadcrumbs={[{ label: "Início" }]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão de patrimônio</p>
        </div>

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

        <div>
          <h2 className="text-xl font-semibold mb-4">Movimentações de Hoje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodayMovementsCards
              todayPayables={todayMovements.todayPayables}
              todayReceivables={todayMovements.todayReceivables}
              todayPayablesCount={todayMovements.todayPayablesCount}
              todayReceivablesCount={todayMovements.todayReceivablesCount}
              todayPayablesList={todayMovementsList.todayPayablesList}
              todayReceivablesList={todayMovementsList.todayReceivablesList}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <QuickActions />
        </div>

        {/* Atividade Recente */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-3">Últimos Lançamentos</h3>
              <ContractTimeline contracts={mockContracts} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Últimas Adições</h3>
              <RecentAdditions />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
