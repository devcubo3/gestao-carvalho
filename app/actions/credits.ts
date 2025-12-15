"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Tipos
type CreditInput = {
  creditor_id: string
  creditor_type: 'pessoa' | 'empresa'
  debtor_id?: string
  debtor_type?: 'pessoa' | 'empresa'
  origin: string
  nominal_value: number
  current_balance?: number
  interest_rate?: string
  start_date: string
  due_date?: string
  status?: string
  notes?: string
}

// GET - Listar todos os créditos com nomes
export async function getCredits() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase.rpc('get_credits_with_names')

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

// GET - Buscar crédito por ID
export async function getCreditById(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase.rpc('get_credit_by_id_with_names', { credit_id: id })

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  if (!data || data.length === 0) {
    return { success: false, error: "Crédito não encontrado", data: null }
  }

  return { success: true, error: null, data: data[0] }
}

// POST - Criar novo crédito
export async function createCredit(input: CreditInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissões
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return { success: false, error: "Sem permissão para criar créditos" }
  }

  // Gerar código automaticamente
  const { data: codeData, error: codeError } = await supabase
    .rpc("generate_credit_code")

  if (codeError) {
    return { success: false, error: "Erro ao gerar código: " + codeError.message }
  }

  const code = codeData as string

  // Inserir crédito
  const { data: credit, error: insertError } = await supabase
    .from("credits")
    .insert({
      code,
      creditor_id: input.creditor_id,
      creditor_type: input.creditor_type,
      debtor_id: input.debtor_id || null,
      debtor_type: input.debtor_type || null,
      origin: input.origin,
      nominal_value: input.nominal_value,
      current_balance: input.current_balance || input.nominal_value,
      interest_rate: input.interest_rate || null,
      start_date: input.start_date,
      due_date: input.due_date || null,
      status: input.status || 'disponivel',
      notes: input.notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  // Criar movimentação inicial
  await supabase
    .from("credit_movements")
    .insert({
      credit_id: credit.id,
      movement_type: 'inicial',
      description: 'Valor inicial da carta de crédito',
      value: input.nominal_value,
      balance_after: input.current_balance || input.nominal_value,
      movement_date: input.start_date,
      created_by: user.id,
    })

  revalidatePath("/banco-dados/creditos")
  return { success: true, error: null, data: credit }
}

// PUT - Atualizar crédito
export async function updateCredit(id: string, input: Partial<CreditInput>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissões
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return { success: false, error: "Sem permissão para atualizar créditos" }
  }

  const { data, error } = await supabase
    .from("credits")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/creditos")
  return { success: true, error: null, data }
}

// DELETE - Excluir crédito
export async function deleteCredit(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissões (apenas admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { success: false, error: "Apenas administradores podem excluir créditos" }
  }

  const { error } = await supabase
    .from("credits")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/creditos")
  return { success: true, error: null }
}

// PATCH - Atualizar status
export async function updateCreditStatus(id: string, status: string) {
  return updateCredit(id, { status })
}

// POST - Adicionar movimentação
export async function addCreditMovement(creditId: string, data: {
  movement_type: 'deducao' | 'estorno' | 'ajuste'
  description: string
  value: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissões
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return { success: false, error: "Sem permissão" }
  }

  // Buscar crédito atual
  const { data: credit, error: creditError } = await supabase
    .from("credits")
    .select("current_balance, nominal_value")
    .eq("id", creditId)
    .single()

  if (creditError || !credit) {
    return { success: false, error: "Crédito não encontrado" }
  }

  // Calcular novo saldo
  let newBalance = credit.current_balance
  if (data.movement_type === 'deducao') {
    newBalance -= data.value
  } else if (data.movement_type === 'estorno') {
    newBalance += data.value
  } else {
    newBalance = data.value
  }

  // Validar limites
  if (newBalance < 0) {
    return { success: false, error: "Saldo não pode ser negativo" }
  }
  if (newBalance > credit.nominal_value) {
    return { success: false, error: "Saldo não pode exceder valor nominal" }
  }

  // Atualizar saldo do crédito
  await supabase
    .from("credits")
    .update({ current_balance: newBalance })
    .eq("id", creditId)

  // Criar movimentação
  const { error: movError } = await supabase
    .from("credit_movements")
    .insert({
      credit_id: creditId,
      movement_type: data.movement_type,
      description: data.description,
      value: data.value,
      balance_after: newBalance,
      created_by: user.id,
    })

  if (movError) {
    return { success: false, error: movError.message }
  }

  revalidatePath("/banco-dados/creditos")
  return { success: true, error: null }
}

// GET - Buscar movimentações de um crédito
export async function getCreditMovements(creditId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase
    .from("credit_movements")
    .select("*")
    .eq("credit_id", creditId)
    .order("movement_date", { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, error: null, data }
}

// SEARCH - Buscar com filtros
export async function searchCredits(filters: {
  status?: string
  creditor_id?: string
  search?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  let query = supabase
    .from("credits")
    .select(`
      *,
      creditor_person:people!credits_creditor_id_fkey(full_name),
      creditor_company:companies!credits_creditor_id_fkey(trade_name)
    `)

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.creditor_id) {
    query = query.eq("creditor_id", filters.creditor_id)
  }

  if (filters.search) {
    query = query.or(`code.ilike.%${filters.search}%,origin.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  // Mapear nomes
  const creditsWithNames = data.map((credit: any) => ({
    ...credit,
    creditor_name: credit.creditor_type === 'pessoa' 
      ? credit.creditor_person?.full_name 
      : credit.creditor_company?.trade_name,
    creditor_person: undefined,
    creditor_company: undefined,
  }))

  return { success: true, error: null, data: creditsWithNames }
}
