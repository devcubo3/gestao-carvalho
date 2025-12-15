'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const accountReceivableSchema = z.object({
  contract_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  counterparty: z.string().min(3, 'Contraparte deve ter no mínimo 3 caracteres'),
  original_value: z.number().positive('Valor deve ser maior que zero'),
  due_date: z.string().or(z.date()),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  installment_current: z.number().int().positive().optional().nullable(),
  installment_total: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const receivablePaymentSchema = z.object({
  account_receivable_id: z.string().uuid(),
  payment_date: z.string().or(z.date()),
  payment_value: z.number().positive('Valor deve ser maior que zero'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  bank_account_id: z.string().uuid('Conta bancária é obrigatória'),
  notes: z.string().optional().nullable(),
})

// =====================================================
// Types
// =====================================================

export type AccountReceivableFormData = z.infer<typeof accountReceivableSchema>
export type ReceivablePaymentFormData = z.infer<typeof receivablePaymentSchema>

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
// ACCOUNTS RECEIVABLE - CRUD
// =====================================================

export async function createAccountReceivable(
  data: AccountReceivableFormData
): Promise<ActionResult> {
  try {
    console.log('🔵 Iniciando createAccountReceivable com dados:', data)
    const validatedData = accountReceivableSchema.parse(data)
    console.log('✅ Dados validados:', validatedData)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return { success: false, error: 'Usuário não autenticado' }
    }
    console.log('✅ Usuário autenticado:', user.id)

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      console.error('❌ Sem permissão. Role:', profile?.role)
      return { success: false, error: 'Sem permissão para criar contas a receber' }
    }
    console.log('✅ Permissão verificada. Role:', profile.role)

    const insertData = {
      ...validatedData,
      remaining_value: validatedData.original_value,
      created_by: user.id,
    }
    console.log('📤 Dados para inserção:', insertData)

    const { data: account, error } = await supabase
      .from('accounts_receivable')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar conta a receber no banco:', error)
      return { success: false, error: `Erro ao criar conta a receber: ${error.message}` }
    }
    
    console.log('✅ Conta criada com sucesso:', account)

    revalidatePath('/financeiro/contas-receber')
    return { success: true, data: account }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação Zod:', error.errors)
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('❌ Erro inesperado ao criar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getAccountsReceivable(filters?: {
  dateFrom?: string
  dateTo?: string
  status?: string
  vinculo?: string
  centro_custo?: string
  centroCusto?: string
  code?: string
  description?: string
  valueMin?: number
  valueMax?: number
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    let query = supabase
      .from('accounts_receivable')
      .select('*')
      .not('status', 'eq', 'cancelado')
      .order('due_date', { ascending: true })

    // Aplicar filtros
    if (filters?.dateFrom) {
      query = query.gte('due_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('due_date', filters.dateTo)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.vinculo) {
      query = query.eq('vinculo', filters.vinculo)
    }
    if (filters?.centro_custo || filters?.centroCusto) {
      query = query.eq('centro_custo', filters.centro_custo || filters.centroCusto)
    }
    if (filters?.code) {
      query = query.ilike('code', `%${filters.code}%`)
    }
    if (filters?.description) {
      query = query.ilike('description', `%${filters.description}%`)
    }
    if (filters?.valueMin) {
      query = query.gte('remaining_value', filters.valueMin)
    }
    if (filters?.valueMax) {
      query = query.lte('remaining_value', filters.valueMax)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar contas a receber:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function updateAccountReceivable(
  id: string,
  data: Partial<AccountReceivableFormData>
): Promise<ActionResult> {
  try {
    const validatedData = accountReceivableSchema.partial().parse(data)
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

    const { data: account, error } = await supabase
      .from('accounts_receivable')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta' }
    }

    revalidatePath('/financeiro/contas-receber')
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

export async function deleteAccountReceivable(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se é admin (requisito obrigatório para exclusão permanente)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.error('Tentativa de exclusão sem permissão de admin. User:', user.id, 'Role:', profile?.role)
      return { success: false, error: '🔒 Apenas administradores podem excluir contas permanentemente' }
    }

    // Buscar informações da conta antes de excluir (para auditoria)
    const { data: account } = await supabase
      .from('accounts_receivable')
      .select('code, description')
      .eq('id', id)
      .single()

    // Executar exclusão permanente
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir conta permanentemente:', error)
      return { success: false, error: 'Erro ao excluir conta permanentemente do banco de dados' }
    }

    console.log('Conta excluída permanentemente:', account?.code, 'por admin:', user.id)
    revalidatePath('/financeiro/contas-receber')
    return { success: true, data: { code: account?.code } }
  } catch (error) {
    console.error('Erro inesperado na exclusão permanente:', error)
    return { success: false, error: 'Erro inesperado ao excluir conta' }
  }
}

// =====================================================
// RECEIVABLE PAYMENTS - Recebimentos
// =====================================================

export async function createReceivablePayment(
  data: ReceivablePaymentFormData
): Promise<ActionResult> {
  try {
    const validatedData = receivablePaymentSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para registrar recebimentos' }
    }

    // Buscar conta a receber
    const { data: receivable } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', validatedData.account_receivable_id)
      .single()

    if (!receivable) {
      return { success: false, error: 'Conta a receber não encontrada' }
    }

    // Validar valor do pagamento
    if (validatedData.payment_value > receivable.remaining_value) {
      return { 
        success: false, 
        error: `Valor de pagamento (${validatedData.payment_value}) não pode ser maior que o valor restante (${receivable.remaining_value})` 
      }
    }

    // 1. Criar transação no caixa (entrada)
    const { data: cashTransaction, error: cashError } = await supabase
      .from('cash_transactions')
      .insert({
        bank_account_id: validatedData.bank_account_id,
        transaction_date: validatedData.payment_date,
        type: 'entrada',
        description: `Recebimento: ${receivable.description}`,
        vinculo: receivable.vinculo,
        forma: 'Caixa',
        centro_custo: receivable.centro_custo,
        value: validatedData.payment_value,
        account_receivable_id: validatedData.account_receivable_id,
        notes: validatedData.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (cashError) {
      console.error('Erro ao criar transação no caixa:', cashError)
      return { success: false, error: 'Erro ao registrar entrada no caixa' }
    }

    // 2. Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('receivable_payments')
      .insert({
        account_receivable_id: validatedData.account_receivable_id,
        cash_transaction_id: cashTransaction.id,
        payment_date: validatedData.payment_date,
        payment_value: validatedData.payment_value,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError)
      // Reverter transação do caixa
      await supabase.from('cash_transactions').delete().eq('id', cashTransaction.id)
      return { success: false, error: 'Erro ao registrar pagamento' }
    }

    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/caixa')
    return { success: true, data: payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao registrar recebimento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getReceivablePayments(
  accountReceivableId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('receivable_payments')
      .select(`
        *,
        cash_transaction:cash_transactions(*)
      `)
      .eq('account_receivable_id', accountReceivableId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return { success: false, error: 'Erro ao carregar histórico de pagamentos' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
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

// =====================================================
// BATCH PAYMENTS - Recebimento em Lote
// =====================================================

export async function createBatchReceivablePayments(
  payments: Array<{
    account_receivable_id: string
    payment_value: number
  }>,
  commonData: {
    payment_date: string
    payment_method: string
    bank_account_id: string
    notes?: string
  }
): Promise<ActionResult> {
  try {
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
      return { success: false, error: 'Sem permissão para registrar recebimentos' }
    }

    const results = []
    const failures = []

    // Processar cada recebimento
    for (const payment of payments) {
      const result = await createReceivablePayment({
        ...commonData,
        ...payment,
      })
      
      if (result.success) {
        results.push(result)
      } else {
        failures.push({
          account_id: payment.account_receivable_id,
          error: result.error,
        })
      }
    }

    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} recebimento(s) falharam`,
        data: { processed: results.length, failures },
      }
    }

    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/caixa')
    return { 
      success: true, 
      data: { processed: results.length }
    }
  } catch (error) {
    console.error('Erro no recebimento em lote:', error)
    return { success: false, error: 'Erro inesperado no recebimento em lote' }
  }
}

// =====================================================
// RESUMOS E ESTATÍSTICAS
// =====================================================

export async function getReceivablesSummary(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const today = new Date().toISOString().split('T')[0]

    // Total em aberto
    const { data: openData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

    const totalOpen = openData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencidas
    const { data: overdueData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .eq('status', 'vencido')

    const totalOverdue = overdueData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencendo hoje
    const { data: todayData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .eq('due_date', today)
      .in('status', ['em_aberto', 'parcialmente_pago'])

    const totalDueToday = todayData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    return {
      success: true,
      data: {
        totalOpen,
        totalOverdue,
        totalDueToday,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar resumo:', error)
    return { success: false, error: 'Erro ao carregar resumo' }
  }
}
