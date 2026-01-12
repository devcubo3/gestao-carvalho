'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PropertyType = 'casa' | 'apartamento' | 'terreno' | 'comercial'
export type PropertyStatus = 'disponivel' | 'comprometido' | 'vendido'

export interface PropertyFormData {
  code?: string
  identification: string
  type: PropertyType
  classe?: string
  subclasse?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area: number
  registry: string
  gra_percentage?: number
  ult_value?: number
  sale_value: number
  sale_value_gra?: number
  status?: PropertyStatus
  notes?: string
}

export interface Property extends PropertyFormData {
  id: string
  code: string
  sale_value: number
  gra_percentage: number
  ult_value: number
  sale_value_gra: number
  status: PropertyStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// LISTAR IMÓVEIS
// =====================================================
export async function getProperties() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('code', { ascending: true })

    if (error) {
      console.error('Error fetching properties:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getProperties:', error)
    return { success: false, error: 'Erro ao buscar imóveis' }
  }
}

// =====================================================
// BUSCAR IMÓVEL POR ID
// =====================================================
export async function getPropertyById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getPropertyById:', error)
    return { success: false, error: 'Erro ao buscar imóvel' }
  }
}

// =====================================================
// CRIAR IMÓVEL
// =====================================================
export async function createProperty(formData: PropertyFormData) {
  try {
    const supabase = await createClient()

    // Verificar permissão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Usuário sem permissão para criar imóveis' }
    }

    // Gerar código se não fornecido
    let code = formData.code
    if (!code) {
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_property_code')

      if (codeError) {
        console.error('Error generating code:', codeError)
        return { success: false, error: 'Erro ao gerar código do imóvel' }
      }

      code = codeData
    }

    // Validações
    if (!formData.identification || !formData.type || !formData.street || 
        !formData.number || !formData.neighborhood || !formData.city || 
        !formData.state || !formData.zip_code || !formData.area || 
        !formData.registry || formData.sale_value === undefined) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }
    }

    if (formData.area <= 0) {
      return { success: false, error: 'Área deve ser maior que zero' }
    }

    if (formData.gra_percentage !== undefined && 
        (formData.gra_percentage < 0 || formData.gra_percentage > 100)) {
      return { success: false, error: 'Percentual GRA deve estar entre 0 e 100' }
    }

    if (formData.sale_value < 0) {
      return { success: false, error: 'Valor de venda não pode ser negativo' }
    }

    if (formData.ult_value !== undefined && formData.ult_value < 0) {
      return { success: false, error: 'Valor ULT não pode ser negativo' }
    }

    if (formData.sale_value_gra !== undefined && formData.sale_value_gra < 0) {
      return { success: false, error: 'Valor de venda GRA não pode ser negativo' }
    }

    if (formData.state.length !== 2) {
      return { success: false, error: 'Estado deve ter 2 caracteres (ex: SP)' }
    }

    // Preparar dados
    const propertyData = {
      code,
      identification: formData.identification.trim(),
      type: formData.type,
      classe: formData.classe?.trim() || null,
      subclasse: formData.subclasse?.trim() || null,
      street: formData.street.trim(),
      number: formData.number.trim(),
      complement: formData.complement?.trim() || null,
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zip_code: formData.zip_code.trim(),
      area: formData.area,
      registry: formData.registry.trim(),
      gra_percentage: formData.gra_percentage ?? 0,
      ult_value: formData.ult_value ?? 0,
      sale_value: formData.sale_value,
      sale_value_gra: formData.sale_value_gra ?? formData.sale_value,
      status: formData.status || 'disponivel',
      notes: formData.notes?.trim() || null,
      created_by: user.id,
    }

    // Inserir no banco
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) {
      console.error('Error creating property:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/banco-dados/imoveis')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createProperty:', error)
    return { success: false, error: 'Erro ao criar imóvel' }
  }
}

// =====================================================
// ATUALIZAR IMÓVEL
// =====================================================
export async function updateProperty(id: string, formData: Partial<PropertyFormData>) {
  try {
    const supabase = await createClient()

    // Verificar permissão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Usuário sem permissão para editar imóveis' }
    }

    // Validações
    if (formData.area !== undefined && formData.area <= 0) {
      return { success: false, error: 'Área deve ser maior que zero' }
    }

    if (formData.sale_value !== undefined && formData.sale_value < 0) {
      return { success: false, error: 'Valor de venda não pode ser negativo' }
    }

    if (formData.gra_percentage !== undefined && 
        (formData.gra_percentage < 0 || formData.gra_percentage > 100)) {
      return { success: false, error: 'Percentual GRA deve estar entre 0 e 100' }
    }

    if (formData.ult_value !== undefined && formData.ult_value < 0) {
      return { success: false, error: 'Valor ULT não pode ser negativo' }
    }

    if (formData.sale_value_gra !== undefined && formData.sale_value_gra < 0) {
      return { success: false, error: 'Valor de venda GRA não pode ser negativo' }
    }

    if (formData.state && formData.state.length !== 2) {
      return { success: false, error: 'Estado deve ter 2 caracteres (ex: SP)' }
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (formData.identification) updateData.identification = formData.identification.trim()
    if (formData.type) updateData.type = formData.type
    if (formData.classe !== undefined) updateData.classe = formData.classe?.trim() || null
    if (formData.subclasse !== undefined) updateData.subclasse = formData.subclasse?.trim() || null
    if (formData.street) updateData.street = formData.street.trim()
    if (formData.number) updateData.number = formData.number.trim()
    if (formData.complement !== undefined) updateData.complement = formData.complement?.trim() || null
    if (formData.neighborhood) updateData.neighborhood = formData.neighborhood.trim()
    if (formData.city) updateData.city = formData.city.trim()
    if (formData.state) updateData.state = formData.state.trim().toUpperCase()
    if (formData.zip_code) updateData.zip_code = formData.zip_code.trim()
    if (formData.area !== undefined) updateData.area = formData.area
    if (formData.registry) updateData.registry = formData.registry.trim()
    if (formData.gra_percentage !== undefined) updateData.gra_percentage = formData.gra_percentage
    if (formData.ult_value !== undefined) updateData.ult_value = formData.ult_value
    if (formData.sale_value !== undefined) updateData.sale_value = formData.sale_value
    if (formData.sale_value_gra !== undefined) updateData.sale_value_gra = formData.sale_value_gra
    if (formData.status) updateData.status = formData.status
    if (formData.notes !== undefined) updateData.notes = formData.notes?.trim() || null

    // Atualizar no banco
    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/banco-dados/imoveis')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateProperty:', error)
    return { success: false, error: 'Erro ao atualizar imóvel' }
  }
}

// =====================================================
// EXCLUIR IMÓVEL
// =====================================================
export async function deleteProperty(id: string) {
  try {
    const supabase = await createClient()

    // Verificar permissão (apenas admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem excluir imóveis' }
    }

    // Excluir
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting property:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/banco-dados/imoveis')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProperty:', error)
    return { success: false, error: 'Erro ao excluir imóvel' }
  }
}

// =====================================================
// ALTERAR STATUS DO IMÓVEL
// =====================================================
export async function updatePropertyStatus(id: string, status: PropertyStatus) {
  return updateProperty(id, { status })
}

// =====================================================
// BUSCAR IMÓVEIS POR FILTROS
// =====================================================
export async function searchProperties(filters: {
  type?: PropertyType
  status?: PropertyStatus
  city?: string
  minArea?: number
  maxArea?: number
  minValue?: number
  maxValue?: number
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('properties')
      .select('*')

    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters.minArea !== undefined) {
      query = query.gte('area', filters.minArea)
    }

    if (filters.maxArea !== undefined) {
      query = query.lte('area', filters.maxArea)
    }

    if (filters.minValue !== undefined) {
      query = query.gte('sale_value', filters.minValue)
    }

    if (filters.maxValue !== undefined) {
      query = query.lte('sale_value', filters.maxValue)
    }

    query = query.order('code', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Error searching properties:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in searchProperties:', error)
    return { success: false, error: 'Erro ao buscar imóveis' }
  }
}
