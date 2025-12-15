'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  Contract, 
  ContractWithDetails, 
  ContractFormData,
  ContractParty,
  ContractItem,
  ContractItemParticipant,
  ContractPaymentCondition
} from '@/lib/types'
import { revalidatePath } from 'next/cache'

/**
 * Gera o próximo código de contrato disponível
 * Suporta expansão automática de dígitos:
 * - CT-0001 até CT-9999 (4 dígitos)
 * - CT-10000 em diante (5+ dígitos conforme necessário)
 */
export async function getNextContractCode() {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Erro ao contar contratos:', error)
      // Fallback para timestamp se houver erro
      return `CT-${Date.now().toString().slice(-4)}`
    }

    const nextNumber = (count || 0) + 1
    // Usa no mínimo 4 dígitos, mas expande automaticamente se necessário
    const digits = Math.max(4, String(nextNumber).length)
    return `CT-${String(nextNumber).padStart(digits, '0')}`
  } catch (error) {
    console.error('Erro ao gerar código:', error)
    return `CT-${Date.now().toString().slice(-4)}`
  }
}

/**
 * Verifica se o usuário tem permissão de admin ou editor
 */
async function checkEditPermission() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Usuário não autenticado')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Perfil de usuário não encontrado')
  }

  if (!['admin', 'editor'].includes(profile.role)) {
    throw new Error('Usuário sem permissão para editar contratos')
  }

  return user.id
}

/**
 * Verifica se o usuário tem permissão de admin
 */
async function checkAdminPermission() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Usuário não autenticado')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Perfil de usuário não encontrado')
  }

  if (profile.role !== 'admin') {
    throw new Error('Apenas administradores podem executar esta ação')
  }

  return user.id
}

/**
 * Lista contratos com filtros opcionais
 */
export async function getContracts(filters?: {
  status?: string
  codigo?: string
  dateFrom?: string
  dateTo?: string
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.codigo) {
      query = query.ilike('code', `%${filters.codigo}%`)
    }

    if (filters?.dateFrom) {
      query = query.gte('contract_date', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('contract_date', filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar contratos:', error)
      throw new Error('Erro ao buscar contratos')
    }

    return data as Contract[]
  } catch (error) {
    console.error('Erro ao buscar contratos:', error)
    throw error
  }
}

/**
 * Busca um contrato específico por ID com todos os detalhes
 */
export async function getContractById(id: string): Promise<ContractWithDetails | null> {
  try {
    const supabase = await createClient()
    
    // Busca contrato principal
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (contractError || !contract) {
      console.error('Erro ao buscar contrato:', contractError)
      return null
    }

    // Busca partes
    const { data: parties, error: partiesError } = await supabase
      .from('contract_parties')
      .select('*')
      .eq('contract_id', id)
      .order('side', { ascending: true })

    if (partiesError) {
      console.error('Erro ao buscar partes:', partiesError)
      throw new Error('Erro ao buscar partes do contrato')
    }

    // Busca itens
    const { data: items, error: itemsError } = await supabase
      .from('contract_items')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError)
      throw new Error('Erro ao buscar itens do contrato')
    }

    // Busca participantes de cada item
    const itemsWithParticipants = await Promise.all(
      (items || []).map(async (item: ContractItem) => {
        const { data: participants, error: participantsError } = await supabase
          .from('contract_item_participants')
          .select(`
            *,
            contract_parties!contract_item_participants_party_id_fkey(party_name)
          `)
          .eq('contract_item_id', item.id)

        if (participantsError) {
          console.error('Erro ao buscar participantes:', participantsError)
          return { ...item, participants: [] }
        }

        return {
          ...item,
          participants: (participants || []).map((p: any) => ({
            ...p,
            party_name: p.contract_parties?.party_name || ''
          }))
        }
      })
    )

    // Busca condições de pagamento
    const { data: payment_conditions, error: paymentError } = await supabase
      .from('contract_payment_conditions')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: true })

    if (paymentError) {
      console.error('Erro ao buscar condições de pagamento:', paymentError)
      throw new Error('Erro ao buscar condições de pagamento')
    }

    return {
      ...contract,
      parties: parties || [],
      items: itemsWithParticipants,
      payment_conditions: payment_conditions || []
    } as ContractWithDetails

  } catch (error) {
    console.error('Erro ao buscar contrato por ID:', error)
    throw error
  }
}

/**
 * Cria um novo contrato com todas as suas relações
 */
export async function createContract(data: ContractFormData) {
  try {
    const userId = await checkEditPermission()
    const supabase = await createClient()

    // Gera código do contrato usando a função centralizada
    const contractCode = await getNextContractCode()

    // Insere contrato principal
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        code: contractCode,
        contract_date: data.contract_date,
        notes: data.notes || null,
        attachment_urls: data.attachment_urls || [],
        status: data.status || 'rascunho',
        created_by: userId
      })
      .select()
      .single()

    if (contractError || !contract) {
      console.error('Erro ao criar contrato:', contractError)
      throw new Error('Erro ao criar contrato')
    }

    // Insere partes
    if (data.parties.length > 0) {
      const { error: partiesError } = await supabase
        .from('contract_parties')
        .insert(
          data.parties.map(party => ({
            contract_id: contract.id,
            side: party.side,
            party_type: party.party_type,
            party_id: party.party_id,
            party_name: party.party_name,
            party_document: party.party_document,
            gra_percentage: party.gra_percentage || 0
          }))
        )

      if (partiesError) {
        console.error('Erro ao inserir partes:', partiesError)
        throw new Error('Erro ao inserir partes do contrato')
      }
    }

    // Insere itens e seus participantes
    for (const item of data.items) {
      const { data: insertedItem, error: itemError } = await supabase
        .from('contract_items')
        .insert({
          contract_id: contract.id,
          side: item.side,
          item_type: item.item_type,
          item_id: item.item_id || null,
          description: item.description,
          item_value: item.item_value,
          notes: item.notes || null
        })
        .select()
        .single()

      if (itemError || !insertedItem) {
        console.error('Erro ao inserir item:', itemError)
        throw new Error('Erro ao inserir item do contrato')
      }

      // Insere participantes do item
      if (item.participants && item.participants.length > 0) {
        const { error: participantsError } = await supabase
          .from('contract_item_participants')
          .insert(
            item.participants.map(participant => ({
              contract_item_id: insertedItem.id,
              party_id: participant.party_id,
              percentage: participant.percentage
            }))
          )

        if (participantsError) {
          console.error('Erro ao inserir participantes:', participantsError)
          throw new Error('Erro ao inserir participantes do item')
        }
      }
    }

    // Insere condições de pagamento
    if (data.payment_conditions && data.payment_conditions.length > 0) {
      const { error: paymentError } = await supabase
        .from('contract_payment_conditions')
        .insert(
          data.payment_conditions.map(condition => ({
            contract_id: contract.id,
            condition_value: condition.condition_value,
            direction: condition.direction,
            payment_type: condition.payment_type,
            installments: condition.installments || 1,
            frequency: condition.frequency || null,
            start_date: condition.start_date,
            payment_method: condition.payment_method || null,
            notes: condition.notes || null
          }))
        )

      if (paymentError) {
        console.error('Erro ao inserir condições de pagamento:', paymentError)
        throw new Error('Erro ao inserir condições de pagamento')
      }
    }

    revalidatePath('/contratos')
    return { success: true, contract }

  } catch (error: any) {
    console.error('Erro ao criar contrato:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualiza um contrato existente
 */
export async function updateContract(id: string, data: Partial<ContractFormData>) {
  try {
    await checkEditPermission()
    const supabase = await createClient()

    const updateData: any = {}
    if (data.contract_date) updateData.contract_date = data.contract_date
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.attachment_urls) updateData.attachment_urls = data.attachment_urls
    if (data.status) updateData.status = data.status

    const { error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar contrato:', error)
      throw new Error('Erro ao atualizar contrato')
    }

    revalidatePath('/contratos')
    revalidatePath(`/contratos/${id}`)
    return { success: true }

  } catch (error: any) {
    console.error('Erro ao atualizar contrato:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deleta um contrato (apenas admin)
 */
export async function deleteContract(id: string) {
  try {
    await checkAdminPermission()
    const supabase = await createClient()

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar contrato:', error)
      throw new Error('Erro ao deletar contrato')
    }

    revalidatePath('/contratos')
    return { success: true }

  } catch (error: any) {
    console.error('Erro ao deletar contrato:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Ativa um contrato (verifica se está balanceado)
 */
export async function activateContract(id: string) {
  try {
    await checkEditPermission()
    const supabase = await createClient()

    // Busca contrato para verificar balanço
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('balance, status')
      .eq('id', id)
      .single()

    if (fetchError || !contract) {
      throw new Error('Contrato não encontrado')
    }

    if (contract.status !== 'rascunho') {
      throw new Error('Apenas contratos em rascunho podem ser ativados')
    }

    // Verifica se está balanceado
    if (Math.abs(contract.balance) > 0.01) {
      throw new Error(`Contrato não está balanceado. Diferença: R$ ${contract.balance.toFixed(2)}`)
    }

    // Ativa contrato
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'ativo' })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao ativar contrato:', updateError)
      throw new Error('Erro ao ativar contrato')
    }

    revalidatePath('/contratos')
    revalidatePath(`/contratos/${id}`)
    return { success: true }

  } catch (error: any) {
    console.error('Erro ao ativar contrato:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Busca contratos com pesquisa avançada
 */
export async function searchContracts(searchTerm: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .or(`code.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erro ao buscar contratos:', error)
      throw new Error('Erro ao buscar contratos')
    }

    return data as Contract[]
  } catch (error) {
    console.error('Erro na pesquisa:', error)
    throw error
  }
}
