"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import type { CashFlowReport } from "@/lib/types"
import { TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface CashFlowReportProps {
  data: CashFlowReport
  reportId: string
}

export function CashFlowReportView({ data, reportId }: CashFlowReportProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') || data.period.startDate
  )
  const [endDate, setEndDate] = useState(
    searchParams.get('endDate') || data.period.endDate
  )

  const handleFilterApply = () => {
    const params = new URLSearchParams()
    params.set('startDate', startDate)
    params.set('endDate', endDate)
    router.push(`/relatorios/${reportId}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar Período
          </CardTitle>
          <CardDescription>
            Selecione o período para visualizar o fluxo de caixa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilterApply} className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado do Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fluxo de Caixa - Previsto x Realizado
          </CardTitle>
          <CardDescription>
            Período: {data.period.startDate.split('-').reverse().join('/')} até{' '}
            {data.period.endDate.split('-').reverse().join('/')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Realizado */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Realizado</h3>
                <p className="text-sm text-muted-foreground">
                  Pagamentos e recebimentos efetivados
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="block font-medium">Recebimentos</span>
                      <span className="text-xs text-muted-foreground">Valores quitados</span>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.realized.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <div>
                      <span className="block font-medium">Pagamentos</span>
                      <span className="text-xs text-muted-foreground">Valores quitados</span>
                    </div>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.realized.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-semibold">Saldo Realizado</span>
                  <span className={`font-bold ${
                    data.realized.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.realized.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Previsto */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Previsto</h3>
                <p className="text-sm text-muted-foreground">
                  Contas agendadas para o período
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="block font-medium">A Receber</span>
                      <span className="text-xs text-muted-foreground">Valores pendentes</span>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.forecast.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <div>
                      <span className="block font-medium">A Pagar</span>
                      <span className="text-xs text-muted-foreground">Valores pendentes</span>
                    </div>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.forecast.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="font-semibold">Saldo Previsto</span>
                  <span className={`font-bold ${
                    data.forecast.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.forecast.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
