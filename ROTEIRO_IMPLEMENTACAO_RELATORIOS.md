# Roteiro de Implementação - Página de Relatórios

## 📋 Análise Realizada

### Página Atual
A página de relatórios (`/app/relatorios/page.tsx`) está com:
- ✅ Interface mockada com 5 relatórios
- ❌ Sem integração com banco de dados
- ❌ Botões "Gerar" e "Exportar" sem funcionalidade
- ❌ Datas de última geração estáticas (2024-01-15)

### Relatórios Identificados
1. **Fluxo de Caixa** - Financeiro
2. **Exposição por Contraparte** - Financeiro  
3. **Composição por Tipo de Patrimônio** - Patrimônio
4. **Inadimplência** - Financeiro
5. **Participações por Envolvido** - Contratos

### Banco de Dados Disponível
Tabelas relevantes:
- `cash_transactions` (1 registro)
- `bank_accounts` (2 registros)
- `accounts_payable` (0 registros)
- `accounts_receivable` (0 registros)
- `contracts` (1 registro)
- `contract_parties` (2 registros)
- `contract_items` (1 registro)
- `properties` (1 registro)
- `vehicles`, `credits`, `developments` (0 registros cada)
- `people`, `companies` (0 registros cada)

---

## 🎯 Roteiro de Implementação

### **FASE 1: Server Actions para Relatórios**

#### 1.1 - Criar arquivo `app/actions/reports.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * RELATÓRIO 1: Fluxo de Caixa
 * Entrada e saídas por período (previsto x realizado)
 */
export async function getCashFlowReport(params: {
  startDate: string
  endDate: string
}) {
  const supabase = await createClient()
  
  // Buscar transações efetivadas (realizadas)
  const { data: transactions } = await supabase
    .from('cash_transactions')
    .select('*')
    .gte('transaction_date', params.startDate)
    .lte('transaction_date', params.endDate)
    .eq('status', 'efetivado')
    .order('transaction_date')

  // Buscar contas a pagar (previsto)
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('*')
    .gte('due_date', params.startDate)
    .lte('due_date', params.endDate)
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

  // Buscar contas a receber (previsto)
  const { data: receivables } = await supabase
    .from('accounts_receivable')
    .select('*')
    .gte('due_date', params.startDate)
    .lte('due_date', params.endDate)
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

  // Calcular totais realizados
  const realized = {
    entries: transactions
      ?.filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0,
    exits: transactions
      ?.filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0,
  }

  // Calcular totais previstos
  const forecast = {
    entries: receivables?.reduce((sum, r) => sum + Number(r.remaining_value), 0) || 0,
    exits: payables?.reduce((sum, p) => sum + Number(p.remaining_value), 0) || 0,
  }

  return {
    period: { startDate: params.startDate, endDate: params.endDate },
    realized: {
      entries: realized.entries,
      exits: realized.exits,
      balance: realized.entries - realized.exits,
    },
    forecast: {
      entries: forecast.entries,
      exits: forecast.exits,
      balance: forecast.entries - forecast.exits,
    },
    transactions: transactions || [],
    payables: payables || [],
    receivables: receivables || [],
  }
}

/**
 * RELATÓRIO 2: Exposição por Contraparte
 * Quanto cada pessoa/empresa tem a pagar/receber
 */
export async function getCounterpartyExposureReport() {
  const supabase = await createClient()

  // Buscar todas as contas a receber agrupadas por contraparte
  const { data: receivables } = await supabase
    .from('accounts_receivable')
    .select('counterparty, remaining_value, status, due_date')
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

  // Buscar contas a pagar (não tem counterparty direto, usar descrição)
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('description, remaining_value, status, due_date, vinculo')
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

  // Agrupar contas a receber por contraparte
  const receivablesMap = new Map<string, {
    name: string
    totalReceivable: number
    overdueReceivable: number
    count: number
  }>()

  receivables?.forEach(r => {
    const key = r.counterparty || 'Não identificado'
    const existing = receivablesMap.get(key) || {
      name: key,
      totalReceivable: 0,
      overdueReceivable: 0,
      count: 0,
    }
    
    existing.totalReceivable += Number(r.remaining_value)
    existing.count++
    
    if (r.status === 'vencido' || new Date(r.due_date) < new Date()) {
      existing.overdueReceivable += Number(r.remaining_value)
    }
    
    receivablesMap.set(key, existing)
  })

  // Agrupar contas a pagar por vínculo
  const payablesMap = new Map<string, {
    name: string
    totalPayable: number
    overduePayable: number
    count: number
  }>()

  payables?.forEach(p => {
    const key = p.vinculo || 'Não categorizado'
    const existing = payablesMap.get(key) || {
      name: key,
      totalPayable: 0,
      overduePayable: 0,
      count: 0,
    }
    
    existing.totalPayable += Number(p.remaining_value)
    existing.count++
    
    if (p.status === 'vencido' || new Date(p.due_date) < new Date()) {
      existing.overduePayable += Number(p.remaining_value)
    }
    
    payablesMap.set(key, existing)
  })

  return {
    receivables: Array.from(receivablesMap.values())
      .sort((a, b) => b.totalReceivable - a.totalReceivable),
    payables: Array.from(payablesMap.values())
      .sort((a, b) => b.totalPayable - a.totalPayable),
    summary: {
      totalReceivables: Array.from(receivablesMap.values())
        .reduce((sum, r) => sum + r.totalReceivable, 0),
      totalPayables: Array.from(payablesMap.values())
        .reduce((sum, p) => sum + p.totalPayable, 0),
    },
  }
}

/**
 * RELATÓRIO 3: Composição por Tipo de Patrimônio
 * Distribuição de imóveis, veículos, créditos e empreendimentos
 */
export async function getAssetCompositionReport() {
  const supabase = await createClient()

  // Buscar imóveis
  const { data: properties, count: propertiesCount } = await supabase
    .from('properties')
    .select('sale_value, status, type', { count: 'exact' })

  // Buscar veículos
  const { data: vehicles, count: vehiclesCount } = await supabase
    .from('vehicles')
    .select('reference_value, status, type', { count: 'exact' })

  // Buscar créditos
  const { data: credits, count: creditsCount } = await supabase
    .from('credits')
    .select('current_balance, status, origin', { count: 'exact' })

  // Buscar empreendimentos
  const { data: developments, count: developmentsCount } = await supabase
    .from('developments')
    .select('reference_value, status, type', { count: 'exact' })

  // Calcular valores por tipo
  const propertiesValue = properties?.reduce((sum, p) => 
    sum + Number(p.sale_value || 0), 0) || 0

  const vehiclesValue = vehicles?.reduce((sum, v) => 
    sum + Number(v.reference_value || 0), 0) || 0

  const creditsValue = credits?.reduce((sum, c) => 
    sum + Number(c.current_balance || 0), 0) || 0

  const developmentsValue = developments?.reduce((sum, d) => 
    sum + Number(d.reference_value || 0), 0) || 0

  const totalValue = propertiesValue + vehiclesValue + creditsValue + developmentsValue

  return {
    summary: {
      totalValue,
      totalAssets: (propertiesCount || 0) + (vehiclesCount || 0) + 
                   (creditsCount || 0) + (developmentsCount || 0),
    },
    breakdown: [
      {
        type: 'Imóveis',
        count: propertiesCount || 0,
        value: propertiesValue,
        percentage: totalValue > 0 ? (propertiesValue / totalValue) * 100 : 0,
        byStatus: {
          disponivel: properties?.filter(p => p.status === 'disponivel').length || 0,
          comprometido: properties?.filter(p => p.status === 'comprometido').length || 0,
          vendido: properties?.filter(p => p.status === 'vendido').length || 0,
        },
      },
      {
        type: 'Veículos',
        count: vehiclesCount || 0,
        value: vehiclesValue,
        percentage: totalValue > 0 ? (vehiclesValue / totalValue) * 100 : 0,
        byStatus: {
          disponivel: vehicles?.filter(v => v.status === 'disponivel').length || 0,
          comprometido: vehicles?.filter(v => v.status === 'comprometido').length || 0,
          vendido: vehicles?.filter(v => v.status === 'vendido').length || 0,
        },
      },
      {
        type: 'Créditos',
        count: creditsCount || 0,
        value: creditsValue,
        percentage: totalValue > 0 ? (creditsValue / totalValue) * 100 : 0,
        byStatus: {
          disponivel: credits?.filter(c => c.status === 'disponivel').length || 0,
          comprometido: credits?.filter(c => c.status === 'comprometido').length || 0,
          vendido: credits?.filter(c => c.status === 'vendido').length || 0,
        },
      },
      {
        type: 'Empreendimentos',
        count: developmentsCount || 0,
        value: developmentsValue,
        percentage: totalValue > 0 ? (developmentsValue / totalValue) * 100 : 0,
        byStatus: {
          disponivel: developments?.filter(d => d.status === 'disponivel').length || 0,
          comprometido: developments?.filter(d => d.status === 'comprometido').length || 0,
          vendido: developments?.filter(d => d.status === 'vendido').length || 0,
        },
      },
    ],
  }
}

/**
 * RELATÓRIO 4: Inadimplência
 * Contas em atraso e taxa de inadimplência
 */
export async function getDefaultReport() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Contas a receber vencidas
  const { data: overdueReceivables } = await supabase
    .from('accounts_receivable')
    .select('*')
    .lt('due_date', today)
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])
    .order('due_date', { ascending: true })

  // Contas a pagar vencidas
  const { data: overduePayables } = await supabase
    .from('accounts_payable')
    .select('*')
    .lt('due_date', today)
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])
    .order('due_date', { ascending: true })

  // Total de contas a receber (todas)
  const { data: allReceivables } = await supabase
    .from('accounts_receivable')
    .select('remaining_value, status')
    .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

  // Calcular valores
  const overdueReceivablesValue = overdueReceivables?.reduce((sum, r) => 
    sum + Number(r.remaining_value), 0) || 0

  const overduePayablesValue = overduePayables?.reduce((sum, p) => 
    sum + Number(p.remaining_value), 0) || 0

  const totalReceivablesValue = allReceivables?.reduce((sum, r) => 
    sum + Number(r.remaining_value), 0) || 0

  // Taxa de inadimplência (% do total a receber que está vencido)
  const defaultRate = totalReceivablesValue > 0 
    ? (overdueReceivablesValue / totalReceivablesValue) * 100 
    : 0

  // Agrupar por período de atraso
  const agingBuckets = {
    '0-30': { count: 0, value: 0 },
    '31-60': { count: 0, value: 0 },
    '61-90': { count: 0, value: 0 },
    '90+': { count: 0, value: 0 },
  }

  overdueReceivables?.forEach(r => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const value = Number(r.remaining_value)

    if (daysOverdue <= 30) {
      agingBuckets['0-30'].count++
      agingBuckets['0-30'].value += value
    } else if (daysOverdue <= 60) {
      agingBuckets['31-60'].count++
      agingBuckets['31-60'].value += value
    } else if (daysOverdue <= 90) {
      agingBuckets['61-90'].count++
      agingBuckets['61-90'].value += value
    } else {
      agingBuckets['90+'].count++
      agingBuckets['90+'].value += value
    }
  })

  return {
    summary: {
      defaultRate: defaultRate.toFixed(2),
      overdueReceivablesCount: overdueReceivables?.length || 0,
      overdueReceivablesValue,
      overduePayablesCount: overduePayables?.length || 0,
      overduePayablesValue,
    },
    agingAnalysis: agingBuckets,
    overdueReceivables: overdueReceivables || [],
    overduePayables: overduePayables || [],
  }
}

/**
 * RELATÓRIO 5: Participações por Envolvido
 * Percentual de participação de cada parte nos contratos
 */
export async function getParticipationReport() {
  const supabase = await createClient()

  // Buscar todos os contratos ativos com partes
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id,
      code,
      side_a_total,
      side_b_total,
      status,
      contract_date,
      contract_parties (
        id,
        side,
        party_name,
        party_document,
        gra_percentage
      )
    `)
    .in('status', ['ativo', 'rascunho'])

  // Mapear participações por pessoa
  const participationsMap = new Map<string, {
    name: string
    document: string
    contractsCount: number
    sideATotal: number
    sideBTotal: number
    totalValue: number
    graPercentage: number
    contracts: Array<{
      code: string
      side: string
      value: number
      date: string
    }>
  }>()

  contracts?.forEach((contract: any) => {
    const parties = Array.isArray(contract.contract_parties) 
      ? contract.contract_parties 
      : []

    parties.forEach((party: any) => {
      const key = party.party_document || party.party_name
      const existing = participationsMap.get(key) || {
        name: party.party_name,
        document: party.party_document,
        contractsCount: 0,
        sideATotal: 0,
        sideBTotal: 0,
        totalValue: 0,
        graPercentage: Number(party.gra_percentage || 0),
        contracts: [],
      }

      existing.contractsCount++
      
      if (party.side === 'A') {
        existing.sideATotal += Number(contract.side_a_total || 0)
      } else {
        existing.sideBTotal += Number(contract.side_b_total || 0)
      }

      existing.totalValue = existing.sideATotal + existing.sideBTotal

      existing.contracts.push({
        code: contract.code,
        side: party.side,
        value: party.side === 'A' 
          ? Number(contract.side_a_total || 0) 
          : Number(contract.side_b_total || 0),
        date: contract.contract_date,
      })

      participationsMap.set(key, existing)
    })
  })

  return {
    participants: Array.from(participationsMap.values())
      .sort((a, b) => b.totalValue - a.totalValue),
    summary: {
      totalParticipants: participationsMap.size,
      totalContracts: contracts?.length || 0,
      totalValue: Array.from(participationsMap.values())
        .reduce((sum, p) => sum + p.totalValue, 0),
    },
  }
}

/**
 * Gerar timestamp de última atualização para cada relatório
 */
export async function getReportMetadata() {
  return {
    'fluxo-caixa': { lastGenerated: new Date().toISOString() },
    'exposicao-contraparte': { lastGenerated: new Date().toISOString() },
    'composicao-patrimonio': { lastGenerated: new Date().toISOString() },
    'inadimplencia': { lastGenerated: new Date().toISOString() },
    'participacoes': { lastGenerated: new Date().toISOString() },
  }
}
```

---

### **FASE 2: Tipos TypeScript**

#### 2.1 - Adicionar tipos em `lib/types.ts`

```typescript
// Adicionar ao final do arquivo

// ============================================
// TIPOS DE RELATÓRIOS
// ============================================

export interface CashFlowReport {
  period: {
    startDate: string
    endDate: string
  }
  realized: {
    entries: number
    exits: number
    balance: number
  }
  forecast: {
    entries: number
    exits: number
    balance: number
  }
  transactions: any[]
  payables: any[]
  receivables: any[]
}

export interface CounterpartyExposure {
  name: string
  totalReceivable?: number
  overdueReceivable?: number
  totalPayable?: number
  overduePayable?: number
  count: number
}

export interface CounterpartyExposureReport {
  receivables: CounterpartyExposure[]
  payables: CounterpartyExposure[]
  summary: {
    totalReceivables: number
    totalPayables: number
  }
}

export interface AssetBreakdown {
  type: string
  count: number
  value: number
  percentage: number
  byStatus: {
    disponivel: number
    comprometido: number
    vendido: number
  }
}

export interface AssetCompositionReport {
  summary: {
    totalValue: number
    totalAssets: number
  }
  breakdown: AssetBreakdown[]
}

export interface AgingBucket {
  count: number
  value: number
}

export interface DefaultReport {
  summary: {
    defaultRate: string
    overdueReceivablesCount: number
    overdueReceivablesValue: number
    overduePayablesCount: number
    overduePayablesValue: number
  }
  agingAnalysis: {
    '0-30': AgingBucket
    '31-60': AgingBucket
    '61-90': AgingBucket
    '90+': AgingBucket
  }
  overdueReceivables: any[]
  overduePayables: any[]
}

export interface Participant {
  name: string
  document: string
  contractsCount: number
  sideATotal: number
  sideBTotal: number
  totalValue: number
  graPercentage: number
  contracts: Array<{
    code: string
    side: string
    value: number
    date: string
  }>
}

export interface ParticipationReport {
  participants: Participant[]
  summary: {
    totalParticipants: number
    totalContracts: number
    totalValue: number
  }
}

export interface ReportMetadata {
  lastGenerated: string
}
```

---

### **FASE 3: Componentes de Visualização**

#### 3.1 - Criar `components/reports/cash-flow-report.tsx`

```typescript
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CashFlowReport } from "@/lib/types"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

interface CashFlowReportProps {
  data: CashFlowReport
}

export function CashFlowReportView({ data }: CashFlowReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fluxo de Caixa - Previsto x Realizado
          </CardTitle>
          <CardDescription>
            Período: {new Date(data.period.startDate).toLocaleDateString('pt-BR')} até{' '}
            {new Date(data.period.endDate).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Realizado */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Realizado</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Entradas</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.realized.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Saídas</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.realized.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold">Saldo</span>
                  <span className={`font-bold ${
                    data.realized.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.realized.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Previsto */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Previsto</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Entradas</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.forecast.entries)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Saídas</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(data.forecast.exits)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold">Saldo</span>
                  <span className={`font-bold ${
                    data.forecast.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.forecast.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3.2 - Criar componentes para os outros relatórios

Seguir o mesmo padrão para:
- `components/reports/counterparty-exposure-report.tsx`
- `components/reports/asset-composition-report.tsx`
- `components/reports/default-report.tsx`
- `components/reports/participation-report.tsx`

---

### **FASE 4: Páginas de Detalhes dos Relatórios**

#### 4.1 - Criar `app/relatorios/[id]/page.tsx`

```typescript
import { MainLayout } from "@/components/main-layout"
import { CashFlowReportView } from "@/components/reports/cash-flow-report"
import { 
  getCashFlowReport,
  getCounterpartyExposureReport,
  getAssetCompositionReport,
  getDefaultReport,
  getParticipationReport,
} from "@/app/actions/reports"
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

  // Determinar qual relatório buscar
  let reportData
  let reportTitle = ""

  try {
    switch (reportId) {
      case "fluxo-caixa":
        const startDate = searchParams.startDate || 
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const endDate = searchParams.endDate || 
          new Date().toISOString().split('T')[0]
        
        reportData = await getCashFlowReport({ startDate, endDate })
        reportTitle = "Fluxo de Caixa"
        break

      case "exposicao-contraparte":
        reportData = await getCounterpartyExposureReport()
        reportTitle = "Exposição por Contraparte"
        break

      case "composicao-patrimonio":
        reportData = await getAssetCompositionReport()
        reportTitle = "Composição por Tipo de Patrimônio"
        break

      case "inadimplencia":
        reportData = await getDefaultReport()
        reportTitle = "Inadimplência"
        break

      case "participacoes":
        reportData = await getParticipationReport()
        reportTitle = "Participações por Envolvido"
        break

      default:
        notFound()
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    notFound()
  }

  return (
    <MainLayout breadcrumbs={[
      { label: "Relatórios", href: "/relatorios" },
      { label: reportTitle }
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
              <h1 className="text-3xl font-bold">{reportTitle}</h1>
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
        {reportId === "fluxo-caixa" && <CashFlowReportView data={reportData} />}
        {/* Adicionar outros componentes conforme implementados */}
      </div>
    </MainLayout>
  )
}
```

---

### **FASE 5: Atualizar Página Principal**

#### 5.1 - Atualizar `app/relatorios/page.tsx`

Substituir os dados mockados por dados reais:

```typescript
import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar, TrendingUp, Building2 } from "lucide-react"
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
```

---

### **FASE 6: Funcionalidade de Exportação (Opcional)**

#### 6.1 - Instalar biblioteca PDF

```bash
pnpm add jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

#### 6.2 - Criar utilitário de exportação

```typescript
// lib/export-pdf.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportCashFlowToPDF(data: any) {
  const doc = new jsPDF()
  
  doc.setFontSize(18)
  doc.text('Fluxo de Caixa', 14, 20)
  
  // Adicionar conteúdo...
  
  doc.save(`fluxo-caixa-${new Date().toISOString()}.pdf`)
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Server Actions
- [ ] Criar arquivo `app/actions/reports.ts`
- [ ] Implementar `getCashFlowReport`
- [ ] Implementar `getCounterpartyExposureReport`
- [ ] Implementar `getAssetCompositionReport`
- [ ] Implementar `getDefaultReport`
- [ ] Implementar `getParticipationReport`
- [ ] Implementar `getReportMetadata`
- [ ] Testar cada função individualmente

### Fase 2: Tipos
- [ ] Adicionar tipos de relatórios em `lib/types.ts`
- [ ] Verificar compilação TypeScript

### Fase 3: Componentes de Visualização
- [ ] Criar `CashFlowReportView`
- [ ] Criar `CounterpartyExposureReportView`
- [ ] Criar `AssetCompositionReportView`
- [ ] Criar `DefaultReportView`
- [ ] Criar `ParticipationReportView`

### Fase 4: Páginas de Detalhes
- [ ] Criar `app/relatorios/[id]/page.tsx`
- [ ] Implementar roteamento dinâmico
- [ ] Adicionar tratamento de erros (notFound)

### Fase 5: Página Principal
- [ ] Atualizar `app/relatorios/page.tsx`
- [ ] Remover dados mockados
- [ ] Integrar com metadata real

### Fase 6: Exportação (Opcional)
- [ ] Instalar jsPDF
- [ ] Implementar exportação para PDF
- [ ] Adicionar botões de exportação

---

## 🚀 Ordem de Execução Recomendada

1. **Dia 1 - Fundação**
   - Fase 1: Criar server actions (começar com Fluxo de Caixa)
   - Fase 2: Adicionar tipos TypeScript
   - Testar actions no console

2. **Dia 2 - Visualização**
   - Fase 3: Criar componentes de visualização
   - Fase 4: Criar páginas de detalhes
   - Testar navegação

3. **Dia 3 - Integração**
   - Fase 5: Atualizar página principal
   - Testar todos os relatórios
   - Ajustes e refinamentos

4. **Dia 4 - Exportação (Opcional)**
   - Fase 6: Implementar exportação PDF
   - Testes finais
   - Documentação

---

## 📊 Dados de Teste

Atualmente o banco possui:
- 1 contrato ativo
- 2 contas bancárias
- 1 imóvel
- 1 transação de caixa

**Recomendação:** Criar dados de teste antes de implementar:
- Adicionar 3-5 contas a pagar
- Adicionar 3-5 contas a receber  
- Adicionar 2-3 contratos adicionais
- Adicionar alguns veículos e créditos

---

## 🎨 Melhorias Futuras

1. **Gráficos Visuais**
   - Instalar biblioteca de charts (recharts ou chart.js)
   - Adicionar gráficos de pizza, linha e barra

2. **Filtros Avançados**
   - Adicionar filtros por data em todos os relatórios
   - Filtros por categoria, status, etc.

3. **Agendamento**
   - Agendar geração automática de relatórios
   - Envio por email

4. **Comparações**
   - Comparar períodos (mês atual vs mês anterior)
   - Tendências históricas

---

## 📝 Notas Importantes

- Todos os relatórios usam dados reais do Supabase
- Tratamento de casos vazios (sem dados) está incluído
- Cálculos de percentuais evitam divisão por zero
- Datas usam formato ISO para compatibilidade
- Valores monetários sempre convertidos com `Number()`

---

**FIM DO ROTEIRO**
