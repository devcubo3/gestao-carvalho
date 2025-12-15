# Roteiro de Implementação - Cadastro de Pessoas

## 📋 Análise Atual

### Estado do Código
Atualmente o módulo de pessoas está usando **dados mockados** e não está integrado com o banco de dados Supabase.

**Arquivos Analisados:**
- `app/cadastros/pessoas/page.tsx` - Página principal (client component)
- `components/database/people-table.tsx` - Tabela com dados mockados
- `components/database/person-create-modal.tsx` - Modal de criação (não funcional)

### Estado do Banco de Dados
**Análise do Supabase:**
- ✅ Projeto configurado e conectado
- ✅ Tabela `profiles` existe (para usuários do sistema)
- ❌ **Tabela `people` NÃO existe** (precisa ser criada)
- ❌ **Tabela `companies` NÃO existe** (para referência futura)

## 🎯 Objetivos da Implementação

1. Criar estrutura de banco de dados para pessoas físicas
2. Implementar RLS (Row Level Security) adequado
3. Criar Server Actions para operações CRUD
4. Integrar componentes com dados reais
5. Adicionar validações e tratamento de erros

---

## 📊 PARTE 1: Estrutura do Banco de Dados

### 1.1 Criar Tabela `people`

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_people_table.sql`

```sql
-- =====================================================
-- Tabela: people (Pessoas Físicas)
-- Descrição: Armazena informações de pessoas físicas
-- =====================================================

create table public.people (
  -- Identificação
  id uuid primary key default gen_random_uuid(),
  
  -- Dados Pessoais
  full_name text not null,
  cpf text not null unique,
  
  -- Dados de Contato (opcionais)
  email text,
  phone text,
  mobile_phone text,
  
  -- Endereço (opcionais)
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  
  -- Informações Adicionais
  birth_date date,
  nationality text,
  marital_status text, -- solteiro, casado, divorciado, viuvo
  profession text,
  
  -- Documentos
  rg text,
  rg_issuer text,
  rg_issue_date date,
  
  -- Observações
  notes text,
  
  -- Controle
  status text not null default 'ativo', -- ativo, inativo, arquivado
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint valid_cpf check (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'),
  constraint valid_status check (status in ('ativo', 'inativo', 'arquivado')),
  constraint valid_marital_status check (
    marital_status is null or 
    marital_status in ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')
  )
);

-- Comentários
comment on table public.people is 'Cadastro de pessoas físicas do sistema';
comment on column public.people.cpf is 'CPF formatado: 000.000.000-00';
comment on column public.people.status is 'Status do cadastro: ativo, inativo ou arquivado';
comment on column public.people.created_by is 'Usuário que criou o registro';

-- Índices para performance
create index people_cpf_idx on public.people(cpf);
create index people_full_name_idx on public.people(full_name);
create index people_status_idx on public.people(status);
create index people_created_at_idx on public.people(created_at desc);
create index people_created_by_idx on public.people(created_by);

-- Índice para busca de texto
create index people_search_idx on public.people using gin(
  to_tsvector('portuguese', coalesce(full_name, '') || ' ' || coalesce(cpf, ''))
);
```

### 1.2 Habilitar Row Level Security (RLS)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_people_rls_policies.sql`

```sql
-- =====================================================
-- RLS Policies: people
-- Descrição: Políticas de segurança para tabela people
-- =====================================================

-- Habilitar RLS
alter table public.people enable row level security;

-- Policy: SELECT - Usuários autenticados podem ler todos os registros
create policy "Authenticated users can view all people"
  on public.people
  for select
  to authenticated
  using (true);

-- Policy: INSERT - Usuários autenticados podem criar registros
create policy "Authenticated users can create people"
  on public.people
  for insert
  to authenticated
  with check (true);

-- Policy: UPDATE - Usuários autenticados podem atualizar registros
create policy "Authenticated users can update people"
  on public.people
  for update
  to authenticated
  using (true)
  with check (true);

-- Policy: DELETE - Apenas administradores podem deletar
create policy "Only admins can delete people"
  on public.people
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Comentários
comment on policy "Authenticated users can view all people" on public.people is 
  'Permite que usuários autenticados visualizem todas as pessoas';
comment on policy "Authenticated users can create people" on public.people is 
  'Permite que usuários autenticados criem novas pessoas';
comment on policy "Authenticated users can update people" on public.people is 
  'Permite que usuários autenticados atualizem pessoas';
comment on policy "Only admins can delete people" on public.people is 
  'Apenas administradores podem deletar pessoas';
```

### 1.3 Trigger para atualização automática

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_people_triggers.sql`

```sql
-- =====================================================
-- Triggers: people
-- Descrição: Triggers automáticos para tabela people
-- =====================================================

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para updated_at
create trigger set_updated_at
  before update on public.people
  for each row
  execute function public.handle_updated_at();

comment on function public.handle_updated_at() is 
  'Atualiza automaticamente o campo updated_at antes de um UPDATE';
```

### 1.4 Função para busca avançada (opcional)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_people_search_function.sql`

```sql
-- =====================================================
-- Função: search_people
-- Descrição: Busca avançada de pessoas com filtros
-- =====================================================

create or replace function public.search_people(
  search_term text default null,
  status_filter text default 'ativo',
  limit_count int default 50,
  offset_count int default 0
)
returns table (
  id uuid,
  full_name text,
  cpf text,
  email text,
  phone text,
  mobile_phone text,
  city text,
  state text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id,
    p.full_name,
    p.cpf,
    p.email,
    p.phone,
    p.mobile_phone,
    p.city,
    p.state,
    p.status,
    p.created_at
  from public.people p
  where 
    (status_filter is null or p.status = status_filter)
    and (
      search_term is null 
      or p.full_name ilike '%' || search_term || '%'
      or p.cpf ilike '%' || search_term || '%'
      or p.email ilike '%' || search_term || '%'
    )
  order by p.created_at desc
  limit limit_count
  offset offset_count;
end;
$$;

comment on function public.search_people is 
  'Busca pessoas com filtros de texto e status';
```

---

## 🔧 PARTE 2: Server Actions (Backend)

### 2.1 Criar arquivo de actions

**Arquivo:** `app/actions/people.ts`

```typescript
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
// Action: Criar Pessoa
// =====================================================

export async function createPerson(data: PersonFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validatedData = personSchema.parse(data)
    
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

export async function getPeople(searchTerm?: string) {
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
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
    
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
// Action: Deletar (Arquivar) Pessoa
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
        error: 'Apenas administradores podem excluir pessoas',
      }
    }
    
    // Arquivar ao invés de deletar (soft delete)
    const { error: updateError } = await supabase
      .from('people')
      .update({ status: 'arquivado' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Erro ao arquivar pessoa:', updateError)
      return {
        success: false,
        error: 'Erro ao excluir pessoa',
      }
    }
    
    // Revalidar cache
    revalidatePath('/cadastros/pessoas')
    
    return {
      success: true,
    }
    
  } catch (error) {
    console.error('Erro ao arquivar pessoa:', error)
    return {
      success: false,
      error: 'Erro inesperado ao excluir pessoa',
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
```

---

## 🎨 PARTE 3: Atualização dos Componentes

### 3.1 Atualizar Types

**Arquivo:** `lib/types.ts` (adicionar ao arquivo existente)

```typescript
// =====================================================
// Person Types
// =====================================================

export interface Person {
  id: string
  full_name: string
  cpf: string
  email?: string | null
  phone?: string | null
  mobile_phone?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  birth_date?: string | null
  nationality?: string | null
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | null
  profession?: string | null
  rg?: string | null
  rg_issuer?: string | null
  rg_issue_date?: string | null
  notes?: string | null
  status: 'ativo' | 'inativo' | 'arquivado'
  created_by?: string
  created_at: string
  updated_at: string
}
```

### 3.2 Atualizar Modal de Criação

**Arquivo:** `components/database/person-create-modal.tsx`

```typescript
"use client"

import type React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createPerson, type PersonFormData } from "@/app/actions/people"
import { Loader2 } from "lucide-react"

interface PersonCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PersonCreateModal({ open, onOpenChange, onSuccess }: PersonCreateModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PersonFormData>({
    full_name: "",
    cpf: "",
    email: "",
    phone: "",
    mobile_phone: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createPerson(formData)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Pessoa cadastrada com sucesso!",
        })

        // Resetar formulário
        setFormData({
          full_name: "",
          cpf: "",
          email: "",
          phone: "",
          mobile_phone: "",
        })
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao cadastrar pessoa",
          variant: "destructive",
        })

        // Mostrar erros de campo específicos
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors.length > 0) {
              toast({
                title: `Erro no campo ${field}`,
                description: errors[0],
                variant: "destructive",
              })
            }
          })
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao cadastrar pessoa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    
    return numbers.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Pessoa</DialogTitle>
          <DialogDescription>
            Cadastre uma nova pessoa física no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Digite o nome completo"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
              placeholder="000.000.000-00"
              required
              disabled={isLoading}
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 0000-0000"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Celular</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={isLoading}
              />
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Pessoa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.3 Atualizar Tabela de Pessoas

**Arquivo:** `components/database/people-table.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { MoreHorizontal, Eye, Edit, Archive, Users, Loader2 } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"
import type { Person } from "@/lib/types"
import { getPeople, deletePerson } from "@/app/actions/people"
import { useToast } from "@/hooks/use-toast"

export function PeopleTable() {
  const { toast } = useToast()
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPeople = async () => {
    setIsLoading(true)
    const result = await getPeople()
    
    if (result.success && result.data) {
      setPeople(result.data)
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao carregar pessoas",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadPeople()
  }, [])

  const handleAction = async (action: string, personId: string) => {
    if (action === "archive") {
      if (confirm("Tem certeza que deseja arquivar esta pessoa?")) {
        const result = await deletePerson(personId)
        
        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Pessoa arquivada com sucesso",
          })
          loadPeople()
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao arquivar pessoa",
            variant: "destructive",
          })
        }
      }
    } else {
      console.log(`${action} person ${personId}`)
    }
  }

  const columns: TableColumn<Person>[] = [
    {
      key: "full_name",
      label: "Nome Completo",
      width: "min-w-[300px]",
      render: (person) => <span className="font-medium">{person.full_name}</span>,
    },
    {
      key: "cpf",
      label: "CPF",
      width: "w-40",
      render: (person) => <span className="font-mono">{person.cpf}</span>,
    },
    {
      key: "email",
      label: "Email",
      width: "min-w-[200px]",
      render: (person) => person.email || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "mobile_phone",
      label: "Celular",
      width: "w-40",
      render: (person) => person.mobile_phone || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (person) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleAction("view", person.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", person.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction("archive", person.id)}
              className="text-destructive"
            >
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    <DataTable
      title="Cadastro de Pessoas"
      data={people}
      columns={columns}
      searchFields={["full_name", "cpf", "email"]}
      searchPlaceholder="Buscar por nome, CPF ou email..."
      emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
      emptyMessage="Nenhuma pessoa encontrada"
    />
  )
}
```

### 3.4 Atualizar Página Principal

**Arquivo:** `app/cadastros/pessoas/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { PeopleTable } from "@/components/database/people-table"
import { PersonCreateModal } from "@/components/database/person-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function PessoasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    // Força recarregar a tabela
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro de pessoas físicas do sistema
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pessoa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pessoas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as pessoas cadastradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeopleTable key={refreshKey} />
          </CardContent>
        </Card>
      </div>

      <PersonCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
```

---

## 📝 PARTE 4: Checklist de Implementação

### Fase 1: Preparação
- [ ] Instalar dependência `zod` se não estiver instalada: `pnpm add zod`
- [ ] Revisar credenciais do Supabase no `.env.local`
- [ ] Fazer backup do banco de dados (se aplicável)

### Fase 2: Banco de Dados
- [ ] Criar migration: `pnpm supabase migration new create_people_table`
- [ ] Copiar SQL da seção 1.1 para o arquivo de migration
- [ ] Criar migration: `pnpm supabase migration new create_people_rls_policies`
- [ ] Copiar SQL da seção 1.2 para o arquivo de migration
- [ ] Criar migration: `pnpm supabase migration new create_people_triggers`
- [ ] Copiar SQL da seção 1.3 para o arquivo de migration
- [ ] Executar migrations: `pnpm supabase db push`
- [ ] Verificar tabelas no Dashboard do Supabase

### Fase 3: Backend
- [ ] Criar arquivo `app/actions/people.ts`
- [ ] Copiar código da seção 2.1
- [ ] Testar uma action isoladamente (ex: getPeople)

### Fase 4: Types
- [ ] Atualizar `lib/types.ts` com o código da seção 3.1

### Fase 5: Frontend
- [ ] Atualizar `components/database/person-create-modal.tsx` (seção 3.2)
- [ ] Atualizar `components/database/people-table.tsx` (seção 3.3)
- [ ] Atualizar `app/cadastros/pessoas/page.tsx` (seção 3.4)

### Fase 6: Testes
- [ ] Testar criação de pessoa
- [ ] Testar validação de CPF duplicado
- [ ] Testar listagem de pessoas
- [ ] Testar busca/filtro
- [ ] Testar arquivamento (se admin)
- [ ] Testar permissões (com diferentes roles)

### Fase 7: Melhorias Futuras (Opcional)
- [ ] Adicionar máscaras para telefone
- [ ] Adicionar validação de CEP com busca automática
- [ ] Criar página de detalhes da pessoa
- [ ] Criar modal de edição completo
- [ ] Adicionar histórico de alterações
- [ ] Implementar busca avançada com filtros

---

## 🔍 Observações Importantes

### Segurança
1. **RLS está habilitado** - Todas as queries passam pelas políticas de segurança
2. **Validação no backend** - Usa Zod para validar dados antes de inserir
3. **CPF único** - Constraint no banco impede duplicidade
4. **Soft delete** - Pessoas são arquivadas, não deletadas permanentemente

### Performance
1. **Índices criados** - Para CPF, nome e data de criação
2. **Busca otimizada** - Usa índices GIN para full-text search
3. **Revalidação de cache** - Next.js revalidate cache após mudanças

### Boas Práticas
1. **Server Actions** - Toda lógica de negócio no servidor
2. **Type Safety** - TypeScript em todo o código
3. **Error Handling** - Tratamento adequado de erros
4. **Loading States** - Feedback visual para o usuário

---

## 🚀 Comandos Úteis

```bash
# Criar nova migration
pnpm supabase migration new nome_da_migration

# Executar migrations
pnpm supabase db push

# Resetar banco de dados local
pnpm supabase db reset

# Ver logs do Supabase
pnpm supabase logs

# Gerar tipos TypeScript do banco
pnpm supabase gen types typescript --local > lib/database.types.ts
```

---

## 📚 Referências

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod Validation](https://zod.dev/)

---

## ✅ Resultado Esperado

Após implementar todos os passos, você terá:

1. ✅ Tabela `people` no banco com RLS habilitado
2. ✅ CRUD completo funcionando (Create, Read, Update, Delete)
3. ✅ Validações de CPF e campos obrigatórios
4. ✅ Interface funcional para cadastro de pessoas
5. ✅ Busca e filtros funcionando
6. ✅ Sistema seguro com autenticação e autorização

**Boa implementação! 🎉**
