"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight, Calendar, Clock } from "lucide-react"

interface FinancialSummaryCardsProps {
  receivablesToday: number
  receivablesThisWeek: number
  payablesToday: number
  payablesThisWeek: number
  receivablesList: Array<{
    id: string
    description: string
    value: number
    counterparty: string
  }>
  payablesList: Array<{
    id: string
    description: string
    value: number
    counterparty: string
  }>
}

export function FinancialSummaryCards({
  receivablesToday,
  receivablesThisWeek,
  payablesToday,
  payablesThisWeek,
  receivablesList,
  payablesList,
}: FinancialSummaryCardsProps) {
  return (
    <>
      {/* Contas a Receber */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">A Receber</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hoje</span>
              <span className="font-semibold text-green-600">{formatCurrency(receivablesToday)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Esta semana</span>
              <span className="font-semibold text-green-600">{formatCurrency(receivablesThisWeek)}</span>
            </div>
          </div>

          {receivablesList.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Próximos vencimentos:</p>
              {receivablesList.slice(0, 2).map((item) => (
                <div key={item.id} className="text-xs space-y-1">
                  <p className="font-medium truncate">{item.description}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{item.counterparty}</span>
                    <span className="font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
            <Link href="/financeiro/contas-receber">
              Ver detalhes <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">A Pagar</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hoje</span>
              <span className="font-semibold text-red-600">{formatCurrency(payablesToday)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Esta semana</span>
              <span className="font-semibold text-red-600">{formatCurrency(payablesThisWeek)}</span>
            </div>
          </div>

          {payablesList.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Próximos vencimentos:</p>
              {payablesList.slice(0, 2).map((item) => (
                <div key={item.id} className="text-xs space-y-1">
                  <p className="font-medium truncate">{item.description}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{item.counterparty}</span>
                    <span className="font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
            <Link href="/financeiro/contas-pagar">
              Ver detalhes <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
