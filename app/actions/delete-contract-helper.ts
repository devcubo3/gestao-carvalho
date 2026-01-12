/**
 * Script para deletar contrato específico
 * Uso: Altere o CONTRACT_CODE para o código do contrato que deseja deletar
 */

import { createClient } from '@/lib/supabase/server'

const CONTRACT_CODE = 'CT-0001' // Altere para o código do contrato que deseja deletar

export async function deleteContractByCode() {
  try {
    const supabase = await createClient()

    // Busca o contrato pelo código
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('code', CONTRACT_CODE)
      .limit(1)

    if (fetchError) {
      console.error('❌ Erro ao buscar contrato:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!contracts || contracts.length === 0) {
      console.log('ℹ️ Contrato não encontrado:', CONTRACT_CODE)
      return { success: false, error: 'Contrato não encontrado' }
    }

    const contract = contracts[0]
    console.log(`📄 Contrato encontrado: ${contract.code} (ID: ${contract.id})`)

    // Deleta itens do contrato (cascade deve deletar participantes)
    await supabase.from('contract_items').delete().eq('contract_id', contract.id)
    console.log('✅ Itens deletados')

    // Deleta partes do contrato
    await supabase.from('contract_parties').delete().eq('contract_id', contract.id)
    console.log('✅ Partes deletadas')

    // Deleta condições de pagamento
    await supabase.from('contract_payment_conditions').delete().eq('contract_id', contract.id)
    console.log('✅ Condições de pagamento deletadas')

    // Deleta o contrato
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contract.id)

    if (deleteError) {
      console.error('❌ Erro ao deletar contrato:', deleteError)
      return { success: false, error: deleteError.message }
    }

    console.log('✅ Contrato deletado com sucesso!')
    return { success: true }

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return { success: false, error: error.message }
  }
}
