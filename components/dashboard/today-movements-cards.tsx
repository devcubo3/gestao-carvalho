"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface MovementItem {
  id: string
  description: string
  value: number
  counterparty: string
  dueDate: string
}

interface TodayMovementsCardsProps {
  todayPayables: number
  todayReceivables: number
  todayPayablesCount: number
  todayReceivablesCount: number
  todayPayablesList: MovementItem[]
  todayReceivablesList: MovementItem[]
}

export function TodayMovementsCards({
  todayPayables,
  todayReceivables,
  todayPayablesCount,
  todayReceivablesCount,
  todayPayablesList,
  todayReceivablesList,
}: TodayMovementsCardsProps) {
  const router = useRouter()

  return (
    <>
      <div className="space-y-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/financeiro/contas-pagar")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar Hoje</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(todayPayables)}</div>
            <p className="text-xs text-muted-foreground">
              {todayPayablesCount} {todayPayablesCount === 1 ? "lançamento" : "lançamentos"} para hoje
            </p>
          </CardContent>
        </Card>

        {/* Lista de preview dos lançamentos a pagar */}
        {todayPayablesList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayPayablesList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.counterparty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-destructive">{formatCurrency(item.value)}</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.push("/financeiro/contas-pagar")}
              >
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/financeiro/contas-receber")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(todayReceivables)}</div>
            <p className="text-xs text-muted-foreground">
              {todayReceivablesCount} {todayReceivablesCount === 1 ? "lançamento" : "lançamentos"} para hoje
            </p>
          </CardContent>
        </Card>

        {/* Lista de preview dos lançamentos a receber */}
        {todayReceivablesList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Próximos Recebimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayReceivablesList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.counterparty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{formatCurrency(item.value)}</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.push("/financeiro/contas-receber")}
              >
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
