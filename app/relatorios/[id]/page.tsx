import { MainLayout } from "@/components/main-layout"
import { CashFlowReportView } from "@/components/reports/cash-flow-report"
import { CounterpartyExposureReportView } from "@/components/reports/counterparty-exposure-report"
import { AssetCompositionReportView } from "@/components/reports/asset-composition-report"
import { DefaultReportView } from "@/components/reports/default-report"
import { ParticipationReportView } from "@/components/reports/participation-report"
import { 
  getCashFlowReport,
  getCounterpartyExposureReport,
  getAssetCompositionReport,
  getDefaultReport,
  getParticipationReport,
} from "@/app/actions/reports"
import type { 
  CashFlowReport, 
  CounterpartyExposureReport, 
  AssetCompositionReport, 
  DefaultReport, 
  ParticipationReport 
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { startDate?: string; endDate?: string }
}) {
  const reportId = params.id

  return (
    <MainLayout breadcrumbs={[
      { label: "Relatórios", href: "/relatorios" },
      { label: getReportTitle(reportId) }
    ]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/relatorios">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{getReportTitle(reportId)}</h1>
              <p className="text-muted-foreground">
                Gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Conteúdo do Relatório */}
        <ReportContent reportId={reportId} searchParams={searchParams} />
      </div>
    </MainLayout>
  )
}

function getReportTitle(reportId: string): string {
  switch (reportId) {
    case "fluxo-caixa":
      return "Fluxo de Caixa"
    case "exposicao-contraparte":
      return "Exposição por Contraparte"
    case "composicao-patrimonio":
      return "Composição por Tipo de Patrimônio"
    case "inadimplencia":
      return "Inadimplência"
    case "participacoes":
      return "Participações por Envolvido"
    default:
      notFound()
  }
}

async function ReportContent({ 
  reportId, 
  searchParams 
}: { 
  reportId: string
  searchParams: { startDate?: string; endDate?: string }
}) {
  try {
    switch (reportId) {
      case "fluxo-caixa": {
        const startDate = searchParams.startDate || 
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const endDate = searchParams.endDate || 
          new Date().toISOString().split('T')[0]
        
        const data = await getCashFlowReport({ startDate, endDate })
        return <CashFlowReportView data={data} />
      }

      case "exposicao-contraparte": {
        const data = await getCounterpartyExposureReport()
        return <CounterpartyExposureReportView data={data} />
      }

      case "composicao-patrimonio": {
        const data = await getAssetCompositionReport()
        return <AssetCompositionReportView data={data} />
      }

      case "inadimplencia": {
        const data = await getDefaultReport()
        return <DefaultReportView data={data} />
      }

      case "participacoes": {
        const data = await getParticipationReport()
        return <ParticipationReportView data={data} />
      }

      default:
        notFound()
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    notFound()
  }
}
