# 🏢 ROTEIRO DE IMPLEMENTAÇÃO - PÁGINA DE IMÓVEIS

**Data de Análise:** 12 de dezembro de 2025  
**Analista:** QA Agent  
**Status:** ⚠️ Requer Implementação Completa

---

## 📋 SUMÁRIO EXECUTIVO

### Situação Atual
- ✅ **Interface:** Página e componentes criados com UI completa
- ❌ **Banco de Dados:** Tabela `properties` NÃO EXISTE no Supabase
- ❌ **Server Actions:** Nenhuma ação implementada
- ⚠️ **Dados:** Usando mock data estático (`mockProperties`)

### Análise do Banco de Dados Supabase
**Tabelas Existentes no Schema Public:**
- ✅ profiles (usuários)
- ✅ people (pessoas físicas)
- ✅ companies (empresas)
- ✅ bank_accounts (contas bancárias)
- ✅ cash_transactions (transações)
- ✅ accounts_receivable (contas a receber)
- ✅ accounts_payable (contas a pagar)
- ✅ receivable_payments (pagamentos recebidos)
- ✅ payable_payments (pagamentos efetuados)
- ✅ cash_closings (fechamentos de caixa)
- ❌ **properties** - TABELA NÃO EXISTE

### Requisitos Identificados
Com base na interface existente e no tipo `Property` definido em `lib/types.ts`, a página de imóveis precisa suportar:

**Campos Obrigatórios:**
- Código (formato IMV-0001)
- Nome/Identificação usual
- Tipo (casa, apartamento, terreno, comercial)
- Classe (ex: Casa, Apartamento, Sala, Loja, Galpão)
- Subclasse (ex: Padrão, Alto Padrão, Popular, Luxo)
- Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)
- Área (m²)
- Matrícula/Registro
- Valor de referência
- Status (disponível, comprometido, vendido)

**Campos Opcionais:**
- Observações/Notas
- Criado por (user_id)
- Datas de criação e atualização

---

## 🎯 ETAPA 1: ESTRUTURA DO BANCO DE DADOS

### 1.1 Criar Tabela `properties`

**Arquivo:** Criar migration via MCP Supabase

```sql
-- =====================================================
-- TABELA: properties
-- DESCRIÇÃO: Cadastro de imóveis do patrimônio
-- =====================================================

CREATE TABLE IF NOT EXISTS public.properties (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  identification TEXT NOT NULL,
  
  -- Classificação
  type TEXT NOT NULL CHECK (type IN ('casa', 'apartamento', 'terreno', 'comercial')),
  classe TEXT,
  subclasse TEXT,
  
  -- Localização
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (LENGTH(state) = 2),
  zip_code TEXT NOT NULL,
  
  -- Características
  area NUMERIC NOT NULL CHECK (area > 0),
  registry TEXT NOT NULL,
  reference_value NUMERIC NOT NULL CHECK (reference_value >= 0),
  
  -- Status e Controle
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.properties IS 'Cadastro de imóveis do patrimônio da empresa';
COMMENT ON COLUMN public.properties.code IS 'Código único do imóvel (ex: IMV-0001)';
COMMENT ON COLUMN public.properties.identification IS 'Nome usual/identificação do imóvel';
COMMENT ON COLUMN public.properties.type IS 'Tipo do imóvel: casa, apartamento, terreno, comercial';
COMMENT ON COLUMN public.properties.classe IS 'Classe do imóvel (Casa, Apartamento, Sala, Loja, Galpão)';
COMMENT ON COLUMN public.properties.subclasse IS 'Subclasse (Padrão, Alto Padrão, Popular, Luxo)';
COMMENT ON COLUMN public.properties.area IS 'Área total em m²';
COMMENT ON COLUMN public.properties.registry IS 'Número da matrícula/registro do imóvel';
COMMENT ON COLUMN public.properties.reference_value IS 'Valor de referência do imóvel';
COMMENT ON COLUMN public.properties.status IS 'Status: disponivel, comprometido, vendido';

-- Índices
CREATE INDEX idx_properties_code ON public.properties(code);
CREATE INDEX idx_properties_type ON public.properties(type);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_created_at ON public.properties(created_at);
```

### 1.2 Criar Trigger para Atualização Automática de `updated_at`

```sql
-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_properties_updated_at();
```

### 1.3 Configurar RLS (Row Level Security)

```sql
-- =====================================================
-- RLS POLICIES: Controle de acesso baseado em roles
-- =====================================================

-- Ativar RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura (todos autenticados)
CREATE POLICY "properties_select_policy" ON public.properties
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Inserção (admin e editor)
CREATE POLICY "properties_insert_policy" ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy: Atualização (admin e editor)
CREATE POLICY "properties_update_policy" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy: Exclusão (apenas admin)
CREATE POLICY "properties_delete_policy" ON public.properties
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

### 1.4 Função para Gerar Código Automático

```sql
-- =====================================================
-- FUNCTION: Gerar próximo código de imóvel
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Buscar o último código usado
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(code FROM 'IMV-(\d+)') AS INTEGER)),
    0
  ) INTO next_number
  FROM public.properties
  WHERE code ~ '^IMV-\d{4}$';
  
  -- Incrementar e formatar
  next_number := next_number + 1;
  new_code := 'IMV-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_property_code() IS 'Gera o próximo código sequencial para imóveis (IMV-0001, IMV-0002, etc)';
```

---

## 🔧 ETAPA 2: SERVER ACTIONS

### 2.1 Criar arquivo `app/actions/properties.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PropertyType = 'casa' | 'apartamento' | 'terreno' | 'comercial'
export type PropertyStatus = 'disponivel' | 'comprometido' | 'vendido'

export interface PropertyFormData {
  code?: string // Se não fornecido, será gerado automaticamente
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
  reference_value: number
  status?: PropertyStatus
  notes?: string
}

export interface Property extends PropertyFormData {
  id: string
  code: string
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
        !formData.registry || formData.reference_value === undefined) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }
    }

    if (formData.area <= 0) {
      return { success: false, error: 'Área deve ser maior que zero' }
    }

    if (formData.reference_value < 0) {
      return { success: false, error: 'Valor de referência não pode ser negativo' }
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
      reference_value: formData.reference_value,
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

    if (formData.reference_value !== undefined && formData.reference_value < 0) {
      return { success: false, error: 'Valor de referência não pode ser negativo' }
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
    if (formData.reference_value !== undefined) updateData.reference_value = formData.reference_value
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
      query = query.gte('reference_value', filters.minValue)
    }

    if (filters.maxValue !== undefined) {
      query = query.lte('reference_value', filters.maxValue)
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
```

---

## 🎨 ETAPA 3: ATUALIZAR COMPONENTES

### 3.1 Atualizar `app/banco-dados/imoveis/page.tsx`

```typescript
import { MainLayout } from "@/components/main-layout"
import { PropertiesTable } from "@/components/database/properties-table"
import { getProperties } from "@/app/actions/properties"

export default async function PropertiesPage() {
  const result = await getProperties()
  const properties = result.success ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Imóveis" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Imóveis</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de imóveis do patrimônio</p>
          </div>
        </div>

        <PropertiesTable properties={properties} />
      </div>
    </MainLayout>
  )
}
```

### 3.2 Atualizar `lib/types.ts`

Atualizar a interface `Property` para corresponder ao banco de dados:

```typescript
export interface Property {
  id: string
  code: string
  identification: string
  
  // Classificação
  type: 'casa' | 'apartamento' | 'terreno' | 'comercial'
  classe: string | null
  subclasse: string | null
  
  // Endereço
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  
  // Características
  area: number
  registry: string
  reference_value: number
  
  // Status
  status: 'disponivel' | 'comprometido' | 'vendido'
  notes: string | null
  
  // Auditoria
  created_by: string | null
  created_at: string
  updated_at: string
}
```

### 3.3 Atualizar `components/database/properties-table.tsx`

Modificar para usar os nomes de campos corretos do banco de dados:

```typescript
// Importar actions
import { deleteProperty, updatePropertyStatus } from "@/app/actions/properties"

// Atualizar renders das colunas para usar os campos corretos:
{
  key: "code",
  label: "Código",
  width: "w-24",
  render: (property) => <span className="font-medium">{property.code}</span>,
},
{
  key: "type",
  label: "Tipo",
  width: "w-32",
  render: (property) => <Badge variant="outline">{getTypeLabel(property.type)}</Badge>,
},
{
  key: "identification",
  label: "Nome Usual",
  width: "min-w-[150px]",
  render: (property) => <span className="font-medium">{property.identification}</span>,
},
{
  key: "street",
  label: "Endereço",
  width: "min-w-[200px]",
  sortable: false,
  render: (property) => (
    <div className="truncate text-sm">
      {property.street}, {property.number}
    </div>
  ),
},
{
  key: "city",
  label: "Cidade",
  width: "w-40",
  render: (property) => <span className="text-sm">{property.city}</span>,
},
{
  key: "area",
  label: "Área (m²)",
  width: "w-28",
  align: "right",
  render: (property) => property.area.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
},
{
  key: "registry",
  label: "Matrícula",
  width: "w-28",
  render: (property) => <span className="font-mono text-sm">{property.registry}</span>,
},

// Adicionar handlers reais:
const handleAction = async (action: string, propertyId: string) => {
  if (action === "delete") {
    if (confirm("Tem certeza que deseja excluir este imóvel?")) {
      const result = await deleteProperty(propertyId)
      if (result.success) {
        toast({ title: "Imóvel excluído com sucesso!" })
      } else {
        toast({ 
          title: "Erro ao excluir imóvel", 
          description: result.error,
          variant: "destructive" 
        })
      }
    }
  }
  // Implementar outras ações conforme necessário
}
```

### 3.4 Atualizar `components/database/property-create-modal.tsx`

Integrar com a action real:

```typescript
import { createProperty } from "@/app/actions/properties"

// No handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (
    !formData.identification ||
    !formData.type ||
    !formData.street ||
    !formData.number ||
    !formData.neighborhood ||
    !formData.city ||
    !formData.state ||
    !formData.zip_code ||
    !formData.area ||
    !formData.registry
  ) {
    toast({
      title: "Erro de validação",
      description: "Todos os campos obrigatórios devem ser preenchidos.",
      variant: "destructive",
    })
    return
  }

  setIsLoading(true)

  const result = await createProperty({
    identification: formData.identification,
    type: formData.type as any,
    classe: formData.classe || undefined,
    subclasse: formData.subclasse || undefined,
    street: formData.street,
    number: formData.number,
    neighborhood: formData.neighborhood,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zip_code,
    area: Number(formData.area),
    registry: formData.registry,
    reference_value: Number(formData.valor) || 0,
  })

  setIsLoading(false)

  if (result.success) {
    toast({
      title: "Imóvel criado com sucesso!",
      description: `Imóvel "${formData.identification}" foi adicionado ao patrimônio.`,
    })
    onOpenChange(false)
    onSuccess?.()
    // Limpar formulário...
  } else {
    toast({
      title: "Erro ao criar imóvel",
      description: result.error,
      variant: "destructive",
    })
  }
}
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados (usar MCP Supabase)
- [ ] 1.1 Criar tabela `properties` com todas as colunas
- [ ] 1.2 Criar trigger `update_properties_updated_at`
- [ ] 1.3 Ativar RLS e criar policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] 1.4 Criar função `generate_property_code()`
- [ ] 1.5 Testar queries básicas no SQL Editor
- [ ] 1.6 Verificar policies com diferentes roles

### Fase 2: Server Actions
- [ ] 2.1 Criar arquivo `app/actions/properties.ts`
- [ ] 2.2 Implementar `getProperties()`
- [ ] 2.3 Implementar `getPropertyById()`
- [ ] 2.4 Implementar `createProperty()`
- [ ] 2.5 Implementar `updateProperty()`
- [ ] 2.6 Implementar `deleteProperty()`
- [ ] 2.7 Implementar `updatePropertyStatus()`
- [ ] 2.8 Implementar `searchProperties()`
- [ ] 2.9 Testar cada action individualmente

### Fase 3: Componentes Frontend
- [ ] 3.1 Atualizar `app/banco-dados/imoveis/page.tsx` (usar async/await)
- [ ] 3.2 Atualizar interface `Property` em `lib/types.ts`
- [ ] 3.3 Atualizar `components/database/properties-table.tsx`
  - [ ] Corrigir nomes de campos
  - [ ] Implementar handlers reais
  - [ ] Adicionar toast notifications
- [ ] 3.4 Atualizar `components/database/property-create-modal.tsx`
  - [ ] Integrar com `createProperty`
  - [ ] Ajustar campos do formulário
  - [ ] Adicionar validações client-side
- [ ] 3.5 Criar componente de edição (opcional)
- [ ] 3.6 Criar página de detalhes (opcional)

### Fase 4: Testes
- [ ] 4.1 Testar criação de imóvel
- [ ] 4.2 Testar listagem com diferentes filtros
- [ ] 4.3 Testar edição de imóvel
- [ ] 4.4 Testar exclusão (apenas admin)
- [ ] 4.5 Testar permissões (admin, editor, visualizador)
- [ ] 4.6 Testar validações (área > 0, estado com 2 chars, etc)
- [ ] 4.7 Testar geração automática de código
- [ ] 4.8 Testar busca e filtros

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Iniciar com Banco de Dados** (Fase 1)
   - Usar MCP Supabase para criar tabela e estrutura
   - Testar diretamente no SQL Editor
   - Verificar RLS policies

2. **Implementar Server Actions** (Fase 2)
   - Criar arquivo de actions
   - Testar cada função isoladamente
   - Validar permissões e retornos

3. **Atualizar Frontend** (Fase 3)
   - Atualizar tipos primeiro
   - Depois page.tsx (server component)
   - Por último, componentes client-side

4. **Testar Integração Completa** (Fase 4)
   - Criar, listar, editar, excluir
   - Testar com diferentes usuários/roles
   - Validar todas as mensagens de erro

---

## ⚠️ PONTOS DE ATENÇÃO

### Migração de Dados Mock para Real
- Os dados mockados em `lib/mock-data.ts` podem ser importados para o banco
- Criar script de migração se necessário
- Ajustar formato de endereço (objeto → campos separados)

### Diferenças de Schema
**Mock Data usa:**
- `address` (objeto com street, number, etc)
- `identification` para nome usual
- `referenceValue` (camelCase)

**Banco de Dados usa:**
- Campos separados: `street`, `number`, `complement`, etc
- `identification` (igual)
- `reference_value` (snake_case)

### Compatibilidade com Componentes
Os componentes atuais esperam alguns campos no formato antigo. Atualizar:
- `properties-table.tsx` → ajustar renders de colunas
- `property-create-modal.tsx` → ajustar campos do formulário
- Criar adapters se necessário para manter compatibilidade

---

## 📊 ESTRUTURA FINAL

```
app/
├── actions/
│   └── properties.ts          ← CRIAR (server actions)
└── banco-dados/
    └── imoveis/
        └── page.tsx          ← ATUALIZAR (integrar com actions)

components/
└── database/
    ├── properties-table.tsx   ← ATUALIZAR (campos e handlers)
    └── property-create-modal.tsx ← ATUALIZAR (integrar action)

lib/
└── types.ts                   ← ATUALIZAR (interface Property)

supabase/
└── migrations/
    └── [timestamp]_create_properties_table.sql ← CRIAR
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] Tabela `properties` criada no Supabase com RLS
- [ ] Todas as server actions funcionando
- [ ] Página de imóveis carrega dados reais do banco
- [ ] Formulário de criação funcional e integrado
- [ ] Validações client e server implementadas
- [ ] Permissões por role funcionando (admin/editor/visualizador)
- [ ] Código gerado automaticamente (IMV-0001, IMV-0002, etc)
- [ ] Busca e filtros operacionais
- [ ] Mensagens de erro e sucesso apropriadas
- [ ] Navegação breadcrumb correta ("Patrimônio" → "Imóveis")

---

## 📌 PRÓXIMOS PASSOS

Após completar a implementação de Imóveis:

1. **Veículos** (`/banco-dados/veiculos`)
   - Seguir estrutura similar
   - Tabela `vehicles`
   - Actions e componentes

2. **Créditos** (`/banco-dados/creditos`)
   - Definir estrutura
   - Implementar conforme necessidade

3. **Empreendimentos** (`/banco-dados/empreendimentos`)
   - Definir estrutura
   - Implementar conforme necessidade

4. **Integração com Contratos**
   - Vincular imóveis/veículos aos contratos
   - Foreign keys e relacionamentos

---

**FIM DO ROTEIRO** 🎯
