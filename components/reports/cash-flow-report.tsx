"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CashFlowReport } from "@/lib/types"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface CashFlowReportProps {
  data: CashFlowReport
}

export function CashFlowReportView({ data }: CashFlowReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fluxo de Caixa - Previsto x Realizado
          </CardTitle>
          <CardDescription>
            Período: {new Date(data.period.startDate).toLocaleDateString('pt-BR')} até{' '}
            {new Date(data.period.endDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Realizado */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Realizado</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Entradas</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.realized.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Saídas</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.realized.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold">Saldo</span>
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
              <h3 className="font-semibold text-lg">Previsto</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Entradas</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.forecast.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Saídas</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.forecast.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold">Saldo</span>
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
