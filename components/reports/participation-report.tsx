"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { ParticipationReport } from "@/lib/types"
import { Users, FileText, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ParticipationReportProps {
  data: ParticipationReport
}

export function ParticipationReportView({ data }: ParticipationReportProps) {
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.summary.totalParticipants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.summary.totalContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
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

      {/* Lista de Participantes */}
      <Card>
        <CardHeader>
          <CardTitle>Participantes por Envolvimento</CardTitle>
          <CardDescription>
            Detalhamento de participações em contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum participante encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {data.participants.map((participant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{participant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {participant.document}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {participant.contractsCount} {participant.contractsCount === 1 ? 'contrato' : 'contratos'}
                        </Badge>
                        <Badge variant="outline">
                          GRA: {participant.graPercentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(participant.totalValue)}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown Lado A / Lado B */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Lado A (Recebe)</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(participant.sideATotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lado B (Entrega)</p>
                      <p className="font-semibold text-red-600">
                        {formatCurrency(participant.sideBTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Contratos */}
                  {participant.contracts.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold mb-2">Contratos:</p>
                      <div className="space-y-1">
                        {participant.contracts.map((contract, cIndex) => (
                          <div key={cIndex} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Lado {contract.side}
                              </Badge>
                              <span>{contract.code}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatCurrency(contract.value)}
                            </span>
                          </div>
                        ))}
                      </div>
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
