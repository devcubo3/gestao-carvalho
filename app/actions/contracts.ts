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
 * Verifica se um item já está vinculado a outro contrato ativo
 * @param itemId - ID do item a verificar
 * @param itemType - Tipo do item (imovel, veiculo, credito, empreendimento)
 * @param excludeContractId - ID do contrato a excluir da verificação (para edição)
 * @returns Objeto com status de vínculo e detalhes do contrato se vinculado
 */
export async function checkItemLinkedToContract(
  itemId: string,
  itemType: string,
  excludeContractId?: string
) {
  try {
    const supabase = await createClient()

    // Normaliza o tipo do item para o formato do banco
    const dbItemType = itemType.toLowerCase()
      .replace('imóveis', 'imovel')
      .replace('veículos', 'veiculo')
      .replace('créditos', 'credito')
      .replace('empreendimentos', 'empreendimento')

    // Busca contratos ativos que contêm este item
    let query = supabase
      .from('contract_items')
      .select(`
        id,
        contract_id,
        side,
        description,
        item_value,
        contracts (
          id,
          code,
          description,
          status,
          date
        )
      `)
      .eq('item_id', itemId)
      .eq('item_type', dbItemType)

    // Se estiver editando um contrato, exclui ele da verificação
    if (excludeContractId) {
      query = query.neq('contract_id', excludeContractId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao verificar vinculação do item:', error)
      return {
        isLinked: false,
        error: 'Erro ao verificar vinculação do item'
      }
    }

    if (data && data.length > 0) {
      // Filtra apenas contratos ativos/rascunho após o fetch
      const activeItems = data.filter((item: any) => {
        const contract = item.contracts
        return contract && ['rascunho', 'ativo'].includes(contract.status)
      })

      if (activeItems.length > 0) {
        const linkedItem = activeItems[0]
        const contract = linkedItem.contracts as any
        
        return {
          isLinked: true,
          contractId: contract.id,
          contractCode: contract.code,
          contractDescription: contract.description,
          contractStatus: contract.status,
          contractDate: contract.date,
          side: linkedItem.side,
          itemValue: linkedItem.item_value
        }
      }
    }

    return {
      isLinked: false
    }
  } catch (error) {
    console.error('Erro ao verificar vinculação:', error)
    return {
      isLinked: false,
      error: 'Erro ao verificar vinculação do item'
    }
  }
}

/**
 * Calcula a data de vencimento de uma parcela com base na frequência
 */
function calculateDueDate(startDate: string, installmentIndex: number, frequency: string | null): string {
  const date = new Date(startDate)
  
  if (!frequency || installmentIndex === 0) {
    return startDate
  }
  
  switch (frequency.toLowerCase()) {
    case 'semanal':
      date.setDate(date.getDate() + (installmentIndex * 7))
      break
    case 'mensal':
      date.setMonth(date.getMonth() + installmentIndex)
      break
    case 'trimestral':
      date.setMonth(date.getMonth() + (installmentIndex * 3))
      break
    case 'semestral':
      date.setMonth(date.getMonth() + (installmentIndex * 6))
      break
    case 'anual':
      date.setFullYear(date.getFullYear() + installmentIndex)
      break
    default:
      date.setMonth(date.getMonth() + installmentIndex)
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * Gera registros financeiros a partir das condições de pagamento do contrato
 * - Entrada + Único → Caixa (receita)
 * - Entrada + Parcelado → Contas a Receber
 * - Saída + Único → Caixa (despesa)
 * - Saída + Parcelado → Contas a Pagar
 */
async function generateFinancialRecordsFromPaymentConditions(
  supabase: any,
  contractId: string,
  contractCode: string,
  contractDate: string,
  paymentConditions: any[],
  userId: string
) {
  // Buscar conta bancária padrão para transações de caixa
  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('id, balance')
    .eq('status', 'ativo')
    .limit(1)

  const defaultBankAccountId = bankAccounts?.[0]?.id
  let currentBalance = Number(bankAccounts?.[0]?.balance || 0)

  console.log('=== INTEGRAÇÃO FINANCEIRA ===')
  console.log('Conta bancária encontrada:', defaultBankAccountId)
  console.log('Saldo inicial:', currentBalance)
  console.log('Condições de pagamento:', paymentConditions)

  for (const condition of paymentConditions) {
    const isEntrada = condition.direction === 'entrada'
    const isUnico = condition.payment_type === 'unico'
    const numParcelas = condition.installments || 1
    const valorTotal = Number(condition.condition_value)
    const valorParcela = valorTotal / numParcelas

    console.log('→ Processando condição:', {
      direction: condition.direction,
      type: condition.payment_type,
      value: valorTotal,
      installments: numParcelas
    })

    if (isEntrada) {
      if (isUnico) {
        // Entrada + Único → Registra no Caixa como RECEITA
        console.log('→ Processando ENTRADA ÚNICA:', { valorTotal, defaultBankAccountId })
        
        if (!defaultBankAccountId) {
          console.warn('Nenhuma conta bancária ativa encontrada para registrar transação de caixa')
          continue
        }

        const balanceAfter = currentBalance + valorTotal

        console.log('Criando transação de caixa:', {
          valor: valorTotal,
          saldoAntes: currentBalance,
          saldoDepois: balanceAfter
        })

        const { data: insertedTransaction, error: transactionError } = await supabase.from('cash_transactions').insert({
          bank_account_id: defaultBankAccountId,
          transaction_date: contractDate,
          type: 'entrada',
          description: `Entrada Única - Contrato ${contractCode}`,
          vinculo: 'Contratos',
          forma: 'Caixa',
          centro_custo: 'Vendas',
          value: valorTotal,
          balance_after: balanceAfter,
          contract_id: contractId,
          status: 'efetivado',
          created_by: userId
        }).select()

        if (transactionError) {
          console.error('Erro ao criar transação de caixa:', transactionError)
        } else {
          console.log('✓ Transação de caixa criada:', insertedTransaction)
        }

        // Atualizar saldo da conta bancária
        await supabase
          .from('bank_accounts')
          .update({ balance: balanceAfter })
          .eq('id', defaultBankAccountId)
        
        // Atualizar saldo local para próximas transações
        currentBalance = balanceAfter

      } else {
        // Entrada + Parcelado → Cria Contas a Receber
        console.log('→ Processando ENTRADA PARCELADA:', { numParcelas, valorParcela })
        
        const groupId = crypto.randomUUID()

        for (let i = 0; i < numParcelas; i++) {
          const dueDate = calculateDueDate(condition.start_date, i, condition.frequency)
          const installmentCode = `${contractCode}-R${String(i + 1).padStart(2, '0')}`

          const { error: receivableError } = await supabase.from('accounts_receivable').insert({
            code: installmentCode,
            contract_id: contractId,
            description: `Parcela ${i + 1}/${numParcelas} - Contrato ${contractCode}`,
            counterparty: 'Cliente do Contrato',
            original_value: valorParcela,
            remaining_value: valorParcela,
            due_date: dueDate,
            registration_date: contractDate,
            status: 'pendente',
            vinculo: 'Contratos',
            centro_custo: 'Vendas',
            installment_current: i + 1,
            installment_total: numParcelas,
            notes: `Gerado automaticamente pelo contrato ${contractCode}`,
            created_by: userId
          })
          
          if (receivableError) {
            console.error(`Erro ao criar conta a receber ${installmentCode}:`, receivableError)
          } else {
            console.log(`✓ Conta a receber criada: ${installmentCode}`)
          }
        }
      }
    } else {
      // Saída
      if (isUnico) {
        // Saída + Único → Registra no Caixa como DESPESA
        if (!defaultBankAccountId) {
          console.warn('Nenhuma conta bancária ativa encontrada para registrar transação de caixa')
          continue
        }

        const balanceAfter = currentBalance - valorTotal

        const { data: insertedTransaction, error: transactionError } = await supabase.from('cash_transactions').insert({
          bank_account_id: defaultBankAccountId,
          transaction_date: contractDate,
          type: 'saida',
          description: `Saída Única - Contrato ${contractCode}`,
          vinculo: 'Contratos',
          forma: 'Caixa',
          centro_custo: 'Operacional',
          value: valorTotal,
          balance_after: balanceAfter,
          contract_id: contractId,
          status: 'efetivado',
          created_by: userId
        }).select()

        if (transactionError) {
          console.error('Erro ao criar transação de caixa (saída):', transactionError)
        } else {
          console.log('✓ Transação de caixa (saída) criada:', insertedTransaction)
        }

        // Atualizar saldo da conta bancária
        await supabase
          .from('bank_accounts')
          .update({ balance: balanceAfter })
          .eq('id', defaultBankAccountId)
        
        // Atualizar saldo local para próximas transações
        currentBalance = balanceAfter

      } else {
        // Saída + Parcelado → Cria Contas a Pagar
        const groupId = crypto.randomUUID()

        for (let i = 0; i < numParcelas; i++) {
          const dueDate = calculateDueDate(condition.start_date, i, condition.frequency)
          const installmentCode = `${contractCode}-P${String(i + 1).padStart(2, '0')}`

          await supabase.from('accounts_payable').insert({
            code: installmentCode,
            description: `Parcela ${i + 1}/${numParcelas} - Contrato ${contractCode}`,
            original_value: valorParcela,
            remaining_value: valorParcela,
            due_date: dueDate,
            registration_date: contractDate,
            status: 'pendente',
            vinculo: 'Contratos',
            centro_custo: 'Operacional',
            installment_total: numParcelas,
            installment_value: valorParcela,
            periodicity: condition.frequency,
            installment_group_id: groupId,
            notes: `Gerado automaticamente pelo contrato ${contractCode}`,
            created_by: userId
          })
        }
      }
    }
  }
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
      .select(`
        *,
        parties:contract_parties(
          id,
          party_name,
          party_type,
          side
        )
      `)
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

    return data as any[]
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
    // Verificar se o usuário é admin
    await checkAdminPermission()
    
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
  let contractId: string | null = null
  
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

    contractId = contract.id

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
      console.log('Inserindo item:', {
        contract_id: contract.id,
        side: item.side,
        item_type: item.item_type,
        item_id: item.item_id,
        description: item.description,
        item_value: item.item_value,
      })
      
      // Valida se o item existe antes de inserir
      if (item.item_id) {
        let tableCheck = ''
        switch (item.item_type) {
          case 'imovel': tableCheck = 'properties'; break
          case 'veiculo': tableCheck = 'vehicles'; break
          case 'credito': tableCheck = 'credits'; break
          case 'empreendimento': tableCheck = 'developments'; break
        }
        
        if (tableCheck) {
          const { data: existingItem } = await supabase
            .from(tableCheck)
            .select('id')
            .eq('id', item.item_id)
            .single()
          
          if (!existingItem) {
            console.error(`Item ${item.item_type} com ID ${item.item_id} não encontrado na tabela ${tableCheck}`)
            throw new Error(`Item ${item.item_type} não encontrado no banco de dados`)
          }
        }
      }
      
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
        console.error('Erro detalhado ao inserir item:', {
          error: itemError,
          message: itemError?.message,
          details: itemError?.details,
          hint: itemError?.hint,
          code: itemError?.code
        })
        throw new Error(`Erro ao inserir item do contrato: ${itemError?.message || 'Erro desconhecido'}`)
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

      // Integração com módulo financeiro
      await generateFinancialRecordsFromPaymentConditions(
        supabase,
        contract.id,
        contractCode,
        data.contract_date,
        data.payment_conditions,
        userId
      )
    }

    revalidatePath('/contratos')
    revalidatePath('/financeiro/caixa')
    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/contas-pagar')
    return { success: true, contract }

  } catch (error: any) {
    console.error('Erro ao criar contrato:', error)
    
    // Rollback: deleta o contrato se foi criado mas houve erro nas etapas seguintes
    if (contractId) {
      const supabase = await createClient()
      await supabase.from('contracts').delete().eq('id', contractId)
      console.log('Contrato deletado devido a erro:', contractId)
    }
    
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

/**
 * Exclui um contrato e todos os registros financeiros vinculados
 * - Remove transações de caixa (cash_transactions)
 * - Remove contas a receber (accounts_receivable)
 * - Remove contas a pagar (accounts_payable)
 * - Remove participantes dos itens (contract_item_participants)
 * - Remove itens (contract_items)
 * - Remove condições de pagamento (contract_payment_conditions)
 * - Remove partes (contract_parties)
 * - Remove contrato (contracts)
 */
export async function deleteContract(id: string) {
  try {
    await checkAdminPermission()
    const supabase = await createClient()

    console.log('=== INICIANDO EXCLUSÃO DO CONTRATO ===')
    console.log('Contract ID:', id)

    // Buscar informações do contrato antes de excluir
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('code')
      .eq('id', id)
      .single()

    if (fetchError || !contract) {
      throw new Error('Contrato não encontrado')
    }

    const contractCode = contract.code
    console.log('Código do contrato:', contractCode)

    // 1. Excluir transações de caixa vinculadas ao contrato
    const { data: cashTransactions, error: cashSelectError } = await supabase
      .from('cash_transactions')
      .select('id, value, type, bank_account_id, balance_after')
      .eq('contract_id', id)

    if (!cashSelectError && cashTransactions && cashTransactions.length > 0) {
      console.log(`Encontradas ${cashTransactions.length} transações de caixa`)
      
      // Reverter saldos das contas bancárias
      for (const transaction of cashTransactions) {
        const adjustmentValue = transaction.type === 'entrada' 
          ? -transaction.value  // Se foi entrada, subtrair
          : transaction.value   // Se foi saída, somar

        const { data: currentAccount } = await supabase
          .from('bank_accounts')
          .select('balance')
          .eq('id', transaction.bank_account_id)
          .single()

        if (currentAccount) {
          const newBalance = Number(currentAccount.balance) + adjustmentValue
          
          await supabase
            .from('bank_accounts')
            .update({ balance: newBalance })
            .eq('id', transaction.bank_account_id)
          
          console.log(`Saldo revertido: ${currentAccount.balance} → ${newBalance}`)
        }
      }

      // Excluir transações
      const { error: cashDeleteError } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('contract_id', id)

      if (cashDeleteError) {
        console.error('Erro ao excluir transações de caixa:', cashDeleteError)
        throw new Error('Erro ao excluir transações de caixa')
      }
      console.log('✓ Transações de caixa excluídas')
    }

    // 2. Excluir contas a receber
    const { data: receivables, error: receivablesSelectError } = await supabase
      .from('accounts_receivable')
      .select('id')
      .eq('contract_id', id)

    if (!receivablesSelectError && receivables && receivables.length > 0) {
      console.log(`Encontradas ${receivables.length} contas a receber`)
      
      const { error: receivablesDeleteError } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('contract_id', id)

      if (receivablesDeleteError) {
        console.error('Erro ao excluir contas a receber:', receivablesDeleteError)
        throw new Error('Erro ao excluir contas a receber')
      }
      console.log('✓ Contas a receber excluídas')
    }

    // 3. Excluir contas a pagar (não tem contract_id direto, usar código)
    const { data: payables, error: payablesSelectError } = await supabase
      .from('accounts_payable')
      .select('id')
      .like('code', `${contractCode}%`)

    if (!payablesSelectError && payables && payables.length > 0) {
      console.log(`Encontradas ${payables.length} contas a pagar`)
      
      const { error: payablesDeleteError } = await supabase
        .from('accounts_payable')
        .delete()
        .like('code', `${contractCode}%`)

      if (payablesDeleteError) {
        console.error('Erro ao excluir contas a pagar:', payablesDeleteError)
        throw new Error('Erro ao excluir contas a pagar')
      }
      console.log('✓ Contas a pagar excluídas')
    }

    // 4. Excluir participantes dos itens
    const { data: items } = await supabase
      .from('contract_items')
      .select('id')
      .eq('contract_id', id)

    if (items && items.length > 0) {
      const itemIds = items.map(item => item.id)
      
      const { error: participantsError } = await supabase
        .from('contract_item_participants')
        .delete()
        .in('contract_item_id', itemIds)

      if (participantsError) {
        console.error('Erro ao excluir participantes dos itens:', participantsError)
        throw new Error('Erro ao excluir participantes dos itens')
      }
      console.log('✓ Participantes dos itens excluídos')
    }

    // 5. Excluir itens do contrato
    const { error: itemsError } = await supabase
      .from('contract_items')
      .delete()
      .eq('contract_id', id)

    if (itemsError) {
      console.error('Erro ao excluir itens:', itemsError)
      throw new Error('Erro ao excluir itens do contrato')
    }
    console.log('✓ Itens do contrato excluídos')

    // 6. Excluir condições de pagamento
    const { error: paymentsError } = await supabase
      .from('contract_payment_conditions')
      .delete()
      .eq('contract_id', id)

    if (paymentsError) {
      console.error('Erro ao excluir condições de pagamento:', paymentsError)
      throw new Error('Erro ao excluir condições de pagamento')
    }
    console.log('✓ Condições de pagamento excluídas')

    // 7. Excluir partes do contrato
    const { error: partiesError } = await supabase
      .from('contract_parties')
      .delete()
      .eq('contract_id', id)

    if (partiesError) {
      console.error('Erro ao excluir partes:', partiesError)
      throw new Error('Erro ao excluir partes do contrato')
    }
    console.log('✓ Partes do contrato excluídas')

    // 8. Excluir o contrato
    const { error: contractError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (contractError) {
      console.error('Erro ao excluir contrato:', contractError)
      throw new Error('Erro ao excluir contrato')
    }
    console.log('✓ Contrato excluído')

    console.log('=== EXCLUSÃO CONCLUÍDA COM SUCESSO ===')

    revalidatePath('/contratos')
    revalidatePath('/financeiro/caixa')
    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/contas-pagar')
    
    return { success: true, message: `Contrato ${contractCode} e todos os registros vinculados foram excluídos com sucesso.` }

  } catch (error: any) {
    console.error('Erro ao excluir contrato:', error)
    return { success: false, error: error.message }
  }
}
