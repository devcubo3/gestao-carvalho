"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { AssetCompositionReport } from "@/lib/types"
import { Building2, PieChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AssetCompositionReportProps {
  data: AssetCompositionReport
}

export function AssetCompositionReportView({ data }: AssetCompositionReportProps) {
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 no-print" />
              Total de Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold print:text-2xl">{data.summary.totalAssets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5 no-print" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 print:text-2xl">
              {formatCurrency(data.summary.totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por Tipo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Composição do Patrimônio</CardTitle>
          <CardDescription className="no-print">
            Distribuição por tipo de ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.breakdown.length === 0 || data.summary.totalAssets === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum ativo cadastrado
            </p>
          ) : (
            <div className="space-y-4 print:space-y-3">
              {data.breakdown.map((item, index) => (
                <div key={index} className="space-y-2 print:space-y-1 print:pb-2 print:border-b print:border-gray-300 last:print:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 print:gap-2">
                        <h3 className="font-semibold text-lg print:text-base">{item.type}</h3>
                        <Badge variant="secondary" className="print:border print:border-gray-400 print:bg-white print:text-black">
                          {item.count} {item.count === 1 ? 'item' : 'itens'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 print:text-xs print:text-gray-700">
                        {item.percentage.toFixed(1)}% do total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 print:text-base print:text-black">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra de progresso - visível apenas na tela */}
                  <div className="w-full bg-gray-200 rounded-full h-2 no-print">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* Barra de progresso para impressão - simplificada */}
                  <div className="hidden print:block w-full border-t-2 border-gray-400 relative" style={{ borderWidth: '3px' }}>
                    <div 
                      className="absolute top-0 left-0 border-t-2 border-black"
                      style={{ width: `${item.percentage}%`, borderWidth: '3px' }}
                    />
                  </div>

                  {/* Status breakdown */}
                  {item.count > 0 && (
                    <div className="flex gap-4 text-sm text-muted-foreground pl-4 print:gap-3 print:text-xs print:text-gray-700 print:pl-0">
                      <span>Disponível: {item.byStatus.disponivel}</span>
                      <span>Comprometido: {item.byStatus.comprometido}</span>
                      <span>Vendido: {item.byStatus.vendido}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
