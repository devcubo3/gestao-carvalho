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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Total de Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.summary.totalAssets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.summary.totalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Composição do Patrimônio</CardTitle>
          <CardDescription>
            Distribuição por tipo de ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.breakdown.length === 0 || data.summary.totalAssets === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum ativo cadastrado
            </p>
          ) : (
            <div className="space-y-4">
              {data.breakdown.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{item.type}</h3>
                        <Badge variant="secondary">
                          {item.count} {item.count === 1 ? 'item' : 'itens'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.percentage.toFixed(1)}% do total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* Status breakdown */}
                  {item.count > 0 && (
                    <div className="flex gap-4 text-sm text-muted-foreground pl-4">
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
