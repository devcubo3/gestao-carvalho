# Roteiro de Implementação - Módulo de Veículos

## 📋 Análise Realizada

### Status do Banco de Dados
✅ **Tabela `vehicles` criada com sucesso** no Supabase com a seguinte estrutura:

#### Campos da Tabela
- `id` (UUID) - Chave primária
- `code` (TEXT UNIQUE) - Código único (VEI-0001, VEI-0002, etc.)
- `type` (TEXT) - Tipo: carro, moto, caminhao, barco, onibus, van
- `brand` (TEXT) - Marca do veículo
- `model` (TEXT) - Modelo do veículo
- `year` (INTEGER) - Ano de fabricação (1900-2100)
- `plate` (TEXT) - Placa do veículo
- `chassis` (TEXT) - Número do chassi
- `color` (TEXT) - Cor do veículo
- `renavam` (TEXT) - Número do RENAVAM
- `fuel_type` (TEXT) - Tipo de combustível: gasolina, etanol, flex, diesel, eletrico, hibrido, gnv
- `reference_value` (NUMERIC) - Valor de referência (>= 0)
- `status` (TEXT) - Status: disponivel, comprometido, vendido, manutencao
- `notes` (TEXT) - Observações
- `created_by` (UUID) - Referência ao usuário criador
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização

#### Recursos Implementados no BD
✅ Trigger para atualização automática de `updated_at`
✅ Função `generate_vehicle_code()` para geração automática de códigos
✅ RLS (Row Level Security) habilitado com políticas:
  - SELECT: Todos usuários autenticados
  - INSERT/UPDATE: Admin e Editor
  - DELETE: Apenas Admin
✅ Índices para otimização de consultas

### Status da Página Frontend
⚠️ **Página está usando dados mockados** (`mockVehicles` do `lib/mock-data.ts`)

Arquivos existentes:
- ✅ `app/banco-dados/veiculos/page.tsx` - Página principal
- ✅ `components/database/vehicles-table.tsx` - Componente de tabela
- ⚠️ `components/database/vehicle-create-modal.tsx` - Referenciado mas não existe
- ✅ `lib/types.ts` - Interface Vehicle definida

---

## 🎯 Tarefas de Implementação

### 1. Criar Server Actions para Veículos
📄 Arquivo: `app/actions/vehicles.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Tipos
type VehicleInput = {
  code?: string
  type: string
  brand: string
  model: string
  year: number
  plate: string
  chassis: string
  color?: string
  renavam?: string
  fuel_type?: string
  reference_value?: number
  notes?: string
}

// GET - Listar todos os veículos
export async function getVehicles() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

// GET BY ID - Buscar veículo por ID
export async function getVehicleById(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}

// CREATE - Criar novo veículo
export async function createVehicle(input: VehicleInput) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (admin ou editor)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return { success: false, error: "Sem permissão para criar veículos" }
  }

  // Gerar código se não fornecido
  let code = input.code
  if (!code) {
    const { data: codeData } = await supabase.rpc("generate_vehicle_code")
    code = codeData
  }

  const { error } = await supabase
    .from("vehicles")
    .insert({
      ...input,
      code,
      created_by: user.id,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// UPDATE - Atualizar veículo
export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (admin ou editor)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return { success: false, error: "Sem permissão para atualizar veículos" }
  }

  const { error } = await supabase
    .from("vehicles")
    .update(input)
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// DELETE - Deletar veículo
export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Verificar permissão (apenas admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Apenas administradores podem excluir veículos" }
  }

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/banco-dados/veiculos")
  return { success: true, error: null }
}

// UPDATE STATUS - Atualizar apenas o status
export async function updateVehicleStatus(id: string, status: string) {
  return updateVehicle(id, { status })
}

// SEARCH - Buscar veículos com filtros
export async function searchVehicles(filters: {
  type?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado", data: null }
  }

  let query = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters.type) {
    query = query.eq("type", filters.type)
  }

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.search) {
    query = query.or(`code.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,plate.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data, error: null }
}
```

---

### 2. Atualizar Interface de Tipos
📄 Arquivo: `lib/types.ts`

Atualizar a interface `Vehicle` para corresponder ao banco de dados:

```typescript
export interface Vehicle {
  id: string
  code: string
  type: "carro" | "moto" | "caminhao" | "barco" | "onibus" | "van"
  brand: string
  model: string
  year: number
  plate: string
  chassis: string
  color?: string
  renavam?: string
  fuel_type?: "gasolina" | "etanol" | "flex" | "diesel" | "eletrico" | "hibrido" | "gnv"
  reference_value?: number
  status: "disponivel" | "comprometido" | "vendido" | "manutencao"
  notes?: string
  created_by?: string
  created_at: string | Date
  updated_at: string | Date
}
```

---

### 3. Atualizar Página Principal
📄 Arquivo: `app/banco-dados/veiculos/page.tsx`

Converter para Server Component e usar dados reais:

```typescript
import { MainLayout } from "@/components/main-layout"
import { VehiclesTable } from "@/components/database/vehicles-table"
import { getVehicles } from "@/app/actions/vehicles"

export default async function VehiclesPage() {
  const result = await getVehicles()
  const vehicles = result.success && result.data ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Veículos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de veículos do patrimônio</p>
          </div>
        </div>

        <VehiclesTable vehicles={vehicles} />
      </div>
    </MainLayout>
  )
}
```

---

### 4. Atualizar Componente de Tabela
📄 Arquivo: `components/database/vehicles-table.tsx`

Adicionar funcionalidades de edição, exclusão e controle de permissões:

**Principais mudanças:**
- Importar `useState`, `useEffect` do React
- Importar `createClient` do Supabase
- Importar `useRouter` e `useToast`
- Importar server actions (deleteVehicle, updateVehicle)
- Importar modais de criação, edição e exclusão
- Adicionar estados para modais e veículo selecionado
- Adicionar estado para role do usuário
- Criar função `fetchUserRole` no useEffect
- Atualizar função `handleAction` para abrir modais
- Criar funções `handleEdit` e `handleDelete`
- Atualizar coluna de ações para mostrar botões diretos (sem dropdown)
- Controlar visibilidade dos botões baseado em permissões:
  - Editar: visível para admin e editor
  - Excluir: visível apenas para admin
- Adicionar os três modais no JSX: Create, Edit, Delete

---

### 5. Criar Modal de Criação
📄 Arquivo: `components/database/vehicle-create-modal.tsx`

Seguir o padrão do `property-create-modal.tsx`:

**Campos do formulário:**
- Tipo* (Select): Carro, Moto, Caminhão, Barco, Ônibus, Van
- Marca* (Input text)
- Modelo* (Input text)
- Ano* (Input number, 1900-2100)
- Placa* (Input text com máscara: AAA-0A00)
- Chassi* (Input text)
- Cor (Input text)
- RENAVAM (Input text)
- Tipo de Combustível (Select): Gasolina, Etanol, Flex, Diesel, Elétrico, Híbrido, GNV
- Valor de Referência (Input number, opcional)
- Observações (Textarea)

**Funcionalidades:**
- Validação de campos obrigatórios
- Formatação automática da placa (padrão Mercosul)
- Integração com `createVehicle` server action
- Feedback visual (loading, toast)
- Fechar modal após sucesso

---

### 6. Criar Modal de Edição
📄 Arquivo: `components/database/edit-vehicle-dialog.tsx`

Seguir o padrão do `edit-property-dialog.tsx`:

**Características:**
- Mesmos campos do modal de criação
- Preencher dados do veículo selecionado no useEffect
- Campo código (code) não editável (disabled)
- Integração com `updateVehicle` server action
- Validações idênticas ao modal de criação

---

### 7. Criar Modal de Exclusão
📄 Arquivo: `components/database/delete-vehicle-dialog.tsx`

Seguir o padrão do `delete-property-dialog.tsx`:

**Características:**
- Confirmação digitando "excluir"
- Exibir informações do veículo (código, marca/modelo, placa)
- Alerta vermelho de ação irreversível
- Integração com `deleteVehicle` server action
- Feedback visual durante exclusão

---

## 🔧 Validações e Regras de Negócio

### Validações de Campos
1. **Placa**: Formato Mercosul (AAA-0A00) ou antigo (AAA-0000)
2. **Ano**: Entre 1900 e ano atual + 1
3. **Chassi**: 17 caracteres alfanuméricos
4. **Valor de Referência**: >= 0 (se informado)
5. **RENAVAM**: 11 dígitos (se informado)

### Permissões
- **Visualizar**: Todos usuários autenticados
- **Criar/Editar**: Admin e Editor
- **Excluir**: Apenas Admin

### Status
- **Disponível**: Veículo disponível para venda/uso
- **Comprometido**: Veículo reservado/negociação em andamento
- **Vendido**: Veículo já vendido
- **Manutenção**: Veículo em manutenção/reparo

---

## ✅ Checklist de Implementação

### Backend
- [x] Criar tabela `vehicles` no Supabase
- [x] Criar função `generate_vehicle_code()`
- [x] Criar trigger para `updated_at`
- [x] Configurar RLS policies
- [x] Criar índices de otimização
- [ ] Criar server actions em `app/actions/vehicles.ts`

### Frontend
- [ ] Atualizar interface `Vehicle` em `lib/types.ts`
- [ ] Atualizar página em `app/banco-dados/veiculos/page.tsx`
- [ ] Atualizar `components/database/vehicles-table.tsx`
- [ ] Criar `components/database/vehicle-create-modal.tsx`
- [ ] Criar `components/database/edit-vehicle-dialog.tsx`
- [ ] Criar `components/database/delete-vehicle-dialog.tsx`

### Testes
- [ ] Testar criação de veículo (admin/editor)
- [ ] Testar edição de veículo (admin/editor)
- [ ] Testar exclusão de veículo (admin)
- [ ] Testar permissões (visualizador não deve editar/excluir)
- [ ] Testar geração automática de códigos
- [ ] Testar formatação de placa
- [ ] Testar validações de campos
- [ ] Testar busca/filtros

---

## 📝 Notas Importantes

1. **Padrão de Código**: Seguir exatamente o padrão implementado em imóveis (properties)
2. **Máscaras**: Implementar formatação automática para placa no onChange
3. **Breadcrumb**: Usar "Patrimônio" ao invés de "Banco de Dados" (como em imóveis)
4. **Ações Visuais**: Usar botões diretos ao invés de dropdown menu
5. **Toast Notifications**: Usar em todas as ações (criar, editar, excluir)
6. **Refresh**: Usar `router.refresh()` após operações bem-sucedidas

---

## 🎨 Referências de Implementação

Use como base os seguintes arquivos já implementados para imóveis:
- `app/actions/properties.ts` → estrutura dos server actions
- `components/database/property-create-modal.tsx` → modal de criação
- `components/database/edit-property-dialog.tsx` → modal de edição
- `components/database/delete-property-dialog.tsx` → modal de exclusão
- `components/database/properties-table.tsx` → tabela com ações

---

## 🚀 Ordem de Execução Sugerida

1. Criar `app/actions/vehicles.ts` (server actions)
2. Atualizar `lib/types.ts` (interface Vehicle)
3. Criar `components/database/vehicle-create-modal.tsx`
4. Criar `components/database/edit-vehicle-dialog.tsx`
5. Criar `components/database/delete-vehicle-dialog.tsx`
6. Atualizar `components/database/vehicles-table.tsx`
7. Atualizar `app/banco-dados/veiculos/page.tsx`
8. Testar todas as funcionalidades

---

**Data da Análise**: 13 de dezembro de 2025  
**Analista**: QA Agent  
**Status do Banco**: ✅ Pronto para uso  
**Status do Frontend**: ⚠️ Pendente de implementação
