# Roteiro de Implementação - Cadastro de Empresas

## 📋 Análise Atual

### Estado do Código
- **Página**: `app/cadastros/empresas/page.tsx` - Estrutura básica criada
- **Tabela**: `components/database/companies-table.tsx` - Usando dados mock com dropdown menu
- **Modal**: `components/database/company-create-modal.tsx` - Estrutura básica sem integração com banco
- **Actions**: Não existe arquivo de actions para empresas
- **Banco de Dados**: Não existe tabela `companies` no Supabase

### Campos Necessários
Conforme solicitado, apenas 3 campos:
1. **Nome Fantasia** (trade_name) - texto obrigatório
2. **CNPJ** (cnpj) - texto obrigatório, formato: 00.000.000/0000-00
3. **% GRA** (gra_percentage) - número decimal (0-100)

---

## 🎯 Objetivos da Implementação

1. ✅ Criar estrutura do banco de dados (tabela `companies`)
2. ✅ Implementar RLS (Row Level Security) policies
3. ✅ Criar Server Actions para CRUD de empresas
4. ✅ Redesenhar modal de criação com validação
5. ✅ Criar modal de edição de empresa
6. ✅ Criar modal de confirmação de exclusão
7. ✅ Remover dropdown menu e adicionar botões diretos (Editar e Excluir)
8. ✅ Implementar regras de permissão (igual à página de pessoas)
9. ✅ Implementar validação de CNPJ

---

## 📊 1. Estrutura do Banco de Dados

### 1.1. Criar Tabela `companies`

```sql
-- Migration: create_companies_table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  gra_percentage NUMERIC(5,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cnpj_format CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'),
  CONSTRAINT gra_percentage_range CHECK (gra_percentage >= 0 AND gra_percentage <= 100)
);

-- Índices para performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_companies_trade_name ON public.companies(trade_name);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_created_at ON public.companies(created_at DESC);

-- Comentários
COMMENT ON TABLE public.companies IS 'Cadastro de empresas (pessoas jurídicas) do sistema';
COMMENT ON COLUMN public.companies.trade_name IS 'Nome fantasia da empresa';
COMMENT ON COLUMN public.companies.cnpj IS 'CNPJ formatado: 00.000.000/0000-00';
COMMENT ON COLUMN public.companies.gra_percentage IS 'Percentual GRA (0-100)';
COMMENT ON COLUMN public.companies.status IS 'Status do cadastro: ativo, inativo ou arquivado';
COMMENT ON COLUMN public.companies.created_by IS 'Usuário que criou o registro';
```

### 1.2. Criar Trigger para Atualização Automática

```sql
-- Migration: create_companies_triggers
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();
```

### 1.3. Criar RLS Policies

```sql
-- Migration: create_companies_rls_policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Todos usuários autenticados podem visualizar empresas ativas
CREATE POLICY "Usuários autenticados podem visualizar empresas ativas"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (status = 'ativo');

-- Policy: INSERT - Apenas admin e editor podem criar
CREATE POLICY "Admin e editor podem criar empresas"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy: UPDATE - Apenas admin e editor podem atualizar
CREATE POLICY "Admin e editor podem atualizar empresas"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy: DELETE - Apenas admin pode excluir permanentemente
CREATE POLICY "Apenas admin pode excluir empresas"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## 🔧 2. Backend - Server Actions

### 2.1. Criar arquivo `app/actions/companies.ts`

```typescript
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

export async function getCompanies(searchTerm?: string) {
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
      .eq('status', 'ativo')
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
// Action: Deletar Empresa (Exclusão Permanente)
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
        error: 'Apenas administradores podem excluir empresas',
      }
    }
    
    // Excluir permanentemente do banco de dados
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Erro ao excluir empresa:', deleteError)
      return {
        success: false,
        error: 'Erro ao excluir empresa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/empresas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao excluir empresa',
    }
  }
}

// =====================================================
// Action: Validar CNPJ (útil para validação em tempo real)
// =====================================================

export async function validateCNPJ(cnpj: string, excludeId?: string): Promise<ActionResult<boolean>> {
  try {
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
```

---

## 🎨 3. Frontend - Atualização dos Types

### 3.1. Atualizar `lib/types.ts`

Adicionar interface Company:

```typescript
export interface Company {
  id: string
  trade_name: string
  cnpj: string
  gra_percentage: number
  status: 'ativo' | 'inativo' | 'arquivado'
  created_by: string | null
  created_at: string
  updated_at: string
}
```

---

## 🎨 4. Frontend - Componentes

### 4.1. Atualizar `components/database/company-create-modal.tsx`

Redesenhar modal com validação completa e integração com backend:

```typescript
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { createCompany, validateCNPJ } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"

interface CompanyCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CompanyCreateModal({ open, onOpenChange, onSuccess }: CompanyCreateModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cnpjValidation, setCnpjValidation] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  
  const [formData, setFormData] = useState({
    trade_name: "",
    cnpj: "",
    gra_percentage: "0",
  })

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setFormData({ ...formData, cnpj: formatted })
    
    // Validar CNPJ quando estiver completo
    if (formatted.length === 18) {
      const result = await validateCNPJ(formatted)
      if (result.success && result.data !== undefined) {
        const isValid = result.data
        setCnpjValidation({
          isValid,
          message: isValid ? 'CNPJ válido' : 'CNPJ já cadastrado'
        })
      }
    } else {
      setCnpjValidation({ isValid: null, message: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await createCompany({
      trade_name: formData.trade_name,
      cnpj: formData.cnpj,
      gra_percentage: parseFloat(formData.gra_percentage) || 0,
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa cadastrada com sucesso!",
      })
      setFormData({ trade_name: "", cnpj: "", gra_percentage: "0" })
      setCnpjValidation({ isValid: null, message: '' })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao cadastrar empresa",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleCancel = () => {
    setFormData({ trade_name: "", cnpj: "", gra_percentage: "0" })
    setCnpjValidation({ isValid: null, message: '' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>Cadastre uma nova pessoa jurídica no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="trade_name">
              Nome Fantasia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trade_name"
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              placeholder="Digite o nome fantasia"
              required
              disabled={isLoading}
            />
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                required
                disabled={isLoading}
                maxLength={18}
                className={
                  cnpjValidation.isValid === true
                    ? 'border-green-500'
                    : cnpjValidation.isValid === false
                    ? 'border-red-500'
                    : ''
                }
              />
              {cnpjValidation.isValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {cnpjValidation.isValid === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              )}
            </div>
            {cnpjValidation.message && (
              <p
                className={`text-sm ${
                  cnpjValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {cnpjValidation.message}
              </p>
            )}
          </div>

          {/* % GRA */}
          <div className="space-y-2">
            <Label htmlFor="gra_percentage">% GRA</Label>
            <div className="relative">
              <Input
                id="gra_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.gra_percentage}
                onChange={(e) => setFormData({ ...formData, gra_percentage: e.target.value })}
                placeholder="0.00"
                disabled={isLoading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Percentual GRA entre 0 e 100</p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || cnpjValidation.isValid === false}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Empresa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 4.2. Criar `components/database/company-edit-modal.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { updateCompany, validateCNPJ } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"

interface CompanyEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess?: () => void
}

export function CompanyEditModal({ open, onOpenChange, company, onSuccess }: CompanyEditModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cnpjValidation, setCnpjValidation] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  
  const [formData, setFormData] = useState({
    trade_name: "",
    cnpj: "",
    gra_percentage: "0",
  })

  // Preencher formulário quando a empresa mudar
  useEffect(() => {
    if (company) {
      setFormData({
        trade_name: company.trade_name,
        cnpj: company.cnpj,
        gra_percentage: company.gra_percentage.toString(),
      })
      setCnpjValidation({ isValid: null, message: '' })
    }
  }, [company])

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setFormData({ ...formData, cnpj: formatted })
    
    // Validar CNPJ quando estiver completo e diferente do original
    if (formatted.length === 18 && formatted !== company?.cnpj) {
      const result = await validateCNPJ(formatted, company?.id)
      if (result.success && result.data !== undefined) {
        const isValid = result.data
        setCnpjValidation({
          isValid,
          message: isValid ? 'CNPJ válido' : 'CNPJ já cadastrado'
        })
      }
    } else if (formatted === company?.cnpj) {
      setCnpjValidation({ isValid: null, message: '' })
    } else {
      setCnpjValidation({ isValid: null, message: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    
    setIsLoading(true)

    const result = await updateCompany({
      id: company.id,
      trade_name: formData.trade_name,
      cnpj: formData.cnpj,
      gra_percentage: parseFloat(formData.gra_percentage) || 0,
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao atualizar empresa",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>Atualize os dados da empresa</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="trade_name">
              Nome Fantasia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trade_name"
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              placeholder="Digite o nome fantasia"
              required
              disabled={isLoading}
            />
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                required
                disabled={isLoading}
                maxLength={18}
                className={
                  cnpjValidation.isValid === true
                    ? 'border-green-500'
                    : cnpjValidation.isValid === false
                    ? 'border-red-500'
                    : ''
                }
              />
              {cnpjValidation.isValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {cnpjValidation.isValid === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              )}
            </div>
            {cnpjValidation.message && (
              <p
                className={`text-sm ${
                  cnpjValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {cnpjValidation.message}
              </p>
            )}
          </div>

          {/* % GRA */}
          <div className="space-y-2">
            <Label htmlFor="gra_percentage">% GRA</Label>
            <div className="relative">
              <Input
                id="gra_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.gra_percentage}
                onChange={(e) => setFormData({ ...formData, gra_percentage: e.target.value })}
                placeholder="0.00"
                disabled={isLoading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Percentual GRA entre 0 e 100</p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || cnpjValidation.isValid === false}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 4.3. Criar `components/database/delete-company-modal.tsx`

```typescript
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { deleteCompany } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"

interface DeleteCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess: () => void
}

export function DeleteCompanyModal({
  open,
  onOpenChange,
  company,
  onSuccess,
}: DeleteCompanyModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!company) return

    setIsDeleting(true)

    const result = await deleteCompany(company.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir empresa",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Excluir Empresa</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Tem certeza que deseja excluir permanentemente esta empresa?{" "}
            <span className="font-semibold text-destructive">
              Esta ação não pode ser desfeita.
            </span>
          </DialogDescription>
        </DialogHeader>

        {company && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-medium">Nome Fantasia:</span>{" "}
              <span className="text-sm">{company.trade_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">CNPJ:</span>{" "}
              <span className="text-sm font-mono">{company.cnpj}</span>
            </div>
            <div>
              <span className="text-sm font-medium">% GRA:</span>{" "}
              <span className="text-sm">{company.gra_percentage.toFixed(2)}%</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Permanentemente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 4.4. Atualizar `components/database/companies-table.tsx`

Remover dropdown e adicionar botões diretos de Editar e Excluir:

```typescript
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Edit, Trash2, Building, Loader2 } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"
import type { Company } from "@/lib/types"
import { getCompanies } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import { CompanyEditModal } from "./company-edit-modal"
import { DeleteCompanyModal } from "./delete-company-modal"

interface CompaniesTableProps {
  canEdit: boolean
  canDelete: boolean
}

export function CompaniesTable({ canEdit, canDelete }: CompaniesTableProps) {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const loadCompanies = async () => {
    setIsLoading(true)
    const result = await getCompanies()
    
    if (result.success && result.data) {
      setCompanies(result.data)
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao carregar empresas",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleEdit = (company: Company) => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar empresas. Apenas administradores e editores podem realizar esta ação.",
        variant: "destructive",
      })
      return
    }
    setEditingCompany(company)
    setIsEditModalOpen(true)
  }

  const handleDelete = (company: Company) => {
    if (!canDelete) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem excluir empresas.",
        variant: "destructive",
      })
      return
    }
    setDeletingCompany(company)
    setIsDeleteModalOpen(true)
  }

  const handleEditSuccess = () => {
    loadCompanies()
  }

  const handleDeleteSuccess = () => {
    loadCompanies()
  }

  const columns: TableColumn<Company>[] = [
    {
      key: "trade_name",
      label: "Nome Fantasia",
      width: "min-w-[300px]",
      render: (company) => <span className="font-medium">{company.trade_name}</span>,
    },
    {
      key: "cnpj",
      label: "CNPJ",
      width: "w-48",
      render: (company) => <span className="font-mono">{company.cnpj}</span>,
    },
    {
      key: "gra_percentage",
      label: "% GRA",
      width: "w-32",
      render: (company) => <span className="font-mono text-sm">{company.gra_percentage.toFixed(2)}%</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[120px]",
      sortable: false,
      render: (company) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(company)}
            disabled={!canEdit}
            title={canEdit ? "Editar empresa" : "Você não tem permissão para editar"}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(company)}
            disabled={!canDelete}
            className="text-destructive hover:text-destructive"
            title={canDelete ? "Excluir empresa" : "Apenas administradores podem excluir"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        title="Cadastro de Empresas"
        data={companies}
        columns={columns}
        searchFields={["trade_name", "cnpj"]}
        searchPlaceholder="Buscar por nome fantasia ou CNPJ..."
        emptyIcon={<Building className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma empresa encontrada"
      />
      
      <CompanyEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        company={editingCompany}
        onSuccess={handleEditSuccess}
      />
      
      <DeleteCompanyModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        company={deletingCompany}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
```

### 4.5. Atualizar `app/cadastros/empresas/page.tsx`

Adicionar controle de permissões:

```typescript
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { CompaniesTable } from "@/components/database/companies-table"
import { CompanyCreateModal } from "@/components/database/company-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getUserPermissions } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"

export default function EmpresasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setCanEdit(result.data.canEdit)
      setCanDelete(result.data.canDelete)
    }
    setIsLoading(false)
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateClick = () => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar empresas. Apenas administradores e editores podem realizar esta ação.",
        variant: "destructive",
      })
      return
    }
    setIsCreateModalOpen(true)
  }

  return (
    <MainLayout
      hideSearch={true}
      hideQuickActions={true}
      hideNotifications={true}
      hideUserMenu={true}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de pessoas jurídicas do sistema</p>
          </div>
          <Button 
            onClick={handleCreateClick}
            disabled={!canEdit || isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Empresas</CardTitle>
            <CardDescription>Visualize e gerencie todas as empresas cadastradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <CompaniesTable 
              key={refreshKey}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
      </div>

      <CompanyCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Banco de Dados (usar MCP Supabase)
- [ ] 1.1. Criar tabela `companies` com migration `create_companies_table`
- [ ] 1.2. Criar trigger com migration `create_companies_triggers`
- [ ] 1.3. Criar RLS policies com migration `create_companies_rls_policies`
- [ ] 1.4. Verificar se tabela foi criada corretamente
- [ ] 1.5. Testar inserção manual de dados

### Fase 2: Backend
- [ ] 2.1. Criar arquivo `app/actions/companies.ts`
- [ ] 2.2. Implementar todas as actions (create, read, update, delete, validate, permissions)
- [ ] 2.3. Testar validação de CNPJ
- [ ] 2.4. Verificar permissões (admin/editor/visualizador)

### Fase 3: Types
- [ ] 3.1. Adicionar interface `Company` em `lib/types.ts`

### Fase 4: Componentes
- [ ] 4.1. Atualizar `company-create-modal.tsx` (novo design com validação)
- [ ] 4.2. Criar `company-edit-modal.tsx`
- [ ] 4.3. Criar `delete-company-modal.tsx`
- [ ] 4.4. Atualizar `companies-table.tsx` (remover dropdown, adicionar botões diretos)
- [ ] 4.5. Atualizar `empresas/page.tsx` (adicionar controle de permissões)

### Fase 5: Testes
- [ ] 5.1. Testar criação de empresa (admin/editor)
- [ ] 5.2. Testar edição de empresa (admin/editor)
- [ ] 5.3. Testar exclusão de empresa (apenas admin)
- [ ] 5.4. Testar validação de CNPJ (formato e duplicidade)
- [ ] 5.5. Testar permissões (visualizador não pode criar/editar/excluir)
- [ ] 5.6. Testar botões desabilitados conforme permissão

---

## 🔍 Regras de Negócio Implementadas

1. **Criação e Edição**: Apenas `admin` e `editor` podem criar ou editar empresas
2. **Exclusão**: Apenas `admin` pode excluir permanentemente empresas
3. **Visualização**: Todos os usuários autenticados podem visualizar empresas ativas
4. **Validação de CNPJ**: 
   - Validação matemática dos dígitos verificadores
   - Validação de formato (00.000.000/0000-00)
   - Verificação de duplicidade no banco
   - Feedback visual em tempo real (verde/vermelho)
5. **% GRA**: Deve estar entre 0 e 100
6. **Status**: Empresas podem ter status: ativo, inativo ou arquivado
7. **Audit Trail**: Registra quem criou e quando (created_by, created_at, updated_at)

---

## 📝 Notas Importantes

- ✅ A implementação segue o mesmo padrão da página de pessoas
- ✅ Utiliza validação de CNPJ semelhante à validação de CPF
- ✅ RLS policies garantem segurança no nível do banco de dados
- ✅ Frontend desabilita botões conforme permissão (UX)
- ✅ Backend valida permissões antes de executar ações (Segurança)
- ✅ Modais seguem o design system do projeto
- ✅ Validação em tempo real melhora a experiência do usuário
- ✅ Mensagens de erro claras e específicas

---

## 🚀 Ordem de Execução Sugerida

1. **Banco de Dados** (migrations via MCP Supabase)
2. **Backend** (actions)
3. **Types** (interfaces)
4. **Componentes** (modals e table)
5. **Página** (integração final)
6. **Testes** (validação completa)

---

**Documento gerado em:** 21 de novembro de 2025
**Versão:** 1.0
**Status:** Pronto para implementação
