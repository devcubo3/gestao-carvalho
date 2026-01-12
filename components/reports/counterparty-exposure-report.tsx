"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CounterpartyExposureReport } from "@/lib/types"
import { Users, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CounterpartyExposureReportProps {
  data: CounterpartyExposureReport
}

export function CounterpartyExposureReportView({ data }: CounterpartyExposureReportProps) {
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.summary.totalReceivables)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(data.summary.totalPayables)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contas a Receber */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contas a Receber por Contraparte
          </CardTitle>
          <CardDescription>
            {data.receivables.length} contraparte(s) com valores a receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.receivables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conta a receber encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {data.receivables.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(item.totalReceivable || 0)}
                    </p>
                    {item.overdueReceivable && item.overdueReceivable > 0 && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <p className="text-sm text-red-500">
                          {formatCurrency(item.overdueReceivable)} vencido
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contas a Pagar por Vínculo
          </CardTitle>
          <CardDescription>
            {data.payables.length} vínculo(s) com valores a pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.payables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conta a pagar encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {data.payables.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(item.totalPayable || 0)}
                    </p>
                    {item.overduePayable && item.overduePayable > 0 && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <p className="text-sm text-red-500">
                          {formatCurrency(item.overduePayable)} vencido
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
