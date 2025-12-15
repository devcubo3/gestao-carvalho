import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getCreditById, getCreditMovements } from "@/app/actions/credits"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CreditCard, DollarSign, User, TrendingDown, ArrowLeft } from "lucide-react"

interface CreditDetailsPageProps {
  params: {
    id: string
  }
}

export default async function CreditDetailsPage({ params }: CreditDetailsPageProps) {
  const result = await getCreditById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const credit = result.data
  const movementsResult = await getCreditMovements(params.id)
  const movements = movementsResult.success && movementsResult.data ? movementsResult.data : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Ativo
          </Badge>
        )
      case "quitado":
        return <Badge variant="secondary">Quitado</Badge>
      case "em_atraso":
        return <Badge variant="destructive">Em Atraso</Badge>
      case "cancelado":
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Patrimônio" },
        { label: "Créditos", href: "/banco-dados/creditos" },
        { label: credit.code },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/banco-dados/creditos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Carta de Crédito</h1>
              <p className="text-sm text-muted-foreground">Detalhes da carta de crédito {credit.code}</p>
            </div>
          </div>
          {getStatusBadge(credit.status)}
        </div>

        {/* Informações Principais */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Código
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credit.code}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Cedente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credit.creditor_name || '-'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(credit.nominal_value)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Saldo GRA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(credit.current_balance)}</div>
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
            <CardTitle className="text-lg">Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={movement.movement_type === "credito" ? "default" : "secondary"}
                          className={movement.movement_type === "credito" ? "bg-green-600" : ""}
                        >
                          {movement.movement_type === "credito" ? "Inicial" : "Dedução"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(new Date(movement.movement_date))}
                        </span>
                      </div>
                      <p className="text-sm">{movement.description}</p>
                    </div>
                    <div className="text-right space-y-1 ml-4">
                      <div className={`text-lg font-bold ${movement.movement_type === "credito" ? "text-green-600" : "text-red-600"}`}>
                        {movement.movement_type === "credito" ? "+" : ""}
                        {formatCurrency(movement.value)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Saldo: {formatCurrency(movement.balance_after)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
