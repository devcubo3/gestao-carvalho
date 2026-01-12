# Implementação de Categorias Dinâmicas - Concluída ✅

## Resumo da Implementação

Este documento descreve a implementação completa do sistema de categorias dinâmicas, que permite ao administrador gerenciar todas as categorias do sistema através de uma interface administrativa.

## Estrutura do Banco de Dados

### Tabela: `public.categories`

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'vinculo',
      'centro_custo', 
      'forma_pagamento',
      'imovel_tipo',
      'imovel_classe',
      'imovel_subclasse',
      'veiculo_tipo',
      'veiculo_combustivel',
      'empreendimento_tipo'
    )
  ),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);
```

### Migrações Aplicadas

1. **create_categories_table** - Estrutura da tabela com campos e índices
2. **create_categories_trigger_and_rls** - Trigger de updated_at e políticas RLS
3. **seed_categories_default_data** - 59 categorias iniciais em 9 tipos

### Políticas RLS (Row Level Security)

- **SELECT**: Todos os usuários autenticados podem visualizar
- **INSERT**: Apenas administradores podem criar
- **UPDATE**: Apenas administradores podem editar
- **DELETE**: Apenas administradores podem excluir (soft delete via is_active)

### Índices Criados

- `idx_categories_type` - Otimiza consultas por tipo
- `idx_categories_is_active` - Otimiza filtro de categorias ativas
- `idx_categories_type_active` - Índice composto para consultas principais
- `idx_categories_display_order` - Otimiza ordenação

## Backend

### Arquivo: `app/actions/categories.ts`

Implementa todas as operações CRUD:

- **getCategories(type?)** - Busca categorias ativas por tipo (opcional)
- **getAllCategories()** - Busca todas as categorias (admin only)
- **createCategory(data)** - Cria nova categoria
- **updateCategory(id, data)** - Atualiza categoria existente
- **deleteCategory(id)** - Remove categoria (soft delete)
- **getUserPermissions()** - Verifica permissões do usuário

### Arquivo: `lib/types.ts`

```typescript
export interface Category {
  id: string
  name: string
  type: 'vinculo' | 'centro_custo' | 'forma_pagamento' | 
        'imovel_tipo' | 'imovel_classe' | 'imovel_subclasse' |
        'veiculo_tipo' | 'veiculo_combustivel' | 'empreendimento_tipo'
  description?: string
  is_active: boolean
  display_order: number
  created_by?: string
  created_at?: string
  updated_at?: string
}
```

### Arquivo: `hooks/use-categories.ts`

Hook personalizado para carregar categorias por tipo:

```typescript
const { categories, isLoading, error } = useCategories('vinculo')
```

## Interface de Gerenciamento

### Página: `app/configuracoes/categorias/page.tsx`

Página administrativa que exibe todas as categorias agrupadas por tipo em cards. Recursos:
- Visualização organizada por tipo de categoria
- Indicadores visuais de status (ativo/inativo)
- Botões de editar e excluir por categoria
- Botão para criar novas categorias
- Verificação de permissões (admin only)

### Componente: `components/settings/category-form-dialog.tsx`

Modal para criar/editar categorias. Campos:
- **Tipo** - Seletor de tipo (desabilitado na edição)
- **Nome** - Nome da categoria (obrigatório)
- **Descrição** - Texto descritivo opcional
- **Ordem de Exibição** - Número para controlar ordenação
- **Ativo** - Checkbox para ativar/desativar

## Formulários Atualizados

Todos os formulários que usavam categorias fixas foram atualizados para usar o hook `useCategories`:

### Financeiro - Contas a Pagar
- ✅ `components/financial/edit-payable-dialog.tsx`
- ✅ `components/financial/account-form-dialog.tsx`
- ✅ `components/financial/accounts-payable-filters.tsx`

### Financeiro - Contas a Receber
- ✅ `components/financial/edit-account-dialog.tsx`
- ✅ `components/financial/account-filter.tsx`
- ✅ `components/financial/accounts-receivable-filters.tsx`

### Financeiro - Caixa
- ✅ `components/financial/cash-filters.tsx`

## Navegação

### Arquivo: `components/sidebar-nav.tsx`

Adicionado item "Categorias" no menu Configurações:

```typescript
{
  title: "Categorias",
  href: "/configuracoes/categorias",
  icon: Database,
}
```

## Padrão de Uso nos Componentes

### Import
```typescript
import { useCategories } from "@/hooks/use-categories"
```

### Uso do Hook
```typescript
const { categories: vinculos } = useCategories('vinculo')
const { categories: centrosCusto } = useCategories('centro_custo')
```

### Mapeamento em SelectContent
```typescript
<SelectContent>
  {vinculos.map((vinculo) => (
    <SelectItem key={vinculo.id} value={vinculo.name}>
      {vinculo.name}
    </SelectItem>
  ))}
</SelectContent>
```

## Tipos de Categorias Implementados

1. **vinculo** - Vínculo da transação
2. **centro_custo** - Centro de Custo
3. **forma_pagamento** - Forma de Pagamento
4. **imovel_tipo** - Tipo de Imóvel
5. **imovel_classe** - Classe do Imóvel
6. **imovel_subclasse** - Subclasse do Imóvel
7. **veiculo_tipo** - Tipo de Veículo
8. **veiculo_combustivel** - Tipo de Combustível
9. **empreendimento_tipo** - Tipo de Empreendimento

## Dados Iniciais (Seed)

### Vínculo (10 categorias)
- Aluguel, Compra, Venda, Permuta, Doação, Herança, Locação Comercial, Arrendamento, Cessão de Direitos, Empréstimo

### Centro de Custo (7 categorias)
- Administrativo, Comercial, Operacional, Financeiro, Marketing, TI, Recursos Humanos

### Forma de Pagamento (7 categorias)
- Dinheiro, PIX, Transferência Bancária, Cartão de Crédito, Cartão de Débito, Boleto, Cheque

### Imóvel - Tipo (5 categorias)
- Casa, Apartamento, Terreno, Sala Comercial, Galpão

### Imóvel - Classe (7 categorias)
- Residencial, Comercial, Industrial, Rural, Misto, Institucional, Especial

### Imóvel - Subclasse (5 categorias)
- Padrão Alto, Padrão Médio, Padrão Baixo, Luxo, Popular

### Veículo - Tipo (6 categorias)
- Carro, Moto, Caminhão, Van, Ônibus, Outros

### Veículo - Combustível (7 categorias)
- Gasolina, Etanol, Diesel, Flex, Elétrico, Híbrido, GNV

### Empreendimento - Tipo (5 categorias)
- Loteamento, Condomínio, Edifício Comercial, Shopping, Distrito Industrial

## Benefícios da Implementação

1. **Flexibilidade** - Administradores podem adicionar/editar categorias sem alterar código
2. **Manutenibilidade** - Centralização de categorias em uma única tabela
3. **Segurança** - Políticas RLS garantem que apenas admins podem modificar
4. **Escalabilidade** - Fácil adicionar novos tipos de categorias
5. **Auditoria** - Registro de quem criou e quando (created_by, created_at, updated_at)
6. **Soft Delete** - Flag is_active permite desativar sem perder dados
7. **Performance** - Índices otimizados para consultas frequentes

## Como Usar

### Para Administradores

1. Acesse **Configurações > Categorias** no menu lateral
2. Visualize todas as categorias organizadas por tipo
3. Use "Nova Categoria" para criar uma nova
4. Clique em "Editar" para modificar uma categoria existente
5. Use o botão de excluir (🗑️) para desativar uma categoria

### Para Desenvolvedores

Para usar categorias em novos componentes:

```typescript
import { useCategories } from "@/hooks/use-categories"

export function MyComponent() {
  const { categories, isLoading, error } = useCategories('vinculo')
  
  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>
  
  return (
    <Select>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.name}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

## Status da Implementação

- ✅ Banco de dados criado
- ✅ Migrações aplicadas (3)
- ✅ Backend actions implementado
- ✅ Types e hook criados
- ✅ Interface de gerenciamento criada
- ✅ Formulários financeiros atualizados (7 arquivos)
- ✅ Navegação atualizada
- ✅ Sem erros de compilação

## Próximos Passos (Futuro)

1. Atualizar formulários de patrimônio (imóveis, veículos, empreendimentos) quando forem implementados
2. Considerar adicionar tradução/i18n para nomes de categorias
3. Implementar funcionalidade de reordenação drag-and-drop
4. Adicionar histórico de alterações de categorias
5. Implementar importação/exportação de categorias
