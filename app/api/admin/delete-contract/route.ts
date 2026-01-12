import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Código do contrato não fornecido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Busca o contrato
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('code', code)
      .limit(1)

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    const contractId = contracts[0].id

    // Deleta relacionamentos primeiro
    await supabase.from('contract_items').delete().eq('contract_id', contractId)
    await supabase.from('contract_parties').delete().eq('contract_id', contractId)
    await supabase.from('contract_payment_conditions').delete().eq('contract_id', contractId)

    // Deleta o contrato
    const { error } = await supabase.from('contracts').delete().eq('id', contractId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Contrato ${code} deletado com sucesso` })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
