'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum([
    'vinculo',
    'centro_custo',
    'forma_pagamento',
    'imovel_tipo',
    'imovel_classe',
    'imovel_subclasse',
    'veiculo_tipo',
    'veiculo_combustivel',
    'empreendimento_tipo'
  ]),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
})

// =====================================================
// TYPES
// =====================================================

export type CategoryFormData = z.infer<typeof categorySchema>

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

export async function getCategories(type?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return { success: false, error: 'Erro ao carregar categorias' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return { success: false, error: 'Erro inesperado ao carregar categorias' }
  }
}

export async function getAllCategories(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar todas as categorias:', error)
      return { success: false, error: 'Erro ao carregar categorias' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar todas as categorias:', error)
    return { success: false, error: 'Erro inesperado ao carregar categorias' }
  }
}

export async function createCategory(data: CategoryFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validar dados
    const validatedData = categorySchema.parse(data)

    // Verificar permissão de admin
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
      return { success: false, error: 'Apenas administradores podem criar categorias' }
    }

    // Criar categoria
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      return { success: false, error: 'Erro ao criar categoria' }
    }

    revalidatePath('/configuracoes')
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors as Record<string, string[]> }
    }
    console.error('Erro ao criar categoria:', error)
    return { success: false, error: 'Erro inesperado ao criar categoria' }
  }
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verificar permissão de admin
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
      return { success: false, error: 'Apenas administradores podem atualizar categorias' }
    }

    // Atualizar categoria
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return { success: false, error: 'Erro ao atualizar categoria' }
    }

    revalidatePath('/configuracoes')
    return { success: true, data: category }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return { success: false, error: 'Erro inesperado ao atualizar categoria' }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verificar permissão de admin
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
      return { success: false, error: 'Apenas administradores podem deletar categorias' }
    }

    // Em vez de deletar, desativar a categoria
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      return { success: false, error: 'Erro ao deletar categoria' }
    }

    revalidatePath('/configuracoes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return { success: false, error: 'Erro inesperado ao deletar categoria' }
  }
}

export async function deleteCategoryPermanently(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verificar permissão de admin
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
      return { success: false, error: 'Apenas administradores podem deletar categorias' }
    }

    // Deletar permanentemente
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria permanentemente:', error)
      return { success: false, error: 'Erro ao deletar categoria permanentemente' }
    }

    revalidatePath('/configuracoes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar categoria permanentemente:', error)
    return { success: false, error: 'Erro inesperado ao deletar categoria permanentemente' }
  }
}

export async function reactivateCategory(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Verificar permissão de admin
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
      return { success: false, error: 'Apenas administradores podem reativar categorias' }
    }

    // Reativar a categoria
    const { error } = await supabase
      .from('categories')
      .update({ is_active: true })
      .eq('id', id)

    if (error) {
      console.error('Erro ao reativar categoria:', error)
      return { success: false, error: 'Erro ao reativar categoria' }
    }

    revalidatePath('/configuracoes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao reativar categoria:', error)
    return { success: false, error: 'Erro inesperado ao reativar categoria' }
  }
}

export async function getUserPermissions(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return { success: true, data: { role: profile?.role || 'visualizador' } }
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return { success: false, error: 'Erro ao verificar permissões' }
  }
}
