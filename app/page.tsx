import { Suspense } from "react"
import { MainLayout } from "@/components/main-layout"
import { QuickActions } from "@/components/dashboard/quick-actions"
import {
  BankSummarySection,
  MonthlyKPIsSection,
  TodayMovementsSection,
  RecentActivitySection,
} from "@/components/dashboard/dashboard-sections"
import {
  BankSummarySkeleton,
  MonthlyKPIsSkeleton,
  TodayMovementsSkeleton,
  RecentActivitySkeleton,
} from "@/components/dashboard/loading-skeletons"

export default async function HomePage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Início" }]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de gestão de patrimônio</p>
        </div>

        {/* Resumo Bancário */}
        <Suspense fallback={<BankSummarySkeleton />}>
          <BankSummarySection />
        </Suspense>

        {/* Visão Mensal */}
        <Suspense fallback={<MonthlyKPIsSkeleton />}>
          <MonthlyKPIsSection />
        </Suspense>

        {/* Movimentações de Hoje */}
        <Suspense fallback={<TodayMovementsSkeleton />}>
          <TodayMovementsSection />
        </Suspense>

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <QuickActions />
        </div>

        {/* Atividade Recente */}
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivitySection />
        </Suspense>
      </div>
    </MainLayout>
  )
}
