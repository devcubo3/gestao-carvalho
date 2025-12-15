# 🏦 ROTEIRO DE IMPLEMENTAÇÃO - MÓDULO CAIXA

**Data:** 27 de novembro de 2025  
**Módulo:** Financeiro - Caixa  
**Estimativa Total:** 2-3 dias

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Análise do Código Atual](#análise-do-código-atual)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Implementação Backend](#implementação-backend)
5. [Implementação Frontend](#implementação-frontend)
6. [Testes e Validações](#testes-e-validações)

---

## 📊 VISÃO GERAL

### Objetivo
Implementar sistema completo de controle de Caixa com:
- ✅ Registro de movimentações (entradas/saídas)
- ✅ Múltiplas contas bancárias
- ✅ Filtros avançados
- ✅ Caixa do dia (visualização diária)
- ✅ Fechamento de caixa
- ✅ Relatórios e dashboards

### Páginas a Implementar
1. **Caixa Principal** (`/financeiro/caixa`)
   - Lista de movimentações
   - Filtros
   - Resumo financeiro
   - Novo lançamento

2. **Caixa do Dia** (`/financeiro/caixa/dia`)
   - Visualização detalhada por data
   - Saldos iniciais e finais
   - Movimentações separadas (entradas/saídas)
   - Saldos por conta

3. **Fechamento de Caixa** (`/financeiro/caixa/fechamento`)
   - Fechamento diário
   - Conferência de saldos
   - Validação de valores

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### Status Atual
- ✅ **UI Completa:** Todas as páginas e componentes criados
- ✅ **TypeScript Types:** `CashTransaction`, `BankAccount` definidos
- ✅ **Mock Data:** 50+ transações e 5 contas bancárias
- ❌ **Banco de Dados:** Tabelas não existem
- ❌ **Backend Actions:** Não implementado
- ❌ **Integração:** Usando apenas mock data

### Componentes Existentes
```
app/financeiro/caixa/
  ├── page.tsx (página principal)
  ├── dia/page.tsx (caixa do dia)
  └── fechamento/page.tsx (fechamento)

components/financial/
  ├── cash-transactions-table.tsx (tabela)
  ├── cash-summary-cards.tsx (cards resumo)
  └── cash-filters.tsx (filtros)
```

### Types Definidos
```typescript
interface CashTransaction {
  id: string
  date: Date
  type: "entrada" | "saida"
  description: string
  vinculo: string
  forma: "Caixa" | "Permuta"
  centroCusto: string
  value: number
  createdAt: Date
}

interface BankAccount {
  id: string
  name: string
  type: "banco" | "especie" | "poupanca" | "investimento"
  balance: number
  code?: string
}
```

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### FASE 1: Criação das Tabelas (Dia 1 - Manhã)

#### 1.1 Tabela: `bank_accounts` (Contas Bancárias)

**Arquivo:** `supabase/migrations/[timestamp]_create_bank_accounts_table.sql`

```sql
-- =====================================================
-- TABELA: bank_accounts
-- Descrição: Contas bancárias e caixas do sistema
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banco', 'especie', 'poupanca', 'investimento')),
  code TEXT, -- código bancário opcional (ex: 001 - Banco do Brasil)
  balance NUMERIC NOT NULL DEFAULT 0,
  initial_balance NUMERIC NOT NULL DEFAULT 0, -- saldo inicial (para histórico)
  status TEXT NOT NULL DEFAULT 'ativo' 
    CHECK (status IN ('ativo', 'inativo')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.bank_accounts IS 'Contas bancárias e caixas do sistema financeiro';
COMMENT ON COLUMN public.bank_accounts.name IS 'Nome da conta (ex: Sicoob Geraldo, Caixa Espécie)';
COMMENT ON COLUMN public.bank_accounts.type IS 'Tipo: banco, especie, poupanca, investimento';
COMMENT ON COLUMN public.bank_accounts.code IS 'Código bancário opcional';
COMMENT ON COLUMN public.bank_accounts.balance IS 'Saldo atual da conta';
COMMENT ON COLUMN public.bank_accounts.initial_balance IS 'Saldo inicial para referência';

-- Índices
CREATE INDEX idx_bank_accounts_status ON public.bank_accounts(status);
CREATE INDEX idx_bank_accounts_type ON public.bank_accounts(type);
CREATE INDEX idx_bank_accounts_created_at ON public.bank_accounts(created_at DESC);
```

#### 1.2 Tabela: `cash_transactions` (Movimentações de Caixa)

**Arquivo:** `supabase/migrations/[timestamp]_create_cash_transactions_table.sql`

```sql
-- =====================================================
-- TABELA: cash_transactions
-- Descrição: Movimentações financeiras efetivadas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  description TEXT NOT NULL,
  vinculo TEXT NOT NULL, -- categoria/vínculo
  forma TEXT NOT NULL CHECK (forma IN ('Caixa', 'Permuta')),
  centro_custo TEXT NOT NULL,
  value NUMERIC NOT NULL CHECK (value > 0),
  balance_after NUMERIC NOT NULL, -- saldo após a transação
  
  -- Vínculos opcionais com outros módulos
  account_receivable_id UUID, -- REFERENCES public.accounts_receivable(id)
  account_payable_id UUID, -- REFERENCES public.accounts_payable(id)
  contract_id UUID, -- REFERENCES public.contracts(id)
  
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'efetivado'
    CHECK (status IN ('efetivado', 'cancelado', 'estornado')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.cash_transactions IS 'Movimentações financeiras efetivadas no caixa';
COMMENT ON COLUMN public.cash_transactions.bank_account_id IS 'Conta bancária da movimentação';
COMMENT ON COLUMN public.cash_transactions.transaction_date IS 'Data da transação';
COMMENT ON COLUMN public.cash_transactions.type IS 'Tipo: entrada ou saida';
COMMENT ON COLUMN public.cash_transactions.vinculo IS 'Categoria/vínculo (Contratos, Vendas, etc)';
COMMENT ON COLUMN public.cash_transactions.forma IS 'Forma: Caixa (dinheiro) ou Permuta';
COMMENT ON COLUMN public.cash_transactions.centro_custo IS 'Centro de custo';
COMMENT ON COLUMN public.cash_transactions.balance_after IS 'Saldo da conta após a transação';

-- Índices para performance
CREATE INDEX idx_cash_transactions_date ON public.cash_transactions(transaction_date DESC);
CREATE INDEX idx_cash_transactions_account ON public.cash_transactions(bank_account_id);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX idx_cash_transactions_status ON public.cash_transactions(status);
CREATE INDEX idx_cash_transactions_vinculo ON public.cash_transactions(vinculo);
CREATE INDEX idx_cash_transactions_centro_custo ON public.cash_transactions(centro_custo);
CREATE INDEX idx_cash_transactions_created_at ON public.cash_transactions(created_at DESC);

-- Índice composto para queries comuns
CREATE INDEX idx_cash_transactions_account_date ON public.cash_transactions(bank_account_id, transaction_date DESC);
```

#### 1.3 Tabela: `cash_closings` (Fechamentos de Caixa)

**Arquivo:** `supabase/migrations/[timestamp]_create_cash_closings_table.sql`

```sql
-- =====================================================
-- TABELA: cash_closings
-- Descrição: Registro de fechamentos diários de caixa
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date DATE NOT NULL UNIQUE,
  total_entries NUMERIC NOT NULL DEFAULT 0,
  total_exits NUMERIC NOT NULL DEFAULT 0,
  net_balance NUMERIC NOT NULL DEFAULT 0,
  
  -- Saldos informados no fechamento
  bank_accounts_data JSONB NOT NULL, -- {account_id: {informed_balance, calculated_balance}}
  
  status TEXT NOT NULL DEFAULT 'fechado'
    CHECK (status IN ('aberto', 'fechado', 'conferido')),
  
  discrepancy NUMERIC DEFAULT 0, -- diferença entre informado e calculado
  notes TEXT,
  
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.cash_closings IS 'Registro de fechamentos diários de caixa';
COMMENT ON COLUMN public.cash_closings.closing_date IS 'Data do fechamento';
COMMENT ON COLUMN public.cash_closings.bank_accounts_data IS 'JSON com dados das contas no fechamento';
COMMENT ON COLUMN public.cash_closings.discrepancy IS 'Diferença entre valores informados e calculados';

-- Índices
CREATE INDEX idx_cash_closings_date ON public.cash_closings(closing_date DESC);
CREATE INDEX idx_cash_closings_status ON public.cash_closings(status);
CREATE INDEX idx_cash_closings_closed_by ON public.cash_closings(closed_by);
```

---

### FASE 2: Triggers e Funções (Dia 1 - Tarde)

#### 2.1 Trigger: Updated At

**Arquivo:** `supabase/migrations/[timestamp]_create_cash_triggers.sql`

```sql
-- =====================================================
-- TRIGGER: updated_at para bank_accounts
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_accounts_updated_at();

-- =====================================================
-- TRIGGER: updated_at para cash_transactions
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_cash_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_transactions_updated_at();

-- =====================================================
-- TRIGGER: Atualizar saldo da conta ao inserir transação
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo da conta
  IF NEW.type = 'entrada' THEN
    UPDATE public.bank_accounts 
    SET balance = balance + NEW.value 
    WHERE id = NEW.bank_account_id;
  ELSE
    UPDATE public.bank_accounts 
    SET balance = balance - NEW.value 
    WHERE id = NEW.bank_account_id;
  END IF;
  
  -- Registrar saldo após transação
  SELECT balance INTO NEW.balance_after 
  FROM public.bank_accounts 
  WHERE id = NEW.bank_account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_account_balance
  BEFORE INSERT ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_balance();

-- =====================================================
-- TRIGGER: Reverter saldo ao deletar transação
-- =====================================================

CREATE OR REPLACE FUNCTION public.revert_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverter saldo da conta
  IF OLD.type = 'entrada' THEN
    UPDATE public.bank_accounts 
    SET balance = balance - OLD.value 
    WHERE id = OLD.bank_account_id;
  ELSE
    UPDATE public.bank_accounts 
    SET balance = balance + OLD.value 
    WHERE id = OLD.bank_account_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revert_bank_account_balance
  AFTER DELETE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_bank_account_balance();
```

#### 2.2 Função: Obter Saldo em Data Específica

**Arquivo:** `supabase/migrations/[timestamp]_create_cash_functions.sql`

```sql
-- =====================================================
-- FUNÇÃO: Calcular saldo de conta em data específica
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_account_balance_at_date(
  p_account_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_initial_balance NUMERIC;
  v_movements NUMERIC;
BEGIN
  -- Obter saldo inicial da conta
  SELECT initial_balance INTO v_initial_balance
  FROM public.bank_accounts
  WHERE id = p_account_id;
  
  -- Calcular movimentações até a data
  SELECT COALESCE(
    SUM(CASE WHEN type = 'entrada' THEN value ELSE -value END),
    0
  ) INTO v_movements
  FROM public.cash_transactions
  WHERE bank_account_id = p_account_id
    AND transaction_date <= p_date
    AND status = 'efetivado';
  
  RETURN v_initial_balance + v_movements;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Obter dias com caixa em aberto (sem fechamento)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_open_cash_days()
RETURNS TABLE(date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT transaction_date AS date
  FROM public.cash_transactions
  WHERE transaction_date NOT IN (
    SELECT closing_date 
    FROM public.cash_closings
  )
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Validar fechamento de caixa
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_cash_closing(
  p_closing_date DATE,
  p_accounts_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_account_id UUID;
  v_informed_balance NUMERIC;
  v_calculated_balance NUMERIC;
  v_discrepancy NUMERIC := 0;
BEGIN
  -- Iterar sobre cada conta no JSON
  FOR v_account_id, v_informed_balance IN 
    SELECT key::UUID, (value->>'informed_balance')::NUMERIC
    FROM jsonb_each(p_accounts_data)
  LOOP
    -- Calcular saldo real
    v_calculated_balance := public.get_account_balance_at_date(
      v_account_id, 
      p_closing_date
    );
    
    -- Adicionar ao resultado
    v_result := v_result || jsonb_build_object(
      v_account_id::TEXT,
      jsonb_build_object(
        'informed_balance', v_informed_balance,
        'calculated_balance', v_calculated_balance,
        'difference', ABS(v_informed_balance - v_calculated_balance)
      )
    );
    
    v_discrepancy := v_discrepancy + ABS(v_informed_balance - v_calculated_balance);
  END LOOP;
  
  RETURN jsonb_build_object(
    'accounts', v_result,
    'total_discrepancy', v_discrepancy,
    'is_valid', v_discrepancy < 0.01
  );
END;
$$ LANGUAGE plpgsql;
```

---

### FASE 3: RLS Policies (Dia 1 - Tarde)

**Arquivo:** `supabase/migrations/[timestamp]_create_cash_rls_policies.sql`

```sql
-- =====================================================
-- RLS POLICIES: bank_accounts
-- =====================================================

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados podem visualizar contas ativas
CREATE POLICY "Users can view active bank accounts"
  ON public.bank_accounts
  FOR SELECT
  TO authenticated
  USING (status = 'ativo');

-- Policy: Admins e editores podem criar contas
CREATE POLICY "Admins and editors can create bank accounts"
  ON public.bank_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Policy: Admins e editores podem atualizar contas
CREATE POLICY "Admins and editors can update bank accounts"
  ON public.bank_accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Policy: Apenas admins podem deletar contas (soft delete)
CREATE POLICY "Admins can delete bank accounts"
  ON public.bank_accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: cash_transactions
-- =====================================================

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados podem visualizar transações efetivadas
CREATE POLICY "Users can view cash transactions"
  ON public.cash_transactions
  FOR SELECT
  TO authenticated
  USING (status IN ('efetivado', 'cancelado'));

-- Policy: Admins e editores podem criar transações
CREATE POLICY "Admins and editors can create transactions"
  ON public.cash_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Policy: Admins e editores podem atualizar suas próprias transações
CREATE POLICY "Users can update own transactions"
  ON public.cash_transactions
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Policy: Apenas admins podem deletar transações
CREATE POLICY "Admins can delete transactions"
  ON public.cash_transactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: cash_closings
-- =====================================================

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários podem visualizar fechamentos
CREATE POLICY "Users can view cash closings"
  ON public.cash_closings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins e editores podem criar fechamentos
CREATE POLICY "Admins and editors can create closings"
  ON public.cash_closings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Policy: Apenas admins podem atualizar fechamentos
CREATE POLICY "Admins can update closings"
  ON public.cash_closings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

---

## 💻 IMPLEMENTAÇÃO BACKEND

### FASE 4: Server Actions (Dia 2 - Manhã)

**Arquivo:** `app/actions/cash.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const bankAccountSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  type: z.enum(['banco', 'especie', 'poupanca', 'investimento']),
  code: z.string().optional(),
  initial_balance: z.number().default(0),
  notes: z.string().optional(),
})

const cashTransactionSchema = z.object({
  bank_account_id: z.string().uuid('ID de conta inválido'),
  transaction_date: z.string().or(z.date()),
  type: z.enum(['entrada', 'saida']),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  forma: z.enum(['Caixa', 'Permuta']),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  value: z.number().positive('Valor deve ser maior que zero'),
  notes: z.string().optional(),
})

const cashClosingSchema = z.object({
  closing_date: z.string().or(z.date()),
  bank_accounts_data: z.record(z.object({
    informed_balance: z.number(),
  })),
  notes: z.string().optional(),
})

// =====================================================
// Types
// =====================================================

export type BankAccountFormData = z.infer<typeof bankAccountSchema>
export type CashTransactionFormData = z.infer<typeof cashTransactionSchema>
export type CashClosingFormData = z.infer<typeof cashClosingSchema>

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// =====================================================
// Helper: Formatar erros Zod
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
// BANK ACCOUNTS
// =====================================================

export async function createBankAccount(data: BankAccountFormData): Promise<ActionResult> {
  try {
    const validatedData = bankAccountSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para criar contas' }
    }

    const { data: account, error } = await supabase
      .from('bank_accounts')
      .insert({
        ...validatedData,
        balance: validatedData.initial_balance,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conta:', error)
      return { success: false, error: 'Erro ao criar conta bancária' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: account }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getBankAccounts(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('status', 'ativo')
      .order('name')

    if (error) {
      console.error('Erro ao buscar contas:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// CASH TRANSACTIONS
// =====================================================

export async function createCashTransaction(data: CashTransactionFormData): Promise<ActionResult> {
  try {
    const validatedData = cashTransactionSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para criar transações' }
    }

    const { data: transaction, error } = await supabase
      .from('cash_transactions')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar transação:', error)
      return { success: false, error: 'Erro ao registrar movimentação' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: transaction }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar transação:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getCashTransactions(filters?: {
  dateFrom?: string
  dateTo?: string
  type?: string
  bank_account_id?: string
  vinculo?: string
  forma?: string
  centro_custo?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    let query = supabase
      .from('cash_transactions')
      .select(`
        *,
        bank_account:bank_accounts(id, name, type)
      `)
      .eq('status', 'efetivado')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.dateFrom) {
      query = query.gte('transaction_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('transaction_date', filters.dateTo)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.bank_account_id) {
      query = query.eq('bank_account_id', filters.bank_account_id)
    }
    if (filters?.vinculo) {
      query = query.eq('vinculo', filters.vinculo)
    }
    if (filters?.forma) {
      query = query.eq('forma', filters.forma)
    }
    if (filters?.centro_custo) {
      query = query.eq('centro_custo', filters.centro_custo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return { success: false, error: 'Erro ao carregar movimentações' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function deleteCashTransaction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem excluir transações' }
    }

    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir transação:', error)
      return { success: false, error: 'Erro ao excluir movimentação' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// CASH CLOSINGS
// =====================================================

export async function createCashClosing(data: CashClosingFormData): Promise<ActionResult> {
  try {
    const validatedData = cashClosingSchema.parse(data)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Validar fechamento via função do banco
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_cash_closing', {
        p_closing_date: validatedData.closing_date,
        p_accounts_data: validatedData.bank_accounts_data,
      })

    if (validationError) {
      console.error('Erro na validação:', validationError)
      return { success: false, error: 'Erro ao validar fechamento' }
    }

    if (!validation.is_valid) {
      return {
        success: false,
        error: `Diferença de ${validation.total_discrepancy} nos valores`,
        data: validation,
      }
    }

    // Calcular totais
    const { data: transactions } = await supabase
      .from('cash_transactions')
      .select('type, value')
      .eq('transaction_date', validatedData.closing_date)
      .eq('status', 'efetivado')

    const total_entries = transactions
      ?.filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0

    const total_exits = transactions
      ?.filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + Number(t.value), 0) || 0

    // Criar fechamento
    const { data: closing, error } = await supabase
      .from('cash_closings')
      .insert({
        closing_date: validatedData.closing_date,
        total_entries,
        total_exits,
        net_balance: total_entries - total_exits,
        bank_accounts_data: validation.accounts,
        discrepancy: validation.total_discrepancy,
        notes: validatedData.notes,
        closed_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar fechamento:', error)
      return { success: false, error: 'Erro ao registrar fechamento' }
    }

    revalidatePath('/financeiro/caixa')
    return { success: true, data: closing }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar fechamento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getOpenCashDays(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_open_cash_days')

    if (error) {
      console.error('Erro ao buscar dias em aberto:', error)
      return { success: false, error: 'Erro ao carregar dias' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar dias:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// HELPER: Obter permissões do usuário
// =====================================================

export async function getUserPermissions(): Promise<ActionResult<{
  role: string
  canEdit: boolean
  canDelete: boolean
}>> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Perfil não encontrado' }
    }

    const role = profile.role
    const canEdit = ['admin', 'editor'].includes(role)
    const canDelete = role === 'admin'

    return {
      success: true,
      data: { role, canEdit, canDelete },
    }
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return { success: false, error: 'Erro ao verificar permissões' }
  }
}
```

---

## 🎨 IMPLEMENTAÇÃO FRONTEND

### FASE 5: Atualizar Types (Dia 2 - Tarde)

**Arquivo:** `lib/types.ts`

Atualizar interfaces existentes:

```typescript
// Atualizar CashTransaction
export interface CashTransaction {
  id: string
  bank_account_id: string
  bank_account?: {
    id: string
    name: string
    type: string
  }
  transaction_date: string | Date
  type: 'entrada' | 'saida'
  description: string
  vinculo: string
  forma: 'Caixa' | 'Permuta'
  centro_custo: string
  value: number
  balance_after: number
  account_receivable_id?: string
  account_payable_id?: string
  contract_id?: string
  notes?: string
  status: 'efetivado' | 'cancelado' | 'estornado'
  created_by?: string
  created_at: string
  updated_at: string
}

// Atualizar BankAccount
export interface BankAccount {
  id: string
  name: string
  type: 'banco' | 'especie' | 'poupanca' | 'investimento'
  code?: string
  balance: number
  initial_balance: number
  status: 'ativo' | 'inativo'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// Adicionar CashClosing
export interface CashClosing {
  id: string
  closing_date: string | Date
  total_entries: number
  total_exits: number
  net_balance: number
  bank_accounts_data: Record<string, {
    informed_balance: number
    calculated_balance: number
    difference: number
  }>
  status: 'aberto' | 'fechado' | 'conferido'
  discrepancy: number
  notes?: string
  closed_by?: string
  closed_at: string
  created_at: string
}
```

---

### FASE 6: Criar Modais (Dia 3 - Manhã)

#### 6.1 Modal: Novo Lançamento

**Arquivo:** `components/financial/create-transaction-modal.tsx`

```typescript
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { createCashTransaction } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import type { BankAccount } from "@/lib/types"

interface CreateTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: BankAccount[]
  onSuccess: () => void
}

export function CreateTransactionModal({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: CreateTransactionModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    bank_account_id: '',
    transaction_date: new Date(),
    type: 'entrada' as 'entrada' | 'saida',
    description: '',
    vinculo: '',
    forma: 'Caixa' as 'Caixa' | 'Permuta',
    centro_custo: '',
    value: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createCashTransaction({
      ...formData,
      value: Number(formData.value),
      transaction_date: formData.transaction_date.toISOString().split('T')[0],
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })
      onOpenChange(false)
      onSuccess()
      // Reset form
      setFormData({
        bank_account_id: '',
        transaction_date: new Date(),
        type: 'entrada',
        description: '',
        vinculo: '',
        forma: 'Caixa',
        centro_custo: '',
        value: '',
        notes: '',
      })
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao registrar movimentação",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Conta */}
            <div className="space-y-2">
              <Label htmlFor="bank_account_id">Conta *</Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.transaction_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.transaction_date, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.transaction_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, transaction_date: date })
                        setDateOpen(false)
                      }
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>

            {/* Vínculo */}
            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select
                value={formData.vinculo}
                onValueChange={(value) => setFormData({ ...formData, vinculo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contratos">Contratos</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Aluguéis">Aluguéis</SelectItem>
                  <SelectItem value="Comissões">Comissões</SelectItem>
                  <SelectItem value="Despesas">Despesas</SelectItem>
                  <SelectItem value="Investimentos">Investimentos</SelectItem>
                  <SelectItem value="Impostos">Impostos</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Forma */}
            <div className="space-y-2">
              <Label htmlFor="forma">Forma *</Label>
              <Select
                value={formData.forma}
                onValueChange={(value: 'Caixa' | 'Permuta') => setFormData({ ...formData, forma: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="Permuta">Permuta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="centro_custo">Centro de Custo *</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(value) => setFormData({ ...formData, centro_custo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Veículos">Veículos</SelectItem>
                  <SelectItem value="Imóveis">Imóveis</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="Obras">Obras</SelectItem>
                  <SelectItem value="Predial">Predial</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Descrição da movimentação"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### FASE 7: Integrar Páginas (Dia 3 - Tarde)

#### 7.1 Atualizar Página Principal do Caixa

**Arquivo:** `app/financeiro/caixa/page.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { CashTransactionsTable } from "@/components/financial/cash-transactions-table"
import { CashSummaryCards } from "@/components/financial/cash-summary-cards"
import { CashFilters, type CashFilters as CashFiltersType } from "@/components/financial/cash-filters"
import { CreateTransactionModal } from "@/components/financial/create-transaction-modal"
import { Button } from "@/components/ui/button"
import { Calculator, Calendar } from "lucide-react"
import Link from "next/link"
import { getCashTransactions, getBankAccounts } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import type { CashTransaction, BankAccount } from "@/lib/types"

export default function CashPage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<CashFiltersType>({})
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    setIsLoading(true)
    
    const [transactionsResult, accountsResult] = await Promise.all([
      getCashTransactions(filters),
      getBankAccounts(),
    ])

    if (transactionsResult.success) {
      setTransactions(transactionsResult.data || [])
    } else {
      toast({
        title: "Erro",
        description: transactionsResult.error,
        variant: "destructive",
      })
    }

    if (accountsResult.success) {
      setAccounts(accountsResult.data || [])
    }

    setIsLoading(false)
  }

  const handleFiltersChange = (newFilters: CashFiltersType) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    loadData()
  }

  const handleClearFilters = () => {
    setFilters({})
    setRefreshKey(prev => prev + 1)
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Caixa" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Caixa</h1>
            <p className="text-muted-foreground">Controle de movimentações financeiras efetivadas</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/financeiro/caixa/dia">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Caixa do Dia
              </Button>
            </Link>
            <Link href="/financeiro/caixa/fechamento">
              <Button className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Fechamento de Caixa
              </Button>
            </Link>
          </div>
        </div>

        {!isLoading && <CashSummaryCards transactions={transactions} />}

        <CashFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <CashTransactionsTable 
          transactions={transactions}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      </div>

      <CreateTransactionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        accounts={accounts}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
```

---

## ✅ TESTES E VALIDAÇÕES

### Checklist de Testes

#### Banco de Dados
- [ ] Todas as 3 tabelas criadas
- [ ] RLS policies aplicadas
- [ ] Triggers funcionando
- [ ] Funções executando corretamente
- [ ] Índices criados

#### Backend
- [ ] createBankAccount() funcional
- [ ] getBankAccounts() retornando dados
- [ ] createCashTransaction() registrando
- [ ] getCashTransactions() com filtros
- [ ] deleteCashTransaction() excluindo
- [ ] Permissões validadas corretamente

#### Frontend
- [ ] Página principal carrega dados reais
- [ ] Modal de nova transação funciona
- [ ] Filtros aplicam corretamente
- [ ] Caixa do dia exibe dados reais
- [ ] Fechamento valida saldos
- [ ] Real-time atualiza após ações

#### Validações
- [ ] CPF/CNPJ validados
- [ ] Valores numéricos positivos
- [ ] Datas válidas
- [ ] Campos obrigatórios preenchidos
- [ ] Saldos calculados corretamente
- [ ] Triggers atualizando balances

---

## 📈 PRÓXIMOS PASSOS

### Melhorias Futuras
1. **Conciliação bancária**
   - Importar extratos
   - Conciliar automaticamente
   - Marcar diferenças

2. **Relatórios avançados**
   - Fluxo de caixa previsto vs realizado
   - Gráficos de movimentações
   - Export para Excel/PDF

3. **Integrações**
   - Vincular com Contas a Receber/Pagar
   - Gerar movimentações automáticas de contratos
   - Alertas de baixo saldo

4. **Auditoria**
   - Log de todas as alterações
   - Histórico de estornos
   - Rastreabilidade completa

---

## 🎯 RESUMO DA ESTIMATIVA

| Fase | Atividade | Tempo |
|------|-----------|-------|
| 1 | Criar 3 tabelas (migrations) | 2h |
| 2 | Triggers e funções | 3h |
| 3 | RLS policies | 1h |
| 4 | Backend actions (cash.ts) | 4h |
| 5 | Atualizar types | 1h |
| 6 | Criar modais | 3h |
| 7 | Integrar páginas | 3h |
| 8 | Testes e ajustes | 3h |
| **TOTAL** | | **20h (2-3 dias)** |

---

## 📝 COMANDOS ÚTEIS

### Criar Migrations
```bash
# Via Supabase CLI
supabase migration new create_bank_accounts_table
supabase migration new create_cash_transactions_table
supabase migration new create_cash_closings_table
supabase migration new create_cash_triggers
supabase migration new create_cash_functions
supabase migration new create_cash_rls_policies

# Aplicar migrations (via MCP)
# Usar o MCP do Supabase para executar os SQLs
```

### Testar Backend
```typescript
// No console do navegador ou arquivo de teste
const result = await getBankAccounts()
console.log(result)

const transaction = await createCashTransaction({
  bank_account_id: 'uuid-da-conta',
  transaction_date: new Date(),
  type: 'entrada',
  description: 'Teste',
  vinculo: 'Contratos',
  forma: 'Caixa',
  centro_custo: 'Vendas',
  value: 1000,
})
console.log(transaction)
```

---

**FIM DO ROTEIRO**

**Próxima Ação:** Começar pela Fase 1 - Criar as migrations das tabelas usando MCP Supabase.
