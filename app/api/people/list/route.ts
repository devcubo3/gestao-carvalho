import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('people')
      .select('id, full_name')
      .order('full_name', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar pessoas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: 'Erro ao buscar pessoas' }, { status: 500 })
  }
}
