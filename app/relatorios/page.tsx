"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar, TrendingUp, Building2, Users } from "lucide-react"

export default function RelatoriosPage() {
  const reports = [
    {
      id: 1,
      title: "Fluxo de Caixa",
      description: "Relatório de entradas e saídas por período (previsto x realizado)",
      category: "Financeiro",
      lastGenerated: "2024-01-15",
      status: "Atualizado",
    },
    {
      id: 2,
      title: "Exposição por Contraparte",
      description: "Quanto cada pessoa/empresa tem a pagar/receber",
      category: "Financeiro",
      lastGenerated: "2024-01-14",
      status: "Atualizado",
    },
    {
      id: 3,
      title: "Composição por Tipo de Patrimônio",
      description: "Distribuição de imóveis, veículos, créditos e empreendimentos",
      category: "Patrimônio",
      lastGenerated: "2024-01-13",
      status: "Desatualizado",
    },
    {
      id: 5,
      title: "Inadimplência",
      description: "Relatório de contas em atraso e taxa de inadimplência",
      category: "Financeiro",
      lastGenerated: "2024-01-12",
      status: "Desatualizado",
    },
    {
      id: 6,
      title: "Participações por Envolvido",
      description: "Percentual de participação de cada parte nos contratos",
      category: "Contratos",
      lastGenerated: "2024-01-14",
      status: "Atualizado",
    },
  ]

  const handleGenerateReport = (reportId: number) => {
    console.log(`Gerando relatório ${reportId}`)
    // Mock toast notification
  }

  const handleExportReport = (reportId: number, format: string) => {
    console.log(`Exportando relatório ${reportId} em ${format}`)
    // Mock download
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Financeiro":
        return <TrendingUp className="h-4 w-4" />
      case "Patrimônio":
        return <Building2 className="h-4 w-4" />
      case "Contratos":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Relatórios" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios consolidados por contratos, patrimônio, finanças e participações
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios Disponíveis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atualizados Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.filter((r) => r.lastGenerated === "2024-01-15").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(report.category)}
                    <Badge variant="secondary" className="text-xs">
                      {report.category}
                    </Badge>
                  </div>
                  <Badge variant={report.status === "Atualizado" ? "default" : "destructive"} className="text-xs">
                    {report.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-serif">{report.title}</CardTitle>
                <CardDescription className="text-sm">{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Última geração: {new Date(report.lastGenerated).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleGenerateReport(report.id)} className="flex-1">
                      Gerar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportReport(report.id, "PDF")}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Opções de Exportação</CardTitle>
            <CardDescription>Todos os relatórios podem ser exportados nos formatos abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
