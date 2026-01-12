"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowRight, FileText } from "lucide-react"
import type { DashboardContract } from "@/lib/types"

interface ContractTimelineProps {
  contracts: DashboardContract[]
}

export function ContractTimeline({ contracts }: ContractTimelineProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Últimos Contratos</CardTitle>
        <FileText className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {contracts.length > 0 ? (
          <>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center space-x-4 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contract.code}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          contract.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : contract.status === "rascunho"
                              ? "bg-yellow-100 text-yellow-700"
                              : contract.status === "concluido"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {contract.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contract.parties.sideA[0]?.name || "Sem parte A"} ↔{" "}
                      {contract.parties.sideB[0]?.name || "Sem parte B"}
                    </p>
                    <p className="text-xs text-muted-foreground">Atualizado em {formatDate(contract.updatedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary text-lg">
                      {formatCurrency(Math.max(contract.sideATotal, contract.sideBTotal))}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/contratos">
                Ver todos os contratos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhum contrato encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/contratos/novo">Criar primeiro contrato</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
