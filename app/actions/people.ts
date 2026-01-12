'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação com Zod
// =====================================================

const personSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido. Use o formato: 000.000.000-00'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  birth_date: z.string().optional().nullable(),
  nationality: z.string().optional(),
  marital_status: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']).optional().nullable(),
  profession: z.string().optional(),
  rg: z.string().optional(),
  rg_issuer: z.string().optional(),
  rg_issue_date: z.string().optional().nullable(),
  notes: z.string().optional(),
})

const updatePersonSchema = personSchema.partial().extend({
  id: z.string().uuid(),
})

// =====================================================
// Types
// =====================================================

export type PersonFormData = z.infer<typeof personSchema>
export type UpdatePersonFormData = z.infer<typeof updatePersonSchema>

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// =====================================================
// Helper: Formatar mensagens de erro
// =====================================================

function formatZodError(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = []
    }
    fieldErrors[path].push(err.message)
  })
  return fieldErrors
}

// =====================================================
// Helper: Validar CPF
// =====================================================

function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  let digit1 = remainder >= 10 ? 0 : remainder
  
  if (digit1 !== parseInt(cleanCPF.charAt(9))) {
    return false
  }
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  let digit2 = remainder >= 10 ? 0 : remainder
  
  if (digit2 !== parseInt(cleanCPF.charAt(10))) {
    return false
  }
  
  return true
}

// =====================================================
// Action: Criar Pessoa
// =====================================================

export async function createPerson(data: PersonFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validatedData = personSchema.parse(data)
    
    // Validar CPF matematicamente
    if (!isValidCPF(validatedData.cpf)) {
      return {
        success: false,
        error: 'CPF inválido',
        fieldErrors: {
          cpf: ['O CPF informado não é válido'],
        },
      }
    }
    
    // Criar cliente Supabase
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Verificar permissão (editor ou admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return {
        success: false,
        error: 'Você não tem permissão para criar pessoas. Apenas administradores e editores podem realizar esta ação.',
      }
    }
    
    // Verificar CPF duplicado
    const { data: existingPerson } = await supabase
      .from('people')
      .select('id')
      .eq('cpf', validatedData.cpf)
      .single()
    
    if (existingPerson) {
      return {
        success: false,
        error: 'CPF já cadastrado no sistema',
        fieldErrors: {
          cpf: ['Este CPF já está cadastrado'],
        },
      }
    }
    
    // Inserir pessoa
    const { data: newPerson, error: insertError } = await supabase
      .from('people')
      .insert({
        ...validatedData,
        created_by: user.id,
        status: 'ativo',
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Erro ao criar pessoa:', insertError)
      return {
        success: false,
        error: 'Erro ao cadastrar pessoa. Tente novamente.',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
      data: newPerson,
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    
    console.error('Erro ao criar pessoa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao cadastrar pessoa',
    }
  }
}

// =====================================================
// Action: Listar Pessoas
// =====================================================

export async function getPeople(searchTerm?: string, showInactive: boolean = false) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    let query = supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Filtrar por status: se showInactive = true, mostra apenas inativos, senão mostra apenas ativos
    query = query.eq('status', showInactive ? 'inativo' : 'ativo')
    
    // Aplicar filtro de busca
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.or(`full_name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar pessoas:', error)
      return {
        success: false,
        error: 'Erro ao carregar pessoas',
      }
    }
    
    return {
      success: true,
      data: data || [],
    }
    
  } catch (error) {
    console.error('Erro ao buscar pessoas:', error)
    return {
      success: false,
      error: 'Erro inesperado ao carregar pessoas',
    }
  }
}

// =====================================================
// Action: Buscar Pessoa por ID
// =====================================================

export async function getPersonById(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return {
        success: false,
        error: 'Pessoa não encontrada',
      }
    }
    
    return {
      success: true,
      data,
    }
    
  } catch (error) {
    console.error('Erro ao buscar pessoa:', error)
    return {
      success: false,
      error: 'Erro ao carregar pessoa',
    }
  }
}

// =====================================================
// Action: Atualizar Pessoa
// =====================================================

export async function updatePerson(data: UpdatePersonFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validatedData = updatePersonSchema.parse(data)
    const { id, ...updateData } = validatedData
    
    // Se estiver atualizando o CPF, validar matematicamente
    if (updateData.cpf && !isValidCPF(updateData.cpf)) {
      return {
        success: false,
        error: 'CPF inválido',
        fieldErrors: {
          cpf: ['O CPF informado não é válido'],
        },
      }
    }
    
    // Criar cliente Supabase
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Verificar permissão (editor ou admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return {
        success: false,
        error: 'Você não tem permissão para editar pessoas. Apenas administradores e editores podem realizar esta ação.',
      }
    }
    
    // Se estiver atualizando o CPF, verificar duplicidade
    if (updateData.cpf) {
      const { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('cpf', updateData.cpf)
        .neq('id', id)
        .single()
      
      if (existingPerson) {
        return {
          success: false,
          error: 'CPF já cadastrado para outra pessoa',
          fieldErrors: {
            cpf: ['Este CPF já está cadastrado'],
          },
        }
      }
    }
    
    // Atualizar pessoa
    const { data: updatedPerson, error: updateError } = await supabase
      .from('people')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao atualizar pessoa:', updateError)
      return {
        success: false,
        error: 'Erro ao atualizar pessoa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
      data: updatedPerson,
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    
    console.error('Erro ao atualizar pessoa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao atualizar pessoa',
    }
  }
}

// =====================================================
// Action: Desativar Pessoa (Soft Delete)
// =====================================================

export async function deletePerson(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação e permissão de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return {
        success: false,
        error: 'Apenas administradores podem desativar pessoas',
      }
    }
    
    // Desativar pessoa (soft delete)
    const { error: updateError } = await supabase
      .from('people')
      .update({ status: 'inativo' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Erro ao desativar pessoa:', updateError)
      return {
        success: false,
        error: 'Erro ao desativar pessoa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao desativar pessoa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao desativar pessoa',
    }
  }
}

// =====================================================
// Action: Validar CPF (útil para validação em tempo real)
// =====================================================

export async function validateCPF(cpf: string, excludeId?: string): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('people')
      .select('id')
      .eq('cpf', cpf)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data } = await query.single()
    
    return {
      success: true,
      data: !data, // true se não existir (CPF disponível)
    }
    
  } catch (error) {
    return {
      success: true,
      data: true, // Em caso de erro, permitir (será validado no submit)
    }
  }
}

// =====================================================
// Action: Obter Permissões do Usuário
// =====================================================

export async function getUserPermissions(): Promise<ActionResult<{ role: string; canEdit: boolean; canDelete: boolean }>> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return {
        success: false,
        error: 'Perfil não encontrado',
      }
    }
    
    const role = profile.role
    const canEdit = ['admin', 'editor'].includes(role)
    const canDelete = role === 'admin'
    
    return {
      success: true,
      data: {
        role,
        canEdit,
        canDelete,
      },
    }
    
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return {
      success: false,
      error: 'Erro ao verificar permissões',
    }
  }
}

// =====================================================
// Action: Excluir Pessoa Permanentemente
// =====================================================

export async function deletePersonPermanently(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação e permissão de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return {
        success: false,
        error: 'Apenas administradores podem excluir pessoas permanentemente',
      }
    }
    
    // Verificar se a pessoa está inativa
    const { data: person } = await supabase
      .from('people')
      .select('status')
      .eq('id', id)
      .single()
    
    if (!person || person.status !== 'inativo') {
      return {
        success: false,
        error: 'Apenas pessoas inativas podem ser excluídas permanentemente',
      }
    }
    
    // Excluir permanentemente
    const { error: deleteError } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Erro ao excluir pessoa permanentemente:', deleteError)
      return {
        success: false,
        error: 'Erro ao excluir pessoa. Verifique se não existem vínculos com contratos ou outras dependências.',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao excluir pessoa permanentemente:', error)
    return {
      success: false,
      error: 'Erro inesperado ao excluir pessoa',
    }
  }
}

// =====================================================
// Action: Reativar Pessoa
// =====================================================

export async function reactivatePerson(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação e permissão
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }
    
    // Verificar permissões (admin ou editor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return {
        success: false,
        error: 'Você não tem permissão para reativar pessoas',
      }
    }
    
    // Verificar se a pessoa está inativa
    const { data: person } = await supabase
      .from('people')
      .select('status')
      .eq('id', id)
      .single()
    
    if (!person || person.status !== 'inativo') {
      return {
        success: false,
        error: 'Esta pessoa já está ativa',
      }
    }
    
    // Reativar pessoa
    const { error: updateError } = await supabase
      .from('people')
      .update({ status: 'ativo' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Erro ao reativar pessoa:', updateError)
      return {
        success: false,
        error: 'Erro ao reativar pessoa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao reativar pessoa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao reativar pessoa',
    }
  }
}
