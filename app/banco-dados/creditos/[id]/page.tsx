"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { mockCredits } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { CreditCard, DollarSign, User, TrendingDown, ArrowLeft } from "lucide-react"

interface CreditDetailsPageProps {
  params: {
    id: string
  }
}

const mockCreditMovements = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    type: "Dedução",
    description: "Pagamento parcial - Parcela 1/12",
    value: -2500,
    balance: 47500,
  },
  {
    id: "2",
    date: new Date("2024-02-15"),
    type: "Dedução",
    description: "Pagamento parcial - Parcela 2/12",
    value: -2500,
    balance: 45000,
  },
  {
    id: "3",
    date: new Date("2024-01-01"),
    type: "Inicial",
    description: "Valor inicial da carta de crédito",
    value: 50000,
    balance: 50000,
  },
]

export default function CreditDetailsPage({ params }: CreditDetailsPageProps) {
  const router = useRouter()
  const credit = mockCredits.find((c) => c.id === params.id)

  if (!credit) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponivel":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Disponível
          </Badge>
        )
      case "comprometido":
        return <Badge variant="secondary">Comprometido</Badge>
      case "vendido":
        return <Badge variant="destructive">Vendido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Ordenar movimentações por data (mais recente primeiro)
  const sortedMovements = [...mockCreditMovements].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Banco de Dados" },
        { label: "Créditos", href: "/banco-dados/creditos" },
        { label: credit.code },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/banco-dados/creditos")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Carta de Crédito</h1>
              <p className="text-muted-foreground">Detalhes da carta de crédito {credit.code}</p>
            </div>
          </div>
          {getStatusBadge(credit.status)}
        </div>

        {/* Informações Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Código</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credit.code}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cedente</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credit.creditor}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(credit.nominalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo GRA</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(credit.saldoGRA)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{credit.origin}</p>
          </CardContent>
        </Card>

        {/* Histórico de Movimentações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={movement.type === "Inicial" ? "default" : "secondary"}>{movement.type}</Badge>
                      <span className="text-sm text-muted-foreground">{formatDate(movement.date)}</span>
                    </div>
                    <p className="font-medium">{movement.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`font-bold ${movement.value > 0 ? "text-green-600" : "text-red-600"}`}>
                      {movement.value > 0 ? "+" : ""}
                      {formatCurrency(Math.abs(movement.value))}
                    </div>
                    <div className="text-sm text-muted-foreground">Saldo: {formatCurrency(movement.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
