"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Interface para KPIs mensais
 */
export interface MonthlyKPIs {
  monthlyPayables: number
  monthlyReceivables: number
  monthlyBalance: number
  newContractsThisMonth: number
}

/**
 * Interface para movimentações de hoje
 */
export interface TodayMovements {
  todayPayables: number
  todayReceivables: number
  todayPayablesCount: number
  todayReceivablesCount: number
  todayPayablesList: MovementItem[]
  todayReceivablesList: MovementItem[]
}

/**
 * Interface para item de movimentação
 */
export interface MovementItem {
  id: string
  code: string
  description: string
  value: number
  counterparty?: string
  vinculo?: string
  centro_custo?: string
  dueDate: string
}

/**
 * Interface para adição recente
 */
export interface RecentAddition {
  id: string
  code: string
  type: "imovel" | "veiculo" | "credito" | "empreendimento"
  name: string
  value: number
  date: Date
}

/**
 * Interface para resumo bancário
 */
export interface BankSummary {
  totalAccounts: number
  totalBalance: number
}

/**
 * Interface para contrato do dashboard
 */
export interface DashboardContract {
  id: string
  code: string
  contractDate: string
  status: string
  sideATotal: number
  sideBTotal: number
  balance: number
  parties: {
    sideA: Array<{ name: string; document: string }>
    sideB: Array<{ name: string; document: string }>
  }
  updatedAt: string
}

/**
 * Busca KPIs mensais do banco de dados
 */
export async function getMonthlyKPIs(): Promise<MonthlyKPIs> {
  const supabase = await createClient()

  // Buscar contas a pagar do mês
  const { data: payables } = await supabase
    .from("accounts_payable")
    .select("remaining_value")
    .gte("due_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lt("due_date", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
    .in("status", ["em_aberto", "vencido", "parcialmente_pago"])

  const monthlyPayables = payables?.reduce((sum, item) => sum + Number(item.remaining_value || 0), 0) || 0

  // Buscar contas a receber do mês
  const { data: receivables } = await supabase
    .from("accounts_receivable")
    .select("remaining_value")
    .gte("due_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lt("due_date", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
    .in("status", ["em_aberto", "vencido", "parcialmente_pago"])

  const monthlyReceivables = receivables?.reduce((sum, item) => sum + Number(item.remaining_value || 0), 0) || 0

  // Buscar novos contratos do mês
  const { count: newContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lt("created_at", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())

  return {
    monthlyPayables,
    monthlyReceivables,
    monthlyBalance: monthlyReceivables - monthlyPayables,
    newContractsThisMonth: newContracts || 0,
  }
}

/**
 * Busca movimentações de hoje
 */
export async function getTodayMovements(): Promise<TodayMovements> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Buscar contas a pagar de hoje
  const { data: payables } = await supabase
    .from("accounts_payable")
    .select("id, code, description, remaining_value, vinculo, centro_custo, due_date")
    .eq("due_date", today)
    .in("status", ["em_aberto", "vencido"])
    .order("remaining_value", { ascending: false })
    .limit(5)

  const todayPayablesList: MovementItem[] =
    payables?.map((item) => ({
      id: item.id,
      code: item.code,
      description: item.description,
      value: Number(item.remaining_value),
      vinculo: item.vinculo,
      centro_custo: item.centro_custo,
      dueDate: item.due_date,
    })) || []

  const todayPayables = todayPayablesList.reduce((sum, item) => sum + item.value, 0)

  // Buscar contas a receber de hoje
  const { data: receivables } = await supabase
    .from("accounts_receivable")
    .select("id, code, description, remaining_value, counterparty, due_date")
    .eq("due_date", today)
    .in("status", ["em_aberto", "vencido"])
    .order("remaining_value", { ascending: false })
    .limit(5)

  const todayReceivablesList: MovementItem[] =
    receivables?.map((item) => ({
      id: item.id,
      code: item.code,
      description: item.description,
      value: Number(item.remaining_value),
      counterparty: item.counterparty,
      dueDate: item.due_date,
    })) || []

  const todayReceivables = todayReceivablesList.reduce((sum, item) => sum + item.value, 0)

  // Contar total de contas de hoje
  const { count: payablesCount } = await supabase
    .from("accounts_payable")
    .select("*", { count: "exact", head: true })
    .eq("due_date", today)
    .in("status", ["em_aberto", "vencido"])

  const { count: receivablesCount } = await supabase
    .from("accounts_receivable")
    .select("*", { count: "exact", head: true })
    .eq("due_date", today)
    .in("status", ["em_aberto", "vencido"])

  return {
    todayPayables,
    todayReceivables,
    todayPayablesCount: payablesCount || 0,
    todayReceivablesCount: receivablesCount || 0,
    todayPayablesList,
    todayReceivablesList,
  }
}

/**
 * Busca os 5 contratos mais recentes com suas partes
 */
export async function getRecentContracts(): Promise<DashboardContract[]> {
  const supabase = await createClient()

  // Buscar contratos
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, code, contract_date, status, side_a_total, side_b_total, balance, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5)

  if (!contracts || contracts.length === 0) {
    return []
  }

  // Buscar partes de cada contrato
  const contractsWithParties: DashboardContract[] = await Promise.all(
    contracts.map(async (contract) => {
      const { data: parties } = await supabase
        .from("contract_parties")
        .select("id, side, party_name, party_document")
        .eq("contract_id", contract.id)
        .order("side")
        .order("created_at")

      const sideA = parties?.filter((p) => p.side === "A").map((p) => ({ name: p.party_name, document: p.party_document })) || []
      const sideB = parties?.filter((p) => p.side === "B").map((p) => ({ name: p.party_name, document: p.party_document })) || []

      return {
        id: contract.id,
        code: contract.code,
        contractDate: contract.contract_date,
        status: contract.status || "rascunho",
        sideATotal: Number(contract.side_a_total || 0),
        sideBTotal: Number(contract.side_b_total || 0),
        balance: Number(contract.balance || 0),
        parties: { sideA, sideB },
        updatedAt: contract.updated_at,
      }
    }),
  )

  return contractsWithParties
}

/**
 * Busca adições recentes de imóveis, veículos, créditos e empreendimentos
 */
export async function getRecentAdditions(): Promise<RecentAddition[]> {
  const supabase = await createClient()

  // Buscar imóveis recentes
  const { data: properties } = await supabase
    .from("properties")
    .select("id, code, identification, sale_value, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const propertyAdditions: RecentAddition[] =
    properties?.map((item) => ({
      id: item.id,
      code: item.code,
      type: "imovel" as const,
      name: item.identification,
      value: Number(item.sale_value || 0),
      date: new Date(item.created_at),
    })) || []

  // Buscar veículos recentes
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, code, brand, model, plate, reference_value, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const vehicleAdditions: RecentAddition[] =
    vehicles?.map((item) => ({
      id: item.id,
      code: item.code,
      type: "veiculo" as const,
      name: `${item.brand} ${item.model} - ${item.plate}`,
      value: Number(item.reference_value || 0),
      date: new Date(item.created_at),
    })) || []

  // Buscar créditos recentes
  const { data: credits } = await supabase
    .from("credits")
    .select("id, code, origin, current_balance, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const creditAdditions: RecentAddition[] =
    credits?.map((item) => ({
      id: item.id,
      code: item.code,
      type: "credito" as const,
      name: `Crédito - ${item.origin}`,
      value: Number(item.current_balance || 0),
      date: new Date(item.created_at),
    })) || []

  // Buscar empreendimentos recentes
  const { data: developments } = await supabase
    .from("developments")
    .select("id, code, name, reference_value, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const developmentAdditions: RecentAddition[] =
    developments?.map((item) => ({
      id: item.id,
      code: item.code,
      type: "empreendimento" as const,
      name: item.name,
      value: Number(item.reference_value || 0),
      date: new Date(item.created_at),
    })) || []

  // Combinar todos e pegar os 5 mais recentes
  const allAdditions = [...propertyAdditions, ...vehicleAdditions, ...creditAdditions, ...developmentAdditions]
  allAdditions.sort((a, b) => b.date.getTime() - a.date.getTime())

  return allAdditions.slice(0, 5)
}

/**
 * Busca resumo das contas bancárias
 */
export async function getBankAccountsSummary(): Promise<BankSummary> {
  const supabase = await createClient()

  const { data: accounts } = await supabase.from("bank_accounts").select("balance").eq("status", "ativo")

  const totalBalance = accounts?.reduce((sum, item) => sum + Number(item.balance || 0), 0) || 0

  return {
    totalAccounts: accounts?.length || 0,
    totalBalance,
  }
}
