'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const accountPayableSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  installment_value: z.number().positive('Valor da parcela deve ser maior que zero'),
  due_date: z.string().or(z.date()),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  installment_total: z.number().int().positive('Número de parcelas deve ser maior que zero').default(1),
  periodicity: z.enum(['semanal', 'mensal', 'semestral', 'anual']).default('mensal'),
})

const payablePaymentSchema = z.object({
  account_payable_id: z.string().uuid(),
  payment_date: z.string().or(z.date()),
  payment_value: z.number().positive('Valor deve ser maior que zero'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  bank_account_id: z.string().uuid('Conta bancária é obrigatória'),
  notes: z.string().optional().nullable(),
})

// =====================================================
// Types
// =====================================================

export type AccountPayableFormData = z.infer<typeof accountPayableSchema>
export type PayablePaymentFormData = z.infer<typeof payablePaymentSchema>

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
// ACCOUNTS PAYABLE - CRUD
// =====================================================

export async function createAccountPayable(
  data: AccountPayableFormData
): Promise<ActionResult> {
  try {
    const validatedData = accountPayableSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para criar contas a pagar' }
    }

    // Calcular valor total
    const originalValue = validatedData.installment_value * validatedData.installment_total

    // Criar conta única ou múltiplas parcelas
    if (validatedData.installment_total === 1) {
      // CONTA ÚNICA
      const { data: account, error } = await supabase
        .from('accounts_payable')
        .insert({
          description: validatedData.description,
          original_value: originalValue,
          remaining_value: originalValue,
          due_date: validatedData.due_date,
          vinculo: validatedData.vinculo,
          centro_custo: validatedData.centro_custo,
          installment_total: 1,
          installment_value: validatedData.installment_value,
          periodicity: validatedData.periodicity,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar conta:', error)
        console.error('Dados enviados:', {
          description: validatedData.description,
          original_value: originalValue,
          remaining_value: originalValue,
          due_date: validatedData.due_date,
          vinculo: validatedData.vinculo,
          centro_custo: validatedData.centro_custo,
          installment_total: 1,
          installment_value: validatedData.installment_value,
          periodicity: validatedData.periodicity,
          created_by: user.id,
        })
        return { success: false, error: `Erro ao criar conta a pagar: ${error.message || JSON.stringify(error)}` }
      }

      revalidatePath('/financeiro/contas-pagar')
      return { success: true, data: account }
    } else {
      // MÚLTIPLAS PARCELAS - Criar grupo UUID
      const installmentGroupId = crypto.randomUUID()
      const accounts = []
      const baseDate = new Date(validatedData.due_date)

      for (let i = 0; i < validatedData.installment_total; i++) {
        const dueDate = new Date(baseDate)
        
        // Aplicar periodicidade correta
        switch (validatedData.periodicity) {
          case 'semanal':
            dueDate.setDate(dueDate.getDate() + (i * 7))
            break
          case 'mensal':
            dueDate.setMonth(dueDate.getMonth() + i)
            break
          case 'semestral':
            dueDate.setMonth(dueDate.getMonth() + (i * 6))
            break
          case 'anual':
            dueDate.setFullYear(dueDate.getFullYear() + i)
            break
        }

        accounts.push({
          description: `${validatedData.description} - Parcela ${i + 1}/${validatedData.installment_total}`,
          original_value: validatedData.installment_value,
          remaining_value: validatedData.installment_value,
          due_date: dueDate.toISOString().split('T')[0],
          vinculo: validatedData.vinculo,
          centro_custo: validatedData.centro_custo,
          installment_total: validatedData.installment_total,
          installment_value: validatedData.installment_value,
          periodicity: validatedData.periodicity,
          installment_group_id: installmentGroupId,
          created_by: user.id,
        })
      }

      const { data: createdAccounts, error } = await supabase
        .from('accounts_payable')
        .insert(accounts)
        .select()

      if (error) {
        console.error('Erro ao criar parcelas:', error)
        console.error('Número de parcelas:', accounts.length)
        console.error('Primeira parcela:', accounts[0])
        return { success: false, error: `Erro ao criar parcelas: ${error.message || JSON.stringify(error)}` }
      }

      revalidatePath('/financeiro/contas-pagar')
      return { 
        success: true, 
        data: createdAccounts
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro geral ao criar conta a pagar:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar conta a pagar'
    }
  }
}

export async function getAccountsPayable(filters?: {
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
      .from('accounts_payable')
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
      console.error('Erro ao buscar contas a pagar:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function updateAccountPayable(
  id: string,
  data: Partial<Pick<AccountPayableFormData, 'description' | 'due_date' | 'vinculo' | 'centro_custo'>>
): Promise<ActionResult> {
  try {
    const updateSchema = z.object({
      description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres').optional(),
      due_date: z.string().or(z.date()).optional(),
      vinculo: z.string().min(1, 'Vínculo é obrigatório').optional(),
      centro_custo: z.string().min(1, 'Centro de custo é obrigatório').optional(),
    })
    
    const validatedData = updateSchema.parse(data)
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
      .from('accounts_payable')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta' }
    }

    revalidatePath('/financeiro/contas-pagar')
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

export async function deleteAccountPayable(id: string): Promise<ActionResult> {
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
      return { success: false, error: 'Apenas administradores podem excluir contas' }
    }

    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir conta:', error)
      return { success: false, error: 'Erro ao excluir conta' }
    }

    revalidatePath('/financeiro/contas-pagar')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// PAYABLE PAYMENTS - Pagamentos
// =====================================================

export async function createPayablePayment(
  data: PayablePaymentFormData
): Promise<ActionResult> {
  try {
    const validatedData = payablePaymentSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para registrar pagamentos' }
    }

    // Buscar conta a pagar
    const { data: payable } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', validatedData.account_payable_id)
      .single()

    if (!payable) {
      return { success: false, error: 'Conta a pagar não encontrada' }
    }

    // Validar valor do pagamento
    if (validatedData.payment_value > payable.remaining_value) {
      return { 
        success: false, 
        error: `Valor de pagamento (${validatedData.payment_value}) não pode ser maior que o valor restante (${payable.remaining_value})` 
      }
    }

    // Verificar saldo bancário suficiente
    if (validatedData.bank_account_id) {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('balance, name')
        .eq('id', validatedData.bank_account_id)
        .single()

      if (!bankAccount) {
        return { success: false, error: 'Conta bancária não encontrada' }
      }

      const paymentAmount = Math.abs(validatedData.payment_value)
      if (Number(bankAccount.balance) < paymentAmount) {
        return { 
          success: false, 
          error: `Saldo insuficiente em ${bankAccount.name}. Saldo disponível: R$ ${Number(bankAccount.balance).toFixed(2)}` 
        }
      }
    }

    // 1. Criar transação no caixa (saída)
    const { data: cashTransaction, error: cashError } = await supabase
      .from('cash_transactions')
      .insert({
        bank_account_id: validatedData.bank_account_id,
        transaction_date: validatedData.payment_date,
        type: 'saida',
        description: `Pagamento: ${payable.description}`,
        vinculo: payable.vinculo,
        forma: 'Caixa',
        centro_custo: payable.centro_custo,
        value: validatedData.payment_value,
        account_payable_id: validatedData.account_payable_id,
        notes: validatedData.notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (cashError) {
      console.error('Erro ao criar transação no caixa:', cashError)
      return { success: false, error: 'Erro ao registrar saída no caixa' }
    }

    // 2. Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payable_payments')
      .insert({
        account_payable_id: validatedData.account_payable_id,
        cash_transaction_id: cashTransaction.id,
        payment_date: validatedData.payment_date,
        payment_value: validatedData.payment_value,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes || null,
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

    revalidatePath('/financeiro/contas-pagar')
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
    console.error('Erro ao registrar pagamento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getPayablePayments(
  accountPayableId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('payable_payments')
      .select(`
        *,
        cash_transaction:cash_transactions(*)
      `)
      .eq('account_payable_id', accountPayableId)
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
// BATCH PAYMENTS - Pagamentos em Lote
// =====================================================

export async function createBatchPayablePayments(
  payments: Array<{
    account_payable_id: string
    payment_value: number
  }>,
  commonData: {
    payment_date: string
    payment_method: string
    bank_account_id: string
  }
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Processar cada pagamento
    const results = []
    for (const payment of payments) {
      const result = await createPayablePayment({
        ...commonData,
        ...payment,
        notes: null, // Pagamento em lote não tem notas individuais
      })
      results.push(result)
    }

    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} pagamento(s) falharam`,
        data: { failures },
      }
    }

    revalidatePath('/financeiro/contas-pagar')
    revalidatePath('/financeiro/caixa')
    return { 
      success: true, 
      data: { processed: results.length }
    }
  } catch (error) {
    console.error('Erro no pagamento em lote:', error)
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
// RESUMOS E ESTATÍSTICAS
// =====================================================

export async function getPayablesSummary(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const today = new Date().toISOString().split('T')[0]

    // Total em aberto
    const { data: openData } = await supabase
      .from('accounts_payable')
      .select('remaining_value')
      .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

    const totalOpen = openData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencidas
    const { data: overdueData } = await supabase
      .from('accounts_payable')
      .select('remaining_value')
      .eq('status', 'vencido')

    const totalOverdue = overdueData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencendo hoje
    const { data: todayData } = await supabase
      .from('accounts_payable')
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
