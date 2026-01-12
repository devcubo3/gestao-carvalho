# 📋 ROTEIRO: Implementação de Categorias Dinâmicas

## 📊 ANÁLISE EXECUTADA (QA Report)

### **Categorias Fixas Identificadas no Sistema**

Após análise completa do banco de dados e código-fonte, foram identificados os seguintes locais onde as categorias estão fixas:

#### **1. Contas a Pagar (accounts_payable)**
- **Campos com categorias fixas:**
  - `vinculo`: texto livre (Fornecedores, Comissões, Taxas, etc)
  - `centro_custo`: texto livre (Vendas, Obras, Administrativo, etc)
- **Locais no código:**
  - `lib/mock-data.ts` - Arrays `mockVinculos` e `mockCentrosCusto`
  - `components/financial/edit-payable-dialog.tsx`
  - `components/financial/account-form-dialog.tsx`
  - `components/financial/accounts-payable-filters.tsx`
  - `app/financeiro/contas-pagar/lote/page.tsx`

#### **2. Contas a Receber (accounts_receivable)**
- **Campos com categorias fixas:**
  - `vinculo`: texto livre (Contratos, Vendas, Aluguéis, etc)
  - `centro_custo`: texto livre (Vendas, Veículos, Imóveis, etc)
- **Locais no código:**
  - `lib/mock-data.ts` - Arrays `mockVinculos` e `mockCentrosCusto`
  - `components/financial/edit-account-dialog.tsx`
  - `components/financial/account-filter.tsx`
  - `components/financial/accounts-receivable-filters.tsx`
  - `app/financeiro/contas-receber/page.tsx`

#### **3. Caixa (cash_transactions)**
- **Campos com categorias fixas:**
  - `vinculo`: texto livre (Contratos, Vendas, Aluguéis, etc)
  - `centro_custo`: texto livre (Vendas, Veículos, Imóveis, etc)
  - `forma`: enum fixo ('Caixa', 'Permuta')
- **Locais no código:**
  - `lib/mock-data.ts` - Arrays `mockVinculos` e `mockCentrosCusto`
  - `components/financial/cash-filters.tsx`
  - `components/financial/create-transaction-modal.tsx`

#### **4. Patrimônio - Imóveis (properties)**
- **Campos com categorias fixas:**
  - `type`: enum no banco ('residencial', 'comercial', 'industrial', 'rural', 'terreno')
  - `classe`: texto livre (Casa, Apartamento, Sala Comercial, Loja, Galpão)
  - `subclasse`: texto livre (Padrão, Alto Padrão, Popular, Luxo)
- **Locais no código:**
  - `components/database/property-create-modal.tsx` (linhas 164-215)
  - `components/database/edit-property-dialog.tsx`

#### **5. Patrimônio - Veículos (vehicles)**
- **Campos com categorias fixas:**
  - `type`: enum no banco ('carro', 'moto', 'caminhao', 'barco', 'onibus', 'van')
  - `fuel_type`: enum no banco ('gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido', 'gnv')
- **Locais no código:**
  - `components/database/vehicle-create-modal.tsx` (linhas 141-151)
  - `components/database/edit-vehicle-dialog.tsx`

#### **6. Patrimônio - Empreendimentos (developments)**
- **Campos com categorias fixas:**
  - `type`: enum no banco ('predio', 'loteamento', 'chacaramento', 'condominio', 'comercial')
- **Locais no código:**
  - `components/database/development-create-modal.tsx`
  - `components/database/edit-development-dialog.tsx`

#### **7. Contratos (contracts)**
- Não possui categorias, mas as condições de pagamento geram contas a pagar/receber que herdam categorias fixas

---

## 🎯 SOLUÇÃO PROPOSTA

### **Estrutura de Tabela Única de Categorias**

Criar uma tabela centralizada `categories` que armazenará todas as categorias do sistema, separadas por tipo:

```sql
categories
├── id (UUID)
├── name (TEXT) - Nome da categoria
├── type (TEXT) - Tipo da categoria
├── description (TEXT) - Descrição opcional
├── is_active (BOOLEAN) - Se está ativa
├── display_order (INTEGER) - Ordem de exibição
├── created_by (UUID)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Tipos de Categorias (`type`):**
- `vinculo` - Vínculos para contas (Contratos, Vendas, Aluguéis, etc)
- `centro_custo` - Centros de custo (Vendas, Obras, Administrativo, etc)
- `forma_pagamento` - Formas de pagamento (Caixa, Permuta, Transferência, etc)
- `imovel_tipo` - Tipos de imóvel (Residencial, Comercial, Industrial, etc)
- `imovel_classe` - Classes de imóvel (Casa, Apartamento, Sala, etc)
- `imovel_subclasse` - Subclasses de imóvel (Padrão, Alto Padrão, etc)
- `veiculo_tipo` - Tipos de veículo (Carro, Moto, Caminhão, etc)
- `veiculo_combustivel` - Tipos de combustível (Gasolina, Etanol, Flex, etc)
- `empreendimento_tipo` - Tipos de empreendimento (Prédio, Loteamento, etc)

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **ETAPA 1: Criar Tabela de Categorias**

```sql
-- =====================================================
-- TABELA: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados da categoria
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'vinculo',
    'centro_custo',
    'forma_pagamento',
    'imovel_tipo',
    'imovel_classe',
    'imovel_subclasse',
    'veiculo_tipo',
    'veiculo_combustivel',
    'empreendimento_tipo'
  )),
  description TEXT,
  
  -- Status e ordenação
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garante que não há categorias duplicadas do mesmo tipo
  CONSTRAINT unique_category_name_type UNIQUE (name, type)
);

-- Comentários
COMMENT ON TABLE public.categories IS 'Categorias dinâmicas do sistema gerenciadas pelo administrador';
COMMENT ON COLUMN public.categories.name IS 'Nome da categoria exibido no sistema';
COMMENT ON COLUMN public.categories.type IS 'Tipo da categoria: vinculo, centro_custo, forma_pagamento, imovel_tipo, etc';
COMMENT ON COLUMN public.categories.description IS 'Descrição opcional da categoria';
COMMENT ON COLUMN public.categories.is_active IS 'Se a categoria está ativa e disponível para uso';
COMMENT ON COLUMN public.categories.display_order IS 'Ordem de exibição nas listas (menor = primeiro)';

-- Índices para performance
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);
CREATE INDEX idx_categories_type_active ON public.categories(type, is_active);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);
```

### **ETAPA 2: Criar Trigger para updated_at**

```sql
-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_categories_updated_at();
```

### **ETAPA 3: Habilitar RLS (Row Level Security)**

```sql
-- =====================================================
-- RLS POLICIES: Categories
-- =====================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Todos autenticados podem visualizar
CREATE POLICY "Usuários autenticados podem visualizar categorias"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: INSERT - Apenas Admin pode criar
CREATE POLICY "Apenas Admin pode criar categorias"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: UPDATE - Apenas Admin pode atualizar
CREATE POLICY "Apenas Admin pode atualizar categorias"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: DELETE - Apenas Admin pode deletar
CREATE POLICY "Apenas Admin pode deletar categorias"
  ON public.categories
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

### **ETAPA 4: Popular Tabela com Categorias Padrão**

```sql
-- =====================================================
-- SEED: Inserir categorias padrão do sistema
-- =====================================================

-- Vínculos
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Contratos', 'vinculo', 1),
  ('Vendas', 'vinculo', 2),
  ('Aluguéis', 'vinculo', 3),
  ('Comissões', 'vinculo', 4),
  ('Despesas', 'vinculo', 5),
  ('Investimentos', 'vinculo', 6),
  ('Impostos', 'vinculo', 7),
  ('Marketing', 'vinculo', 8),
  ('Operacional', 'vinculo', 9),
  ('Financeiro', 'vinculo', 10);

-- Centros de Custo
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Vendas', 'centro_custo', 1),
  ('Veículos', 'centro_custo', 2),
  ('Imóveis', 'centro_custo', 3),
  ('Fornecedores', 'centro_custo', 4),
  ('Obras', 'centro_custo', 5),
  ('Predial', 'centro_custo', 6),
  ('Administrativo', 'centro_custo', 7);

-- Formas de Pagamento
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Caixa', 'forma_pagamento', 1),
  ('Permuta', 'forma_pagamento', 2),
  ('Transferência', 'forma_pagamento', 3),
  ('PIX', 'forma_pagamento', 4),
  ('Boleto', 'forma_pagamento', 5),
  ('Cartão de Crédito', 'forma_pagamento', 6),
  ('Cartão de Débito', 'forma_pagamento', 7);

-- Tipos de Imóvel
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Residencial', 'imovel_tipo', 1),
  ('Comercial', 'imovel_tipo', 2),
  ('Industrial', 'imovel_tipo', 3),
  ('Rural', 'imovel_tipo', 4),
  ('Terreno', 'imovel_tipo', 5);

-- Classes de Imóvel
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Casa', 'imovel_classe', 1),
  ('Apartamento', 'imovel_classe', 2),
  ('Sala Comercial', 'imovel_classe', 3),
  ('Loja', 'imovel_classe', 4),
  ('Galpão', 'imovel_classe', 5),
  ('Terreno Urbano', 'imovel_classe', 6),
  ('Terreno Rural', 'imovel_classe', 7);

-- Subclasses de Imóvel
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Padrão', 'imovel_subclasse', 1),
  ('Alto Padrão', 'imovel_subclasse', 2),
  ('Popular', 'imovel_subclasse', 3),
  ('Luxo', 'imovel_subclasse', 4),
  ('Econômico', 'imovel_subclasse', 5);

-- Tipos de Veículo
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Carro', 'veiculo_tipo', 1),
  ('Moto', 'veiculo_tipo', 2),
  ('Caminhão', 'veiculo_tipo', 3),
  ('Barco', 'veiculo_tipo', 4),
  ('Ônibus', 'veiculo_tipo', 5),
  ('Van', 'veiculo_tipo', 6);

-- Tipos de Combustível
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Gasolina', 'veiculo_combustivel', 1),
  ('Etanol', 'veiculo_combustivel', 2),
  ('Flex', 'veiculo_combustivel', 3),
  ('Diesel', 'veiculo_combustivel', 4),
  ('Elétrico', 'veiculo_combustivel', 5),
  ('Híbrido', 'veiculo_combustivel', 6),
  ('GNV', 'veiculo_combustivel', 7);

-- Tipos de Empreendimento
INSERT INTO public.categories (name, type, display_order) VALUES
  ('Prédio', 'empreendimento_tipo', 1),
  ('Loteamento', 'empreendimento_tipo', 2),
  ('Chacaramento', 'empreendimento_tipo', 3),
  ('Condomínio', 'empreendimento_tipo', 4),
  ('Comercial', 'empreendimento_tipo', 5);
```

### **ETAPA 5: Migrar Dados Existentes (Opcional)**

Se houver dados no sistema, será necessário garantir compatibilidade:

```sql
-- =====================================================
-- VERIFICAÇÃO: Categorias em uso nas tabelas existentes
-- =====================================================

-- Verificar vínculos em uso (accounts_payable)
SELECT DISTINCT vinculo FROM public.accounts_payable WHERE vinculo IS NOT NULL;

-- Verificar centros de custo em uso (accounts_payable)
SELECT DISTINCT centro_custo FROM public.accounts_payable WHERE centro_custo IS NOT NULL;

-- Verificar vínculos em uso (accounts_receivable)
SELECT DISTINCT vinculo FROM public.accounts_receivable WHERE vinculo IS NOT NULL;

-- Verificar centros de custo em uso (accounts_receivable)
SELECT DISTINCT centro_custo FROM public.accounts_receivable WHERE centro_custo IS NOT NULL;

-- Verificar formas em uso (cash_transactions)
SELECT DISTINCT forma FROM public.cash_transactions WHERE forma IS NOT NULL;

-- Verificar tipos de imóvel em uso
SELECT DISTINCT type FROM public.properties WHERE type IS NOT NULL;

-- Verificar tipos de veículo em uso
SELECT DISTINCT type FROM public.vehicles WHERE type IS NOT NULL;

-- NOTA: Se houver valores que não estão nas categorias padrão,
-- adicione-os manualmente na tabela categories antes de prosseguir
```

---

## 🔧 ROTEIRO DE IMPLEMENTAÇÃO FRONTEND

### **ETAPA 1: Criar Actions para Categorias** ⏱️ 30 min

**Arquivo:** `app/actions/categories.ts`

```typescript
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
```

### **ETAPA 2: Atualizar Types** ⏱️ 10 min

**Arquivo:** `lib/types.ts`

Adicionar o tipo Category:

```typescript
export interface Category {
  id: string
  name: string
  type: 'vinculo' | 'centro_custo' | 'forma_pagamento' | 'imovel_tipo' | 'imovel_classe' | 'imovel_subclasse' | 'veiculo_tipo' | 'veiculo_combustivel' | 'empreendimento_tipo'
  description?: string | null
  is_active: boolean
  display_order: number
  created_by?: string | null
  created_at: Date
  updated_at: Date
}
```

### **ETAPA 3: Criar Hook para Categorias** ⏱️ 20 min

**Arquivo:** `hooks/use-categories.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getCategories } from '@/app/actions/categories'
import type { Category } from '@/lib/types'

export function useCategories(type?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true)
      setError(null)

      const result = await getCategories(type)

      if (result.success) {
        setCategories(result.data || [])
      } else {
        setError(result.error || 'Erro ao carregar categorias')
      }

      setIsLoading(false)
    }

    loadCategories()
  }, [type])

  return { categories, isLoading, error }
}
```

### **ETAPA 4: Criar Componente de Gerenciamento de Categorias** ⏱️ 90 min

**Arquivo:** `app/configuracoes/categorias/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { getAllCategories, deleteCategory, getUserPermissions } from '@/app/actions/categories'
import { useToast } from '@/hooks/use-toast'
import { CategoryFormDialog } from '@/components/settings/category-form-dialog'
import type { Category } from '@/lib/types'

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  vinculo: 'Vínculos',
  centro_custo: 'Centros de Custo',
  forma_pagamento: 'Formas de Pagamento',
  imovel_tipo: 'Tipos de Imóvel',
  imovel_classe: 'Classes de Imóvel',
  imovel_subclasse: 'Subclasses de Imóvel',
  veiculo_tipo: 'Tipos de Veículo',
  veiculo_combustivel: 'Tipos de Combustível',
  empreendimento_tipo: 'Tipos de Empreendimento',
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)

    const [categoriesResult, permissionsResult] = await Promise.all([
      getAllCategories(),
      getUserPermissions(),
    ])

    if (categoriesResult.success) {
      setCategories(categoriesResult.data || [])
    }

    if (permissionsResult.success) {
      setIsAdmin(permissionsResult.data?.role === 'admin')
    }

    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente desativar esta categoria?')) return

    const result = await deleteCategory(id)

    if (result.success) {
      toast({
        title: 'Categoria desativada!',
        description: 'A categoria foi desativada com sucesso.',
      })
      loadData()
    } else {
      toast({
        title: 'Erro ao desativar categoria',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  // Agrupar categorias por tipo
  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = []
    }
    acc[category.type].push(category)
    return acc
  }, {} as Record<string, Category[]>)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p>Carregando categorias...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias utilizadas em todo o sistema
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </div>

        {!isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Apenas administradores podem criar, editar ou deletar categorias.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedCategories).map(([type, cats]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{CATEGORY_TYPE_LABELS[type] || type}</CardTitle>
                <CardDescription>
                  {cats.filter(c => c.is_active).length} ativa(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cats.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        category.is_active ? 'bg-muted' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                        {!category.is_active && (
                          <span className="text-xs text-red-500">Inativa</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CategoryFormDialog
        open={createModalOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false)
            setEditingCategory(null)
          }
        }}
        category={editingCategory}
        onSuccess={loadData}
      />
    </MainLayout>
  )
}
```

**Arquivo:** `components/settings/category-form-dialog.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createCategory, updateCategory } from '@/app/actions/categories'
import { useToast } from '@/hooks/use-toast'
import type { Category } from '@/lib/types'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess?: () => void
}

const CATEGORY_TYPES = [
  { value: 'vinculo', label: 'Vínculo' },
  { value: 'centro_custo', label: 'Centro de Custo' },
  { value: 'forma_pagamento', label: 'Forma de Pagamento' },
  { value: 'imovel_tipo', label: 'Tipo de Imóvel' },
  { value: 'imovel_classe', label: 'Classe de Imóvel' },
  { value: 'imovel_subclasse', label: 'Subclasse de Imóvel' },
  { value: 'veiculo_tipo', label: 'Tipo de Veículo' },
  { value: 'veiculo_combustivel', label: 'Tipo de Combustível' },
  { value: 'empreendimento_tipo', label: 'Tipo de Empreendimento' },
]

export function CategoryFormDialog({ open, onOpenChange, category, onSuccess }: CategoryFormDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        description: category.description || '',
        is_active: category.is_active,
        display_order: category.display_order,
      })
    } else {
      setFormData({
        name: '',
        type: '',
        description: '',
        is_active: true,
        display_order: 0,
      })
    }
  }, [category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const result = category
      ? await updateCategory(category.id, formData)
      : await createCategory(formData as any)

    if (result.success) {
      toast({
        title: category ? 'Categoria atualizada!' : 'Categoria criada!',
        description: `A categoria "${formData.name}" foi ${category ? 'atualizada' : 'criada'} com sucesso.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: `Erro ao ${category ? 'atualizar' : 'criar'} categoria`,
        description: result.error,
        variant: 'destructive',
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar' : 'Nova'} Categoria</DialogTitle>
          <DialogDescription>
            {category ? 'Atualize' : 'Crie'} uma categoria do sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                disabled={!!category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Categoria ativa
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### **ETAPA 5: Atualizar Componentes de Formulário** ⏱️ 120 min

#### **5.1. Contas a Pagar - Criar/Editar**

**Arquivos a atualizar:**
- `components/financial/account-form-dialog.tsx`
- `components/financial/edit-payable-dialog.tsx`
- `components/financial/accounts-payable-filters.tsx`

**Mudança:** Substituir `mockVinculos` e `mockCentrosCusto` por categorias dinâmicas

```typescript
// ANTES:
import { mockVinculos, mockCentrosCusto } from "@/lib/mock-data"

{mockVinculos.map((vinculo) => (
  <SelectItem key={vinculo} value={vinculo}>
    {vinculo}
  </SelectItem>
))}

// DEPOIS:
import { useCategories } from "@/hooks/use-categories"

const { categories: vinculos } = useCategories('vinculo')
const { categories: centrosCusto } = useCategories('centro_custo')

{vinculos.map((vinculo) => (
  <SelectItem key={vinculo.id} value={vinculo.name}>
    {vinculo.name}
  </SelectItem>
))}
```

#### **5.2. Contas a Receber - Criar/Editar**

**Arquivos a atualizar:**
- `components/financial/edit-account-dialog.tsx`
- `components/financial/account-filter.tsx`
- `components/financial/accounts-receivable-filters.tsx`

**Mudança:** Mesma lógica acima

#### **5.3. Caixa - Criar/Filtros**

**Arquivos a atualizar:**
- `components/financial/create-transaction-modal.tsx`
- `components/financial/cash-filters.tsx`

**Mudança:** Mesma lógica acima, incluindo `forma_pagamento`

#### **5.4. Imóveis - Criar/Editar**

**Arquivos a atualizar:**
- `components/database/property-create-modal.tsx`
- `components/database/edit-property-dialog.tsx`

**Mudança:** Substituir enums fixos por categorias dinâmicas

```typescript
// ANTES:
<SelectContent>
  <SelectItem value="residencial">Residencial</SelectItem>
  <SelectItem value="comercial">Comercial</SelectItem>
  <SelectItem value="industrial">Industrial</SelectItem>
  <SelectItem value="rural">Rural</SelectItem>
  <SelectItem value="terreno">Terreno</SelectItem>
</SelectContent>

// DEPOIS:
import { useCategories } from "@/hooks/use-categories"

const { categories: tiposImovel } = useCategories('imovel_tipo')
const { categories: classesImovel } = useCategories('imovel_classe')
const { categories: subclassesImovel } = useCategories('imovel_subclasse')

<SelectContent>
  {tiposImovel.map((tipo) => (
    <SelectItem key={tipo.id} value={tipo.name}>
      {tipo.name}
    </SelectItem>
  ))}
</SelectContent>
```

#### **5.5. Veículos - Criar/Editar**

**Arquivos a atualizar:**
- `components/database/vehicle-create-modal.tsx`
- `components/database/edit-vehicle-dialog.tsx`

**Mudança:** Substituir enums fixos

```typescript
const { categories: tiposVeiculo } = useCategories('veiculo_tipo')
const { categories: tiposCombustivel } = useCategories('veiculo_combustivel')
```

#### **5.6. Empreendimentos - Criar/Editar**

**Arquivos a atualizar:**
- `components/database/development-create-modal.tsx`
- `components/database/edit-development-dialog.tsx`

**Mudança:** Substituir enums fixos

```typescript
const { categories: tiposEmpreendimento } = useCategories('empreendimento_tipo')
```

### **ETAPA 6: Atualizar Navegação** ⏱️ 10 min

**Arquivo:** `components/sidebar-nav.tsx`

Adicionar link para categorias em Configurações:

```typescript
{
  title: "Configurações",
  icon: Settings,
  submenu: [
    { title: "Minha Conta", href: "/configuracoes/minha-conta" },
    { title: "Usuários", href: "/configuracoes/usuarios", adminOnly: true },
    { title: "Categorias", href: "/configuracoes/categorias", adminOnly: true },
  ],
},
```

### **ETAPA 7: Remover Mock Data** ⏱️ 10 min

**Arquivo:** `lib/mock-data.ts`

Remover ou comentar:
- `mockVinculos`
- `mockCentrosCusto`
- Exportações relacionadas

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Banco de Dados**
- [ ] Criar tabela `categories`
- [ ] Criar trigger para `updated_at`
- [ ] Habilitar RLS e criar policies
- [ ] Popular com categorias padrão
- [ ] Verificar dados existentes e migrar se necessário

### **Backend (Actions)**
- [ ] Criar `app/actions/categories.ts`
- [ ] Implementar CRUD completo
- [ ] Validar permissões de admin

### **Frontend (Componentes)**
- [ ] Adicionar tipo `Category` em `lib/types.ts`
- [ ] Criar hook `hooks/use-categories.ts`
- [ ] Criar página `app/configuracoes/categorias/page.tsx`
- [ ] Criar componente `components/settings/category-form-dialog.tsx`
- [ ] Atualizar formulários de contas a pagar (3 arquivos)
- [ ] Atualizar formulários de contas a receber (3 arquivos)
- [ ] Atualizar formulários de caixa (2 arquivos)
- [ ] Atualizar formulários de imóveis (2 arquivos)
- [ ] Atualizar formulários de veículos (2 arquivos)
- [ ] Atualizar formulários de empreendimentos (2 arquivos)
- [ ] Atualizar navegação sidebar

### **Limpeza**
- [ ] Remover `mockVinculos` de `lib/mock-data.ts`
- [ ] Remover `mockCentrosCusto` de `lib/mock-data.ts`
- [ ] Remover imports não utilizados

---

## 🧪 TESTES

### **Testes Funcionais**

1. **Gerenciamento de Categorias**
   - [ ] Admin consegue criar nova categoria
   - [ ] Admin consegue editar categoria existente
   - [ ] Admin consegue desativar categoria
   - [ ] Usuário não-admin não consegue criar/editar/deletar
   - [ ] Categorias aparecem ordenadas corretamente

2. **Contas a Pagar**
   - [ ] Categorias dinâmicas carregam nos selects
   - [ ] É possível criar conta com categoria customizada
   - [ ] Filtros funcionam com categorias dinâmicas

3. **Contas a Receber**
   - [ ] Categorias dinâmicas carregam nos selects
   - [ ] É possível criar conta com categoria customizada
   - [ ] Filtros funcionam com categorias dinâmicas

4. **Caixa**
   - [ ] Categorias dinâmicas carregam nos selects
   - [ ] Transações podem ser criadas com categorias customizadas

5. **Patrimônio (Imóveis/Veículos/Empreendimentos)**
   - [ ] Tipos, classes e subclasses carregam dinamicamente
   - [ ] É possível cadastrar com categorias customizadas

### **Testes de Performance**
- [ ] Carregamento de categorias é rápido (< 500ms)
- [ ] Não há lentidão ao abrir formulários
- [ ] Cache funciona corretamente

### **Testes de Segurança**
- [ ] RLS impede criação por não-admin
- [ ] RLS impede edição por não-admin
- [ ] RLS impede deleção por não-admin
- [ ] Todos podem visualizar categorias ativas

---

## 📝 NOTAS IMPORTANTES

### **Compatibilidade com Dados Existentes**

As tabelas `accounts_payable`, `accounts_receivable` e `cash_transactions` continuam usando campos TEXT para `vinculo`, `centro_custo` e `forma`. Isso garante retrocompatibilidade total. 

Se necessário, no futuro pode-se criar foreign keys para a tabela `categories`, mas isso exigiria uma migração de dados mais complexa.

### **Flexibilidade**

Este design permite:
- ✅ Administradores criarem categorias sem mexer no código
- ✅ Categorias inativas continuam no banco mas não aparecem nos selects
- ✅ Ordenação customizada de categorias
- ✅ Descrições opcionais para cada categoria
- ✅ Total controle de acesso (apenas admins)

### **Extensibilidade**

Para adicionar novo tipo de categoria no futuro:
1. Adicionar valor no CHECK constraint da tabela
2. Adicionar label no objeto `CATEGORY_TYPE_LABELS`
3. Adicionar no array `CATEGORY_TYPES` do formulário
4. Criar hook específico se necessário

---

## 🎯 RESULTADO ESPERADO

Após a implementação completa:

1. **Página de Categorias** em `/configuracoes/categorias` acessível apenas para admins
2. **Todos os formulários** de criação/edição usarão categorias dinâmicas do banco
3. **Todos os filtros** usarão categorias dinâmicas
4. **Compatibilidade total** com dados existentes
5. **Sistema flexível** para adicionar novas categorias sem deploy de código

---

## ⏱️ ESTIMATIVA TOTAL

- **Backend (BD + Actions):** 2 horas
- **Frontend (Componentes):** 4 horas
- **Testes:** 1 hora
- **Total:** ~7 horas de desenvolvimento

---

**Status:** ✅ Roteiro completo e pronto para execução  
**Responsável:** Dev  
**Revisado por:** QA
