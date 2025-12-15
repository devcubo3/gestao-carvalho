'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const bankAccountSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  type: z.enum(['banco', 'especie', 'poupanca', 'investimento']),
  code: z.string().optional(),
  initial_balance: z.number().default(0),
  notes: z.string().optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
})

const cashTransactionSchema = z.object({
  bank_account_id: z.string().uuid('ID de conta inválido'),
  transaction_date: z.string().or(z.date()),
  type: z.enum(['entrada', 'saida']),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  forma: z.enum(['Caixa', 'Permuta']),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  value: z.number().positive('Valor deve ser maior que zero'),
  notes: z.string().optional(),
})

const cashClosingSchema = z.object({
  closing_date: z.string().or(z.date()),
  bank_accounts_data: z.record(z.object({
    informed_balance: z.number(),
  })),
  notes: z.string().optional(),
})

// =====================================================
// Types
// =====================================================

export type BankAccountFormData = z.infer<typeof bankAccountSchema>
export type CashTransactionFormData = z.infer<typeof cashTransactionSchema>
export type CashClosingFormData = z.infer<typeof cashClosingSchema>

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// =====================================================
// Helper: Formatar erros Zod
// =====================================================

function formatZodError(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = []
    }
    fieldErrors[path].push(err.message)
  })
  return fieldErrors
}

// =====================================================
// BANK ACCOUNTS
// =====================================================

export async function createBankAccount(data: BankAccountFormData): Promise<ActionResult> {
  try {
    const validatedData = bankAccountSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para criar contas' }
    }

    const { data: account, error } = await supabase
      .from('bank_accounts')
      .insert({
        ...validatedData,
        balance: validatedData.initial_balance,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conta:', error)
      return { success: false, error: 'Erro ao criar conta bancária' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: account }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getBankAccounts(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('status', 'ativo')
      .order('name')

    if (error) {
      console.error('Erro ao buscar contas:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function updateBankAccount(
  id: string,
  data: Partial<BankAccountFormData>
): Promise<ActionResult> {
  try {
    const validatedData = bankAccountSchema.partial().parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para editar contas' }
    }

    // Se o saldo inicial foi alterado, precisamos atualizar o saldo atual também
    const updateData: any = { ...validatedData }
    
    if (validatedData.initial_balance !== undefined) {
      // Buscar conta atual
      const { data: currentAccount } = await supabase
        .from('bank_accounts')
        .select('balance, initial_balance')
        .eq('id', id)
        .single()

      if (currentAccount) {
        // Calcular a diferença que precisa ser aplicada
        const difference = validatedData.initial_balance - currentAccount.initial_balance
        updateData.balance = currentAccount.balance + difference
      }
    }

    const { data: account, error } = await supabase
      .from('bank_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta bancária' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: account }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao atualizar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// CASH TRANSACTIONS
// =====================================================

export async function createCashTransaction(data: CashTransactionFormData): Promise<ActionResult> {
  try {
    const validatedData = cashTransactionSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para criar transações' }
    }

    const { data: transaction, error } = await supabase
      .from('cash_transactions')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar transação:', error)
      return { success: false, error: 'Erro ao registrar movimentação' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: transaction }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar transação:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getCashTransactions(filters?: {
  dateFrom?: string
  dateTo?: string
  type?: string
  bank_account_id?: string
  vinculo?: string
  forma?: string
  centro_custo?: string
  centroCusto?: string // Aceitar camelCase também
}): Promise<ActionResult> {
  try {
    console.log('getCashTransactions received filters:', filters)
    
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    let query = supabase
      .from('cash_transactions')
      .select(`
        *,
        bank_account:bank_accounts(id, name, type)
      `)
      .eq('status', 'efetivado')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.dateFrom) {
      console.log('Applying dateFrom filter:', filters.dateFrom)
      query = query.gte('transaction_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      console.log('Applying dateTo filter:', filters.dateTo)
      query = query.lte('transaction_date', filters.dateTo)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.bank_account_id) {
      query = query.eq('bank_account_id', filters.bank_account_id)
    }
    if (filters?.vinculo) {
      query = query.eq('vinculo', filters.vinculo)
    }
    if (filters?.forma) {
      query = query.eq('forma', filters.forma)
    }
    if (filters?.centro_custo || filters?.centroCusto) {
      query = query.eq('centro_custo', filters.centro_custo || filters.centroCusto)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return { success: false, error: 'Erro ao carregar movimentações' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function deleteCashTransaction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem excluir transações' }
    }

    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir transação:', error)
      return { success: false, error: 'Erro ao excluir movimentação' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// CASH CLOSINGS
// =====================================================

export async function createCashClosing(data: CashClosingFormData): Promise<ActionResult> {
  try {
    const validatedData = cashClosingSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Validar fechamento via função do banco
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_cash_closing', {
        p_closing_date: validatedData.closing_date,
        p_accounts_data: validatedData.bank_accounts_data,
      })

    if (validationError) {
      console.error('Erro na validação:', validationError)
      return { success: false, error: 'Erro ao validar fechamento' }
    }

    if (!validation.is_valid) {
      return {
        success: false,
        error: `Diferença de ${validation.total_discrepancy} nos valores`,
        data: validation,
      }
    }

    // Calcular totais
    const { data: transactions } = await supabase
      .from('cash_transactions')
      .select('type, value')
      .eq('transaction_date', validatedData.closing_date)
      .eq('status', 'efetivado')

    const total_entries = transactions
      ?.filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0

    const total_exits = transactions
      ?.filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0

    // Criar fechamento
    const { data: closing, error } = await supabase
      .from('cash_closings')
      .insert({
        closing_date: validatedData.closing_date,
        total_entries,
        total_exits,
        net_balance: total_entries - total_exits,
        bank_accounts_data: validation.accounts,
        discrepancy: validation.total_discrepancy,
        notes: validatedData.notes,
        closed_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar fechamento:', error)
      return { success: false, error: 'Erro ao registrar fechamento' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: closing }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar fechamento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getOpenCashDays(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_open_cash_days')

    if (error) {
      console.error('Erro ao buscar dias em aberto:', error)
      return { success: false, error: 'Erro ao carregar dias' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar dias:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// HELPER: Obter permissões do usuário
// =====================================================

export async function getUserPermissions(): Promise<ActionResult<{
  role: string
  canEdit: boolean
  canDelete: boolean
}>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Perfil não encontrado' }
    }

    const role = profile.role
    const canEdit = ['admin', 'editor'].includes(role)
    const canDelete = role === 'admin'

    return {
      success: true,
      data: { role, canEdit, canDelete },
    }
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return { success: false, error: 'Erro ao verificar permissões' }
  }
}
