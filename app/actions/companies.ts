'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação com Zod
// =====================================================

const companySchema = z.object({
  trade_name: z.string().min(3, 'Nome Fantasia deve ter no mínimo 3 caracteres'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido. Use o formato: 00.000.000/0000-00'),
  gra_percentage: z.number().min(0, 'Percentual GRA deve ser maior ou igual a 0').max(100, 'Percentual GRA deve ser menor ou igual a 100').optional().default(0),
})

const updateCompanySchema = companySchema.partial().extend({
  id: z.string().uuid(),
})

// =====================================================
// Types
// =====================================================

export type CompanyFormData = z.infer<typeof companySchema>
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>

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
// Helper: Validar CNPJ
// =====================================================

function isValidCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return false
  }
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false
  }
  
  // Validação do primeiro dígito verificador
  let length = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, length)
  const digits = cleanCNPJ.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) {
    return false
  }
  
  // Validação do segundo dígito verificador
  length = length + 1
  numbers = cleanCNPJ.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) {
    return false
  }
  
  return true
}

// =====================================================
// Action: Criar Empresa
// =====================================================

export async function createCompany(data: CompanyFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validatedData = companySchema.parse(data)
    
    // Validar CNPJ matematicamente
    if (!isValidCNPJ(validatedData.cnpj)) {
      return {
        success: false,
        error: 'CNPJ inválido',
        fieldErrors: {
          cnpj: ['O CNPJ informado não é válido'],
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
        error: 'Você não tem permissão para criar empresas. Apenas administradores e editores podem realizar esta ação.',
      }
    }
    
    // Verificar CNPJ duplicado
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', validatedData.cnpj)
      .single()
    
    if (existingCompany) {
      return {
        success: false,
        error: 'CNPJ já cadastrado no sistema',
        fieldErrors: {
          cnpj: ['Este CNPJ já está cadastrado'],
        },
      }
    }
    
    // Inserir empresa
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert({
        ...validatedData,
        created_by: user.id,
        status: 'ativo',
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Erro ao criar empresa:', insertError)
      return {
        success: false,
        error: 'Erro ao cadastrar empresa. Tente novamente.',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
      data: newCompany,
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    
    console.error('Erro ao criar empresa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao cadastrar empresa',
    }
  }
}

// =====================================================
// Action: Listar Empresas
// =====================================================

export async function getCompanies(searchTerm?: string, showInactive = false) {
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
      .from('companies')
      .select('*')
      .eq('status', showInactive ? 'inativo' : 'ativo')
      .order('created_at', { ascending: false })
    
    // Aplicar filtro de busca
    if (searchTerm && searchTerm.trim() !== '') {
      query = query.or(`trade_name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return {
        success: false,
        error: 'Erro ao carregar empresas',
      }
    }
    
    return {
      success: true,
      data: data || [],
    }
    
  } catch (error) {
    console.error('Erro ao buscar empresas:', error)
    return {
      success: false,
      error: 'Erro inesperado ao carregar empresas',
    }
  }
}

// =====================================================
// Action: Buscar Empresa por ID
// =====================================================

export async function getCompanyById(id: string): Promise<ActionResult> {
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
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return {
        success: false,
        error: 'Empresa não encontrada',
      }
    }
    
    return {
      success: true,
      data,
    }
    
  } catch (error) {
    console.error('Erro ao buscar empresa:', error)
    return {
      success: false,
      error: 'Erro ao carregar empresa',
    }
  }
}

// =====================================================
// Action: Atualizar Empresa
// =====================================================

export async function updateCompany(data: UpdateCompanyFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validatedData = updateCompanySchema.parse(data)
    const { id, ...updateData } = validatedData
    
    // Se estiver atualizando o CNPJ, validar matematicamente
    if (updateData.cnpj && !isValidCNPJ(updateData.cnpj)) {
      return {
        success: false,
        error: 'CNPJ inválido',
        fieldErrors: {
          cnpj: ['O CNPJ informado não é válido'],
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
        error: 'Você não tem permissão para editar empresas. Apenas administradores e editores podem realizar esta ação.',
      }
    }
    
    // Se estiver atualizando o CNPJ, verificar duplicidade
    if (updateData.cnpj) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('cnpj', updateData.cnpj)
        .neq('id', id)
        .single()
      
      if (existingCompany) {
        return {
          success: false,
          error: 'CNPJ já cadastrado para outra empresa',
          fieldErrors: {
            cnpj: ['Este CNPJ já está cadastrado'],
          },
        }
      }
    }
    
    // Atualizar empresa
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao atualizar empresa:', updateError)
      return {
        success: false,
        error: 'Erro ao atualizar empresa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
      data: updatedCompany,
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    
    console.error('Erro ao atualizar empresa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao atualizar empresa',
    }
  }
}

// =====================================================
// Action: Desativar Empresa (Soft Delete)
// =====================================================

export async function deleteCompany(id: string): Promise<ActionResult> {
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
        error: 'Apenas administradores podem desativar empresas',
      }
    }
    
    // Desativar empresa (soft delete)
    const { error: updateError } = await supabase
      .from('companies')
      .update({ status: 'inativo' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Erro ao desativar empresa:', updateError)
      return {
        success: false,
        error: 'Erro ao desativar empresa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao desativar empresa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao desativar empresa',
    }
  }
}

// =====================================================
// Action: Excluir Empresa Permanentemente (Hard Delete)
// =====================================================

export async function deleteCompanyPermanently(id: string): Promise<ActionResult> {
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
        error: 'Apenas administradores podem excluir permanentemente empresas',
      }
    }
    
    // Verificar se a empresa está inativa
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('status')
      .eq('id', id)
      .single()
    
    if (fetchError || !company) {
      return {
        success: false,
        error: 'Empresa não encontrada',
      }
    }
    
    if (company.status !== 'inativo') {
      return {
        success: false,
        error: 'Apenas empresas inativas podem ser excluídas permanentemente. Desative a empresa primeiro.',
      }
    }
    
    // Excluir permanentemente
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Erro ao excluir empresa permanentemente:', deleteError)
      return {
        success: false,
        error: 'Erro ao excluir empresa permanentemente',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao excluir empresa permanentemente:', error)
    return {
      success: false,
      error: 'Erro inesperado ao excluir empresa permanentemente',
    }
  }
}

// =====================================================
// Action: Reativar Empresa
// =====================================================

export async function reactivateCompany(id: string): Promise<ActionResult> {
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
        error: 'Apenas administradores podem reativar empresas',
      }
    }
    
    // Reativar empresa
    const { error: updateError } = await supabase
      .from('companies')
      .update({ status: 'ativo' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Erro ao reativar empresa:', updateError)
      return {
        success: false,
        error: 'Erro ao reativar empresa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao reativar empresa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao reativar empresa',
    }
  }
}

// =====================================================
// Action: Validar CNPJ (útil para validação em tempo real)
// =====================================================

export async function validateCNPJ(cnpj: string, excludeId?: string): Promise<ActionResult<boolean>> {
  try {
    // Primeiro, validar matematicamente
    if (!isValidCNPJ(cnpj)) {
      return {
        success: true,
        data: false, // CNPJ inválido matematicamente
      }
    }
    
    const supabase = await createClient()
    
    let query = supabase
      .from('companies')
      .select('id')
      .eq('cnpj', cnpj)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data } = await query.single()
    
    return {
      success: true,
      data: !data, // true se não existir (CNPJ disponível)
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
