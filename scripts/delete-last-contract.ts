/**
 * Script para deletar o último contrato criado incorretamente
 * Execute: npx tsx scripts/delete-last-contract.ts
 */

import { createClient } from '@supabase/supabase-js'

async function deleteLastContract() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não configuradas')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Busca o último contrato (CT-0001)
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('❌ Erro ao buscar contrato:', fetchError)
      return
    }

    if (!contracts || contracts.length === 0) {
      console.log('ℹ️ Nenhum contrato encontrado')
      return
    }

    const contract = contracts[0]
    console.log(`📄 Contrato encontrado: ${contract.code} (ID: ${contract.id})`)
    console.log(`   Criado em: ${contract.created_at}`)
    console.log(`   Status: ${contract.status}`)

    // Deleta itens do contrato (cascade deve deletar participantes)
    const { error: itemsError } = await supabase
      .from('contract_items')
      .delete()
      .eq('contract_id', contract.id)

    if (itemsError) {
      console.error('❌ Erro ao deletar itens:', itemsError)
    } else {
      console.log('✅ Itens deletados')
    }

    // Deleta partes do contrato
    const { error: partiesError } = await supabase
      .from('contract_parties')
      .delete()
      .eq('contract_id', contract.id)

    if (partiesError) {
      console.error('❌ Erro ao deletar partes:', partiesError)
    } else {
      console.log('✅ Partes deletadas')
    }

    // Deleta condições de pagamento
    const { error: paymentError } = await supabase
      .from('contract_payment_conditions')
      .delete()
      .eq('contract_id', contract.id)

    if (paymentError) {
      console.error('❌ Erro ao deletar condições de pagamento:', paymentError)
    } else {
      console.log('✅ Condições de pagamento deletadas')
    }

    // Deleta o contrato
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contract.id)

    if (deleteError) {
      console.error('❌ Erro ao deletar contrato:', deleteError)
    } else {
      console.log('✅ Contrato deletado com sucesso!')
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

deleteLastContract()
