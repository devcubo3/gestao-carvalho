# Roteiro de Implementação - Módulo de Créditos (Cartas de Crédito)

## 📋 Análise Realizada

### Situação Atual
- ✅ Páginas frontend existentes usando dados mock
- ✅ Interface `Credit` definida em `lib/types.ts`
- ✅ Componentes de UI prontos (table, modals)
- ❌ **Tabela `credits` NÃO existe no banco de dados Supabase**
- ❌ Server actions não implementadas
- ❌ Sem integração com banco de dados real

### Estrutura Atual dos Componentes
```
app/banco-dados/creditos/
├── page.tsx                     # Página principal (usa mockCredits)
└── [id]/
    └── page.tsx                 # Página de detalhes (usa mockCredits)

components/database/
├── credits-table.tsx            # Tabela com dropdown (precisa atualizar)
└── credit-create-modal.tsx      # Modal de criação (usa mock)
```

### Interface Credit Atual
```typescript
export interface Credit {
  id: string
  code: string              // CRD-0001
  creditor: string          // Nome do cedente
  debtor: string            // Nome do devedor
  origin: string            // Origem/descrição
  nominalValue: number      // Valor nominal
  saldoGRA: number          // Saldo GRA atual
  interestRate?: string     // Taxa de juros (opcional)
  startDate: Date           // Data de início
  dueDate: Date            // Data de vencimento
  status: AssetStatus       // "disponivel" | "comprometido" | "vendido"
  notes?: string           // Observações
  createdAt: Date
  updatedAt: Date
}
```

---

## 🗄️ ETAPA 1: Criar Estrutura do Banco de Dados

### 1.1 Criar Tabela `credits`

**Estrutura da Tabela:**
- `id` (uuid, PK) - ID único
- `code` (text, UNIQUE, NOT NULL) - Código único (ex: CRD-0001)
- `creditor_id` (uuid, FK → people.id ou companies.id) - Cedente
- `creditor_type` (text) - Tipo: 'pessoa' ou 'empresa'
- `debtor_id` (uuid, FK → people.id ou companies.id, NULLABLE) - Devedor (opcional)
- `debtor_type` (text, NULLABLE) - Tipo: 'pessoa' ou 'empresa'
- `origin` (text, NOT NULL) - Origem/descrição da carta de crédito
- `nominal_value` (numeric, NOT NULL, CHECK > 0) - Valor nominal inicial
- `current_balance` (numeric, NOT NULL, DEFAULT = nominal_value) - Saldo atual disponível
- `interest_rate` (text, NULLABLE) - Taxa de juros (ex: "1,5% a.m.")
- `start_date` (date, NOT NULL) - Data de início/emissão
- `due_date` (date, NULLABLE) - Data de vencimento
- `status` (text, NOT NULL, DEFAULT 'disponivel') - Status: disponivel, comprometido, vendido
- `notes` (text, NULLABLE) - Observações
- `created_by` (uuid, FK → auth.users.id)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Constraints:**
```sql
CHECK (status IN ('disponivel', 'comprometido', 'vendido'))
CHECK (creditor_type IN ('pessoa', 'empresa'))
CHECK (debtor_type IS NULL OR debtor_type IN ('pessoa', 'empresa'))
CHECK (nominal_value > 0)
CHECK (current_balance >= 0)
CHECK (current_balance <= nominal_value)
```

**SQL de Criação:**
```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  creditor_id UUID NOT NULL,
  creditor_type TEXT NOT NULL CHECK (creditor_type IN ('pessoa', 'empresa')),
  debtor_id UUID,
  debtor_type TEXT CHECK (debtor_type IS NULL OR debtor_type IN ('pessoa', 'empresa')),
  origin TEXT NOT NULL,
  nominal_value NUMERIC NOT NULL CHECK (nominal_value > 0),
  current_balance NUMERIC NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  interest_rate TEXT,
  start_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credits IS 'Cadastro de cartas de crédito do patrimônio';
COMMENT ON COLUMN credits.code IS 'Código único da carta de crédito (ex: CRD-0001)';
COMMENT ON COLUMN credits.creditor_id IS 'ID do cedente (pessoa ou empresa)';
COMMENT ON COLUMN credits.creditor_type IS 'Tipo do cedente: pessoa ou empresa';
COMMENT ON COLUMN credits.debtor_id IS 'ID do devedor (pessoa ou empresa) - opcional';
COMMENT ON COLUMN credits.current_balance IS 'Saldo disponível atual (após deduções)';
COMMENT ON COLUMN credits.nominal_value IS 'Valor nominal inicial da carta de crédito';
```

### 1.2 Criar Função de Geração de Código

```sql
CREATE OR REPLACE FUNCTION generate_credit_code()
RETURNS TEXT AS $$
DECLARE
  next_number INT;
  new_code TEXT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(code FROM 5) AS INT)), 
    0
  ) + 1 INTO next_number
  FROM credits
  WHERE code ~ '^CRD-[0-9]+$';
  
  new_code := 'CRD-' || LPAD(next_number::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 Criar Trigger para `updated_at`

```sql
CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 Configurar RLS (Row Level Security)

```sql
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver
CREATE POLICY "Usuários autenticados podem visualizar créditos"
  ON credits FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Admin e Editor podem criar
CREATE POLICY "Admin e Editor podem criar créditos"
  ON credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- UPDATE: Admin e Editor podem atualizar
CREATE POLICY "Admin e Editor podem atualizar créditos"
  ON credits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- DELETE: Apenas Admin pode excluir
CREATE POLICY "Apenas Admin pode excluir créditos"
  ON credits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 1.5 Criar Tabela de Movimentações (Opcional - Histórico)

```sql
CREATE TABLE credit_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inicial', 'deducao', 'estorno', 'ajuste')),
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credit_movements IS 'Histórico de movimentações das cartas de crédito';
COMMENT ON COLUMN credit_movements.movement_type IS 'Tipo: inicial, deducao, estorno, ajuste';
COMMENT ON COLUMN credit_movements.balance_after IS 'Saldo da carta após a movimentação';

-- RLS para credit_movements
ALTER TABLE credit_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar movimentações"
  ON credit_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin e Editor podem criar movimentações"
  ON credit_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
```

---

## 🔧 ETAPA 2: Criar Server Actions

### 2.1 Criar `app/actions/credits.ts`

**Estrutura das Funções:**

```typescript
// Tipos
type CreditInput = {
  creditor_id: string
  creditor_type: 'pessoa' | 'empresa'
  debtor_id?: string
  debtor_type?: 'pessoa' | 'empresa'
  origin: string
  nominal_value: number
  current_balance?: number  // Opcional, default = nominal_value
  interest_rate?: string
  start_date: string        // ISO date
  due_date?: string         // ISO date
  notes?: string
}

// 1. GET - Listar todos os créditos
export async function getCredits()

// 2. GET - Buscar crédito por ID
export async function getCreditById(id: string)

// 3. POST - Criar novo crédito
export async function createCredit(input: CreditInput)
// - Validar permissões (admin/editor)
// - Gerar código automaticamente via generate_credit_code()
// - Validar creditor_id e debtor_id existem
// - Inserir na tabela credits
// - Criar movimentação inicial em credit_movements
// - revalidatePath('/banco-dados/creditos')

// 4. PUT - Atualizar crédito
export async function updateCredit(id: string, input: Partial<CreditInput>)
// - Validar permissões (admin/editor)
// - Atualizar dados
// - revalidatePath

// 5. DELETE - Excluir crédito
export async function deleteCredit(id: string)
// - Validar permissões (apenas admin)
// - Excluir registro
// - revalidatePath

// 6. PATCH - Atualizar status
export async function updateCreditStatus(id: string, status: string)

// 7. POST - Adicionar movimentação (dedução de saldo)
export async function addCreditMovement(creditId: string, data: {
  movement_type: 'deducao' | 'estorno' | 'ajuste'
  description: string
  value: number
})
// - Buscar crédito atual
// - Calcular novo saldo
// - Atualizar current_balance
// - Inserir em credit_movements

// 8. GET - Buscar movimentações de um crédito
export async function getCreditMovements(creditId: string)

// 9. SEARCH - Buscar com filtros
export async function searchCredits(filters: {
  status?: string
  creditor_id?: string
  search?: string
})
```

**Detalhes de Implementação:**

- Usar `createClient` do Supabase server
- Verificar autenticação em todas as funções
- Verificar role em create/update/delete
- Buscar nomes de creditor/debtor via JOIN ou query separada
- Retornar sempre `{ success: boolean, data?: any, error?: string }`

---

## 🎨 ETAPA 3: Atualizar Interface TypeScript

### 3.1 Atualizar `lib/types.ts`

**Substituir interface Credit:**

```typescript
export interface Credit {
  id: string
  code: string
  creditor_id: string
  creditor_type: 'pessoa' | 'empresa'
  creditor_name?: string      // Populado via join/query
  debtor_id?: string
  debtor_type?: 'pessoa' | 'empresa'
  debtor_name?: string        // Populado via join/query
  origin: string
  nominal_value: number
  current_balance: number     // Alterado de saldoGRA
  interest_rate?: string
  start_date: string          // ISO date string
  due_date?: string
  status: 'disponivel' | 'comprometido' | 'vendido'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreditMovement {
  id: string
  credit_id: string
  movement_type: 'inicial' | 'deducao' | 'estorno' | 'ajuste'
  description: string
  value: number
  balance_after: number
  movement_date: string
  created_by?: string
  created_at: string
}
```

---

## 🖥️ ETAPA 4: Atualizar Componentes Frontend

### 4.1 Atualizar `credit-create-modal.tsx`

**Mudanças:**
1. Remover import de `mockPeople` e `mockCompanies`
2. Importar `createCredit` de `@/app/actions/credits`
3. Buscar pessoas e empresas via query do Supabase (ou criar hook)
4. Adicionar campos obrigatórios:
   - `creditor_id` e `creditor_type` (select com pessoas/empresas)
   - `origin` (textarea)
   - `nominal_value` (number input)
   - `start_date` (date input)
   - Opcionais: `debtor_id`, `interest_rate`, `due_date`, `notes`
5. Remover campo `codigo` (será gerado automaticamente)
6. Integrar com `createCredit()` action
7. Usar `router.refresh()` após sucesso

**Estrutura do Formulário:**
```tsx
- Cedente * (Select com pessoas/empresas)
- Devedor (Select opcional)
- Descrição/Origem * (Textarea)
- Valor Nominal * (Number)
- Data de Início * (Date)
- Data de Vencimento (Date)
- Taxa de Juros (Text, ex: "1,5% a.m.")
- Observações (Textarea)
```

### 4.2 Criar `edit-credit-dialog.tsx`

**Baseado em:** `edit-vehicle-dialog.tsx`

**Características:**
- Mesmos campos do create (exceto código desabilitado)
- useEffect para popular com dados do crédito
- Integrar com `updateCredit()` action
- Props: `open`, `onOpenChange`, `credit`, `onSubmit`, `submitting`

### 4.3 Criar `delete-credit-dialog.tsx`

**Baseado em:** `delete-vehicle-dialog.tsx`

**Características:**
- Confirmação com texto "excluir"
- Exibir: código, cedente, valor nominal
- AlertTriangle icon
- Integrar com `deleteCredit()` action

### 4.4 Atualizar `credits-table.tsx`

**Mudanças:**
1. Remover dropdown menu
2. Adicionar botões diretos: Editar (ghost) e Excluir (ghost destructive)
3. Adicionar states:
   - `userRole` (buscar de profiles)
   - `isEditModalOpen`, `isDeleteModalOpen`
   - `selectedCredit`, `submitting`
4. Importar modais: `EditCreditDialog`, `DeleteCreditDialog`
5. Atualizar `handleAction` para abrir modais
6. Adicionar `handleEdit` e `handleDelete`
7. Controle de permissões:
   - `canEdit = userRole === 'admin' || userRole === 'editor'`
   - `canDelete = userRole === 'admin'`
8. Atualizar colunas:
   - Substituir `creditor` por `creditor_name`
   - Substituir `nominalValue` por `nominal_value`
   - Substituir `saldoGRA` por `current_balance`
9. Remover busca de nome via `getCedenteName` (já vem do server)
10. Adicionar três modais no JSX

**Coluna de Ações:**
```tsx
{
  key: "actions",
  label: "Ações",
  width: "w-[100px]",
  sortable: false,
  render: (credit) => (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleAction("edit", credit)}
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleAction("delete", credit)}
          className="text-destructive hover:text-destructive"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  ),
}
```

### 4.5 Atualizar `app/banco-dados/creditos/page.tsx`

**Mudanças:**
1. Converter para `async function`
2. Importar `getCredits` de `@/app/actions/credits`
3. Substituir `mockCredits` por `await getCredits()`
4. Tratar resultado: `const credits = result.success && result.data ? result.data : []`
5. Atualizar breadcrumb para "Patrimônio"

**Código:**
```tsx
import { MainLayout } from "@/components/main-layout"
import { CreditsTable } from "@/components/database/credits-table"
import { getCredits } from "@/app/actions/credits"

export default async function CreditsPage() {
  const result = await getCredits()
  const credits = result.success && result.data ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Créditos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créditos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro das Cartas de Crédito</p>
          </div>
        </div>

        <CreditsTable credits={credits} />
      </div>
    </MainLayout>
  )
}
```

### 4.6 Atualizar `app/banco-dados/creditos/[id]/page.tsx`

**Mudanças:**
1. Converter para `async function`
2. Importar `getCreditById` e `getCreditMovements`
3. Buscar dados reais do banco
4. Usar `notFound()` se não encontrar
5. Exibir movimentações reais se tabela `credit_movements` existir
6. Atualizar campos:
   - `credit.creditor` → `credit.creditor_name`
   - `credit.nominalValue` → `credit.nominal_value`
   - `credit.saldoGRA` → `credit.current_balance`

**Código:**
```tsx
export default async function CreditDetailsPage({ params }: CreditDetailsPageProps) {
  const result = await getCreditById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const credit = result.data
  const movementsResult = await getCreditMovements(params.id)
  const movements = movementsResult.success && movementsResult.data ? movementsResult.data : []

  // ... resto do componente
}
```

---

## 📝 ETAPA 5: Ordem de Implementação

### Checklist de Execução:

**1. Banco de Dados** (Usar MCP Supabase)
- [ ] Criar tabela `credits` com todos os campos
- [ ] Criar função `generate_credit_code()`
- [ ] Criar trigger `update_credits_updated_at`
- [ ] Configurar RLS com 4 policies
- [ ] (Opcional) Criar tabela `credit_movements`
- [ ] (Opcional) Configurar RLS para `credit_movements`

**2. Server Actions** (`app/actions/credits.ts`)
- [ ] Criar tipo `CreditInput`
- [ ] Implementar `getCredits()` com JOIN para nomes
- [ ] Implementar `getCreditById(id)`
- [ ] Implementar `createCredit(input)` com auto-código
- [ ] Implementar `updateCredit(id, input)`
- [ ] Implementar `deleteCredit(id)` (apenas admin)
- [ ] Implementar `updateCreditStatus(id, status)`
- [ ] (Opcional) `addCreditMovement()` e `getCreditMovements()`
- [ ] Implementar `searchCredits(filters)`

**3. Types** (`lib/types.ts`)
- [ ] Atualizar interface `Credit` (creditor_id, current_balance, etc)
- [ ] Adicionar interface `CreditMovement` (se usar histórico)

**4. Modal de Criação** (`credit-create-modal.tsx`)
- [ ] Buscar pessoas/empresas do Supabase
- [ ] Adicionar campo cedente (select com tipo)
- [ ] Adicionar campo devedor (opcional)
- [ ] Adicionar campo origem (textarea)
- [ ] Adicionar campo valor nominal
- [ ] Adicionar campo data início
- [ ] Adicionar campos opcionais (taxa, vencimento, observações)
- [ ] Remover campo código (auto-gerado)
- [ ] Integrar com `createCredit()` action
- [ ] Adicionar validações de formulário

**5. Modal de Edição** (criar `edit-credit-dialog.tsx`)
- [ ] Copiar estrutura de `edit-vehicle-dialog.tsx`
- [ ] Adaptar campos para crédito
- [ ] Código field disabled
- [ ] useEffect para popular dados
- [ ] Integrar com `updateCredit()` action

**6. Modal de Exclusão** (criar `delete-credit-dialog.tsx`)
- [ ] Copiar estrutura de `delete-vehicle-dialog.tsx`
- [ ] Mostrar código, cedente, valor
- [ ] Confirmação "excluir"
- [ ] Integrar com `deleteCredit()` action

**7. Tabela** (`credits-table.tsx`)
- [ ] Adicionar states: userRole, modals, selectedCredit
- [ ] Buscar userRole de profiles
- [ ] Importar modais e actions
- [ ] Atualizar handleAction para modais
- [ ] Criar handleEdit e handleDelete
- [ ] Substituir dropdown por botões diretos
- [ ] Atualizar colunas para novos campos
- [ ] Adicionar controle de permissões (canEdit, canDelete)
- [ ] Adicionar três modais no JSX

**8. Página Principal** (`creditos/page.tsx`)
- [ ] Converter para async
- [ ] Importar e usar `getCredits()`
- [ ] Atualizar breadcrumb para "Patrimônio"

**9. Página de Detalhes** (`creditos/[id]/page.tsx`)
- [ ] Converter para async
- [ ] Importar e usar `getCreditById()`
- [ ] Buscar movimentações (se implementado)
- [ ] Atualizar campos (creditor_name, nominal_value, current_balance)
- [ ] Usar `notFound()` se não encontrar

**10. Testes**
- [ ] Testar criação de crédito com admin/editor
- [ ] Testar edição com admin/editor
- [ ] Testar exclusão com admin
- [ ] Verificar visualizador não pode editar/excluir
- [ ] Testar geração automática de código
- [ ] Testar busca e filtros
- [ ] Testar página de detalhes
- [ ] Verificar validações de formulário

---

## 🎯 Padrões a Seguir

### Seguir Padrão de Veículos/Imóveis:
1. **Server Actions**: Mesmo padrão de retorno `{ success, data, error }`
2. **RLS**: Mesmas permissões (SELECT todos, INSERT/UPDATE admin+editor, DELETE admin)
3. **Modais**: Estrutura idêntica aos de veículos
4. **Tabela**: Botões ghost diretos, sem dropdown
5. **Código Auto**: Função SQL para gerar CRD-0001, CRD-0002...
6. **Triggers**: update_updated_at automático
7. **Breadcrumb**: "Patrimônio" ao invés de "Banco de Dados"

### Campos Obrigatórios vs Opcionais:
**Obrigatórios:**
- creditor_id, creditor_type
- origin
- nominal_value
- start_date

**Opcionais:**
- debtor_id, debtor_type
- interest_rate
- due_date
- notes
- current_balance (default = nominal_value)

---

## ⚠️ Observações Importantes

1. **Relacionamento com Pessoas/Empresas:**
   - `creditor_id` pode referenciar `people.id` OU `companies.id`
   - `creditor_type` define qual tabela consultar
   - Mesmo para `debtor_id`/`debtor_type`
   - No SELECT, usar CASE para buscar nome correto

2. **Saldo GRA (current_balance):**
   - Inicia igual ao `nominal_value`
   - Pode ser deduzido via movimentações
   - Nunca pode ser negativo
   - Nunca pode exceder `nominal_value`

3. **Histórico de Movimentações (Opcional):**
   - Se implementar `credit_movements`, criar movimentação inicial ao criar crédito
   - Tipos: inicial, deducao, estorno, ajuste
   - Guardar `balance_after` em cada movimentação

4. **Query para Buscar Nomes:**
```sql
SELECT 
  c.*,
  CASE 
    WHEN c.creditor_type = 'pessoa' THEN p.full_name
    WHEN c.creditor_type = 'empresa' THEN co.trade_name
  END as creditor_name,
  CASE 
    WHEN c.debtor_type = 'pessoa' THEN p2.full_name
    WHEN c.debtor_type = 'empresa' THEN co2.trade_name
  END as debtor_name
FROM credits c
LEFT JOIN people p ON c.creditor_id = p.id AND c.creditor_type = 'pessoa'
LEFT JOIN companies co ON c.creditor_id = co.id AND c.creditor_type = 'empresa'
LEFT JOIN people p2 ON c.debtor_id = p2.id AND c.debtor_type = 'pessoa'
LEFT JOIN companies co2 ON c.debtor_id = co2.id AND c.debtor_type = 'empresa'
ORDER BY c.created_at DESC
```

---

## ✅ Resultado Final Esperado

Após implementação completa:
- ✅ Tabela `credits` criada no Supabase
- ✅ CRUD completo funcionando (Create, Read, Update, Delete)
- ✅ Código auto-gerado (CRD-0001, CRD-0002...)
- ✅ Permissões corretas (admin/editor para edit, admin para delete)
- ✅ Modais funcionais com validações
- ✅ Tabela com botões ghost diretos
- ✅ Página de detalhes funcional
- ✅ Integração com pessoas e empresas
- ✅ (Opcional) Histórico de movimentações
- ✅ Sem uso de dados mock

---

## 📚 Referências

- **Padrão a seguir:** `app/actions/vehicles.ts`, `components/database/vehicles-table.tsx`
- **RLS similar a:** `properties`, `vehicles`
- **Relacionamento similar a:** `accounts_receivable` (person_id/company_id)
- **Modal de criação:** `vehicle-create-modal.tsx`
- **Modal de edição:** `edit-vehicle-dialog.tsx`
- **Modal de exclusão:** `delete-vehicle-dialog.tsx`
