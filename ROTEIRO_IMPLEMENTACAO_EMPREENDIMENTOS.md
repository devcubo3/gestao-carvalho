# Roteiro de Implementação - Módulo de Empreendimentos

## 📋 Análise Realizada

### Status Atual
- ✅ **Página existente**: `app/banco-dados/empreendimentos/page.tsx`
- ✅ **Componente de tabela**: `components/database/developments-table.tsx`
- ✅ **Modal de criação**: `components/database/development-create-modal.tsx`
- ✅ **Interface TypeScript**: `lib/types.ts` - Development
- ✅ **Dados mock**: `lib/mock-data.ts` - mockDevelopments
- ❌ **Banco de dados**: Tabela `developments` NÃO EXISTE
- ❌ **Server actions**: Arquivo não existe
- ❌ **Modais de edição/exclusão**: Não existem

### Estrutura de Dados Identificada

**Interface Development (lib/types.ts)**:
```typescript
interface Development {
  id: string
  code: string              // EMP-0001 format
  name: string             // Nome usual
  type: "predio" | "loteamento" | "chacaramento" | "condominio" | "comercial"
  location: string          // Localização completa
  participationPercentage: number  // Percentual de participação
  units?: string[]         // Unidades do empreendimento
  referenceValue: number   // Valor de referência
  status: AssetStatus      // disponivel, comprometido, vendido
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Campos no Modal**:
- Código (code)
- Tipo (type): prédio, loteamento, chacaramento, condomínio, comercial
- Cidade (city) - select com opções fixas
- Nome Usual (name)
- Descrição (description)

---

## 🎯 Plano de Implementação

### ETAPA 1: Estrutura de Banco de Dados

#### 1.1 Criar tabela `developments`

```sql
CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('predio', 'loteamento', 'chacaramento', 'condominio', 'comercial')),
  
  -- Localização
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (LENGTH(state) = 2),
  zip_code TEXT,
  
  -- Informações do empreendimento
  participation_percentage NUMERIC CHECK (participation_percentage >= 0 AND participation_percentage <= 100),
  total_units INTEGER CHECK (total_units > 0),
  reference_value NUMERIC CHECK (reference_value >= 0),
  
  -- Controle
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE developments IS 'Cadastro de empreendimentos imobiliários';
COMMENT ON COLUMN developments.code IS 'Código único do empreendimento (ex: EMP-0001)';
COMMENT ON COLUMN developments.name IS 'Nome usual/fantasia do empreendimento';
COMMENT ON COLUMN developments.type IS 'Tipo: predio, loteamento, chacaramento, condominio, comercial';
COMMENT ON COLUMN developments.participation_percentage IS 'Percentual de participação no empreendimento (0-100)';
COMMENT ON COLUMN developments.total_units IS 'Total de unidades do empreendimento';
COMMENT ON COLUMN developments.reference_value IS 'Valor de referência do empreendimento';
```

#### 1.2 Criar função para gerar código automático

```sql
CREATE OR REPLACE FUNCTION generate_development_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'EMP-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM developments;
  
  new_code := 'EMP-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$;
```

#### 1.3 Criar trigger para atualizar `updated_at`

```sql
CREATE TRIGGER update_developments_updated_at
  BEFORE UPDATE ON developments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 1.4 Criar RLS (Row Level Security)

```sql
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos os usuários autenticados podem ver
CREATE POLICY "developments_select_policy" ON developments
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Apenas admin e editor podem criar
CREATE POLICY "developments_insert_policy" ON developments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- UPDATE: Apenas admin e editor podem editar
CREATE POLICY "developments_update_policy" ON developments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- DELETE: Apenas admin pode excluir
CREATE POLICY "developments_delete_policy" ON developments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### 1.5 Criar tabela de unidades (opcional, para relacionamento)

```sql
CREATE TABLE development_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_type TEXT, -- Apartamento, Casa, Lote, Sala, Loja
  floor TEXT,
  area NUMERIC,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  reference_value NUMERIC CHECK (reference_value >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(development_id, unit_code)
);

COMMENT ON TABLE development_units IS 'Unidades individuais dos empreendimentos';

CREATE TRIGGER update_development_units_updated_at
  BEFORE UPDATE ON development_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE development_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "development_units_select_policy" ON development_units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "development_units_insert_policy" ON development_units
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "development_units_update_policy" ON development_units
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "development_units_delete_policy" ON development_units
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

### ETAPA 2: Server Actions

#### 2.1 Criar arquivo `app/actions/developments.ts`

Implementar funções:

1. **getDevelopments()** - Listar todos
2. **getDevelopmentById(id)** - Buscar por ID
3. **createDevelopment(input)** - Criar novo (gera código via RPC)
4. **updateDevelopment(id, input)** - Atualizar
5. **deleteDevelopment(id)** - Excluir
6. **searchDevelopments(filters)** - Busca com filtros
7. **getDevelopmentUnits(developmentId)** - Listar unidades
8. **createDevelopmentUnit(developmentId, input)** - Criar unidade

**Estrutura de validação**:
- Verificar permissões (admin/editor para criar/editar, admin para excluir)
- Gerar código automaticamente via `generate_development_code()`
- Revalidar cache após mutações

---

### ETAPA 3: Atualizar Interface TypeScript

#### 3.1 Atualizar `lib/types.ts`

```typescript
export interface Development {
  id: string
  code: string
  name: string
  type: 'predio' | 'loteamento' | 'chacaramento' | 'condominio' | 'comercial'
  
  // Endereço
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city: string
  state: string
  zip_code?: string
  
  // Dados do empreendimento
  participation_percentage?: number
  total_units?: number
  reference_value?: number
  
  // Controle
  status: 'disponivel' | 'comprometido' | 'vendido'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DevelopmentUnit {
  id: string
  development_id: string
  unit_code: string
  unit_type?: string
  floor?: string
  area?: number
  status: 'disponivel' | 'reservado' | 'vendido'
  reference_value?: number
  notes?: string
  created_at: string
  updated_at: string
}
```

---

### ETAPA 4: Componentes UI

#### 4.1 Reescrever `components/database/development-create-modal.tsx`

- Remover mock data
- Adicionar todos os campos de endereço
- Campo cidade como input de texto (não select fixo)
- Campo estado (UF) como select
- Campo tipo conforme enum
- Integrar com `createDevelopment()` action
- Auto-gerar código (não permitir edição)
- Adicionar campos: participation_percentage, total_units, reference_value

#### 4.2 Criar `components/database/edit-development-dialog.tsx`

- Mesmo modelo de `edit-credit-dialog.tsx`
- Código desabilitado (não pode alterar)
- Todos os campos editáveis
- Integrar com `updateDevelopment()` action

#### 4.3 Criar `components/database/delete-development-dialog.tsx`

- Mesmo modelo de `delete-credit-dialog.tsx`
- Confirmação com texto "excluir"
- Exibir: código, nome, cidade
- Integrar com `deleteDevelopment()` action

#### 4.4 Atualizar `components/database/developments-table.tsx`

**Alterações necessárias**:
- Remover dropdown de ações
- Adicionar botões diretos: Eye (visualizar), Edit, Trash2 (excluir)
- Buscar role do usuário via profiles (não users!)
- Estados dos modais: isEditModalOpen, isDeleteDialogOpen, selectedDevelopment
- Controle de permissões: canEdit (admin/editor), canDelete (admin)
- Importar e usar os 3 modais
- Atualizar colunas para refletir novos campos do banco
- Adicionar função `handleEdit` e `handleDelete` com router.refresh()

**Colunas sugeridas**:
- Código (code) - w-32
- Tipo (type) com Badge - w-36
- Nome (name) - flex-1 min-w-[200px]
- Cidade (city) - w-40
- Estado (state) - w-24
- Total de Unidades (total_units) - w-32, align center
- Valor de Referência (reference_value) - w-40, align center, formatCurrency
- Ações (actions) - w-28 (3 botões)

---

### ETAPA 5: Páginas

#### 5.1 Atualizar `app/banco-dados/empreendimentos/page.tsx`

- Converter para async
- Importar `getDevelopments` de actions
- Chamar `await getDevelopments()`
- Passar dados reais para DevelopmentsTable
- Alterar breadcrumb de "Banco de Dados" para "Patrimônio"

#### 5.2 Criar `app/banco-dados/empreendimentos/[id]/page.tsx`

Layout similar à página de créditos `creditos/[id]/page.tsx`:

**Cards superiores (4 colunas)**:
1. Código (Building2 icon)
2. Nome (Home icon)
3. Cidade (MapPin icon)
4. Total de Unidades (Grid3x3 icon)

**Card de informações**:
- Tipo
- Endereço completo
- Participação
- Valor de referência
- Status (Badge)
- Observações

**Card de unidades** (se houver tabela development_units):
- Lista de unidades com código, tipo, área, status, valor

---

### ETAPA 6: Rota de Visualização

Estrutura de pastas:
```
app/banco-dados/empreendimentos/
  ├── page.tsx (lista)
  └── [id]/
      └── page.tsx (detalhes)
```

---

## 🔧 Ordem de Execução para o Dev

### Passo 1: Banco de Dados (usar MCP Supabase)
1. Executar migration para criar tabela `developments`
2. Executar migration para criar função `generate_development_code()`
3. Executar migration para criar trigger `update_developments_updated_at`
4. Executar migration para criar políticas RLS
5. (Opcional) Executar migration para criar tabela `development_units` com trigger e RLS

### Passo 2: Actions
1. Criar `app/actions/developments.ts` com 8 funções
2. Implementar validações de permissões
3. Integrar com RPC `generate_development_code()`

### Passo 3: Types
1. Atualizar interface `Development` em `lib/types.ts`
2. Adicionar interface `DevelopmentUnit` se necessário

### Passo 4: Modais
1. Reescrever `development-create-modal.tsx` com campos completos
2. Criar `edit-development-dialog.tsx`
3. Criar `delete-development-dialog.tsx`

### Passo 5: Tabela
1. Atualizar `developments-table.tsx`:
   - Adicionar imports (useState, useEffect, createClient, useRouter, useToast, modals, actions)
   - Buscar userRole via profiles
   - Adicionar estados dos modais
   - Remover dropdown, adicionar botões diretos (Eye, Edit, Trash2)
   - Implementar handleEdit e handleDelete
   - Adicionar 3 modais no JSX

### Passo 6: Páginas
1. Atualizar `empreendimentos/page.tsx` (async, getDevelopments, breadcrumb)
2. Criar `empreendimentos/[id]/page.tsx` (layout com cards)

### Passo 7: Testes
1. Testar criação de empreendimento (admin/editor)
2. Testar edição (admin/editor)
3. Testar exclusão (admin only)
4. Verificar visualizador não pode editar/excluir
5. Verificar código auto-gerado (EMP-0001, EMP-0002...)
6. Testar página de detalhes

---

## 📝 Campos Importantes

### Obrigatórios:
- code (auto-gerado)
- name
- type
- city
- state

### Opcionais mas Recomendados:
- Endereço completo (street, number, neighborhood, zip_code)
- participation_percentage
- total_units
- reference_value
- notes

---

## 🎨 Padrão de UI

Seguir exatamente o mesmo padrão implementado em:
- **Créditos**: Botões ghost diretos, permissões via profiles, códigos auto-gerados
- **Veículos**: Mesma estrutura de modais e ações
- **Imóveis**: Layout de cards e formatação

---

## ⚠️ Pontos de Atenção

1. **Permissions**: Sempre buscar role de `profiles`, nunca de `users`
2. **Códigos**: Usar RPC `generate_development_code()`, não gerar no client
3. **Validações**: Tipo deve ser um dos 5 valores válidos
4. **Estado**: Campo `state` deve ter exatamente 2 caracteres (UF)
5. **Cache**: Sempre chamar `router.refresh()` após mutações
6. **Breadcrumb**: Usar "Patrimônio" ao invés de "Banco de Dados"

---

## 📊 Estimativa de Complexidade

- **Banco de Dados**: ~30 minutos (5 migrations)
- **Actions**: ~45 minutos (8 funções)
- **Types**: ~5 minutos
- **Modais**: ~60 minutos (3 componentes)
- **Tabela**: ~30 minutos
- **Páginas**: ~40 minutos (2 páginas)
- **Testes**: ~20 minutos

**Total estimado**: ~3h30min

---

## ✅ Checklist Final

- [ ] Tabela developments criada
- [ ] Função generate_development_code() criada
- [ ] Trigger e RLS configurados
- [ ] (Opcional) Tabela development_units criada
- [ ] app/actions/developments.ts completo com 8 funções
- [ ] Interface Development atualizada em types.ts
- [ ] development-create-modal.tsx reescrito
- [ ] edit-development-dialog.tsx criado
- [ ] delete-development-dialog.tsx criado
- [ ] developments-table.tsx atualizado (botões diretos)
- [ ] empreendimentos/page.tsx async com dados reais
- [ ] empreendimentos/[id]/page.tsx criado
- [ ] Testes de CRUD funcionando
- [ ] Permissões validadas (admin/editor/visualizador)

---

**FIM DO ROTEIRO**
