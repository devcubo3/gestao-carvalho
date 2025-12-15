'use server'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export type BankAccount = {
  id: string
  name: string
  type: string
  code: string | null
  balance: number
  initial_balance: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// BUSCAR CONTAS BANCÁRIAS ATIVAS
// =====================================================

export async function getBankAccounts(): Promise<ActionResult<BankAccount[]>> {
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
      console.error('❌ Erro ao buscar contas bancárias:', error)
      return { success: false, error: 'Erro ao carregar contas bancárias' }
    }

    console.log(`✅ ${data?.length || 0} contas bancárias carregadas`)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado ao buscar contas bancárias' }
  }
}

// =====================================================
// BUSCAR UMA CONTA BANCÁRIA POR ID
// =====================================================

export async function getBankAccountById(id: string): Promise<ActionResult<BankAccount>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar conta bancária:', error)
      return { success: false, error: 'Conta bancária não encontrada' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar conta:', error)
    return { success: false, error: 'Erro inesperado ao buscar conta bancária' }
  }
}
