import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { getDevelopmentById } from "@/app/actions/developments"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Building2, Home, MapPin, Grid3x3, ArrowLeft } from "lucide-react"

interface DevelopmentDetailsPageProps {
  params: {
    id: string
  }
}

export default async function DevelopmentDetailsPage({ params }: DevelopmentDetailsPageProps) {
  const development = await getDevelopmentById(params.id)
  
  if (!development) {
    notFound()
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      predio: "Prédio",
      loteamento: "Loteamento",
      chacaramento: "Chacaramento",
      condominio: "Condomínio",
      comercial: "Comercial",
    }
    return labels[type] || type
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
        return <Badge variant="outline">Vendido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const fullAddress = [
    development.street,
    development.number,
    development.complement,
    development.neighborhood,
    `${development.city} - ${development.state}`,
    development.zip_code,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Patrimônio" },
        { label: "Empreendimentos", href: "/banco-dados/empreendimentos" },
        { label: development.code },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/banco-dados/empreendimentos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Empreendimento</h1>
              <p className="text-sm text-muted-foreground">
                Detalhes do empreendimento {development.code}
              </p>
            </div>
          </div>
          {getStatusBadge(development.status)}
        </div>

        {/* Informações Principais */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Código
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{development.code}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Home className="h-4 w-4" />
                Nome
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{development.name}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Cidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {development.city} - {development.state}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Total de Unidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {development.total_units || "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Detalhadas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Empreendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-lg font-medium">{getTypeLabel(development.type)}</p>
              </div>

              {development.reference_value && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor de Referência
                  </p>
                  <p className="text-lg font-medium">
                    {formatCurrency(development.reference_value)}
                  </p>
                </div>
              )}

              {development.participation_percentage !== null && development.participation_percentage !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Participação
                  </p>
                  <p className="text-lg font-medium">
                    {development.participation_percentage}%
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(development.status)}</div>
              </div>
            </div>

            {fullAddress && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Endereço Completo
                </p>
                <p className="text-base">{fullAddress}</p>
              </div>
            )}

            {development.notes && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Observações
                </p>
                <p className="text-base text-muted-foreground">{development.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
