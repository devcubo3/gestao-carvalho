import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar pessoas
    const { data: people } = await supabase
      .from('people')
      .select('id, full_name')
      .order('full_name', { ascending: true })
    
    // Buscar empresas
    const { data: companies } = await supabase
      .from('companies')
      .select('id, company_name')
      .order('company_name', { ascending: true })
    
    // Buscar usuários (profiles)
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name', { ascending: true })
    
    // Combinar todos os resultados
    const counterparties = [
      ...(people || []).map(p => ({ id: p.id, name: p.full_name, type: 'Pessoa' })),
      ...(companies || []).map(c => ({ id: c.id, name: c.company_name, type: 'Empresa' })),
      ...(users || []).map(u => ({ id: u.id, name: u.full_name, type: 'Usuário' }))
    ]
    
    // Ordenar por nome
    counterparties.sort((a, b) => a.name.localeCompare(b.name))
    
    return NextResponse.json(counterparties)
  } catch (error) {
    console.error('Erro ao buscar contrapartes:', error)
    return NextResponse.json({ error: 'Erro ao buscar contrapartes' }, { status: 500 })
  }
}
