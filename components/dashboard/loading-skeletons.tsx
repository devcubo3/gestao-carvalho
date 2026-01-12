import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MonthlyKPIsSkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Mensal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[160px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function BankSummarySkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Resumo Bancário</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[120px] mb-2" />
            <Skeleton className="h-3 w-[100px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TodayMovementsSkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Movimentações de Hoje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <Card>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-[160px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px] mb-2" />
                <Skeleton className="h-3 w-[140px]" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecentActivitySkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-3">Últimos Contratos</h3>
          <Card>
            <CardHeader className="space-y-0 pb-4">
              <Skeleton className="h-5 w-[140px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-3 w-[180px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                  <Skeleton className="h-10 w-[80px]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-3">Últimas Adições</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
