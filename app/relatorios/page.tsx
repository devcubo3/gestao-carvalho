import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, TrendingUp, Building2 } from "lucide-react"
import Link from "next/link"
import { getReportMetadata } from "@/app/actions/reports"

export default async function RelatoriosPage() {
  const metadata = await getReportMetadata()

  const reports = [
    {
      id: "fluxo-caixa",
      title: "Fluxo de Caixa",
      description: "Relatório de entradas e saídas por período (previsto x realizado)",
      category: "Financeiro",
      icon: TrendingUp,
    },
    {
      id: "exposicao-contraparte",
      title: "Exposição por Contraparte",
      description: "Quanto cada pessoa/empresa tem a pagar/receber",
      category: "Financeiro",
      icon: TrendingUp,
    },
    {
      id: "composicao-patrimonio",
      title: "Composição por Tipo de Patrimônio",
      description: "Distribuição de imóveis, veículos, créditos e empreendimentos",
      category: "Patrimônio",
      icon: Building2,
    },
    {
      id: "inadimplencia",
      title: "Inadimplência",
      description: "Relatório de contas em atraso e taxa de inadimplência",
      category: "Financeiro",
      icon: TrendingUp,
    },
    {
      id: "participacoes",
      title: "Participações por Envolvido",
      description: "Percentual de participação de cada parte nos contratos",
      category: "Contratos",
      icon: FileText,
    },
  ]

  return (
    <MainLayout breadcrumbs={[{ label: "Relatórios" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios consolidados por contratos, patrimônio, finanças e participações
          </p>
        </div>

        {/* Grid de Relatórios */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <Badge variant="secondary" className="text-xs">
                        {report.category}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="text-sm">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" asChild className="flex-1">
                      <Link href={`/relatorios/${report.id}`}>
                        Visualizar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}
