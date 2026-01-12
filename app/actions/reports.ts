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

  // Tipo para o mapa de participações
  interface ParticipationMapItem {
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

  // Mapear participações por pessoa
  const participationsMap = new Map<string, ParticipationMapItem>()

  contracts?.forEach((contract: any) => {
    const parties = Array.isArray(contract.contract_parties) 
      ? contract.contract_parties 
      : []

    parties.forEach((party: any) => {
      const key = party.party_document || party.party_name
      const existing: ParticipationMapItem = participationsMap.get(key) || {
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
