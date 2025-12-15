# ROTEIRO DE IMPLEMENTAÇÃO - CONTAS A RECEBER

## 📋 ANÁLISE PRELIMINAR

### Estado Atual do Módulo Financeiro

#### ✅ Já Implementado (Caixa)
- **Tabelas**: `bank_accounts`, `cash_transactions`, `cash_closings`
- **Actions**: `app/actions/cash.ts` com CRUD completo
- **Componentes**: Filtros, tabelas, modais, cards de resumo
- **Funcionalidades**:
  - Criação/edição/exclusão de contas bancárias (admin)
  - Lançamento de transações de entrada/saída
  - Cálculo automático de saldos via triggers
  - Filtros avançados (data, tipo, vínculo, forma, centro de custo)
  - Página "Caixa do Dia" com resumo diário
  - Sistema de fechamento de caixa com validação
  - Permissões por role (admin, editor, visualizador)
  - RLS policies implementadas

#### 🔴 Não Implementado (Contas a Receber)
- **Status**: Usando dados mock (`mockAccountsReceivable`)
- **Tabelas**: Não existem no banco de dados
- **Actions**: Não implementadas
- **Integração**: Zero integração com banco real

### Estrutura de Dados Mock Atual

```typescript
export interface AccountReceivable {
  id: string
  code: string                    // CR-0923.2 (gerado automaticamente)
  contractId?: string             // Referência opcional ao contrato
  description: string             // Descrição da conta
  counterparty: string            // Nome da contraparte
  value: number                   // Valor a receber
  dueDate: Date                   // Data de vencimento
  status: "em_aberto" | "vencido" | "quitado"
  installment?: {                 // Parcela (opcional)
    current: number
    total: number
  }
  vinculo: string                 // Ex: Contratos, Vendas, Aluguéis
  centroCusto: string            // Ex: Vendas, Veículos, Imóveis
  dataRegistro: Date             // Data de criação
  createdAt: Date
  updatedAt: Date
}
```

---

## 🎯 ETAPA 1: ESTRUTURA DO BANCO DE DADOS

### 1.1 - Criar Tabela `accounts_receivable`

**Arquivo**: `supabase/migrations/[timestamp]_create_accounts_receivable_table.sql`

```sql
-- =====================================================
-- CONTAS A RECEBER (ACCOUNTS RECEIVABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  
  -- Relacionamentos opcionais
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Informações da conta
  description TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  
  -- Valores financeiros
  original_value NUMERIC(12,2) NOT NULL CHECK (original_value > 0),
  remaining_value NUMERIC(12,2) NOT NULL CHECK (remaining_value >= 0),
  
  -- Datas
  due_date DATE NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Status e categorização
  status TEXT NOT NULL DEFAULT 'em_aberto' 
    CHECK (status IN ('em_aberto', 'vencido', 'parcialmente_pago', 'quitado', 'cancelado')),
  vinculo TEXT NOT NULL,
  centro_custo TEXT NOT NULL,
  
  -- Parcelamento (opcional)
  installment_current INTEGER CHECK (installment_current > 0),
  installment_total INTEGER CHECK (installment_total > 0),
  
  -- Observações e metadados
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints adicionais
  CONSTRAINT valid_installment CHECK (
    (installment_current IS NULL AND installment_total IS NULL) OR
    (installment_current IS NOT NULL AND installment_total IS NOT NULL AND 
     installment_current <= installment_total)
  ),
  CONSTRAINT valid_remaining_value CHECK (remaining_value <= original_value)
);

-- Comentários
COMMENT ON TABLE public.accounts_receivable IS 'Contas a receber do sistema financeiro';
COMMENT ON COLUMN public.accounts_receivable.code IS 'Código único gerado automaticamente (ex: CR-0923.2)';
COMMENT ON COLUMN public.accounts_receivable.contract_id IS 'Referência ao contrato que gerou a conta (opcional)';
COMMENT ON COLUMN public.accounts_receivable.original_value IS 'Valor original da conta a receber';
COMMENT ON COLUMN public.accounts_receivable.remaining_value IS 'Valor restante a receber (após pagamentos parciais)';
COMMENT ON COLUMN public.accounts_receivable.status IS 'Status: em_aberto, vencido, parcialmente_pago, quitado, cancelado';
COMMENT ON COLUMN public.accounts_receivable.vinculo IS 'Categoria/vínculo (Contratos, Vendas, Aluguéis, etc)';
COMMENT ON COLUMN public.accounts_receivable.centro_custo IS 'Centro de custo (Vendas, Veículos, Imóveis, etc)';
```

### 1.2 - Criar Índices

```sql
-- Índices para performance
CREATE INDEX idx_accounts_receivable_due_date ON public.accounts_receivable(due_date);
CREATE INDEX idx_accounts_receivable_status ON public.accounts_receivable(status);
CREATE INDEX idx_accounts_receivable_contract_id ON public.accounts_receivable(contract_id);
CREATE INDEX idx_accounts_receivable_counterparty ON public.accounts_receivable(counterparty);
CREATE INDEX idx_accounts_receivable_vinculo ON public.accounts_receivable(vinculo);
CREATE INDEX idx_accounts_receivable_centro_custo ON public.accounts_receivable(centro_custo);
CREATE INDEX idx_accounts_receivable_registration_date ON public.accounts_receivable(registration_date);

-- Índice composto para busca por status + vencimento
CREATE INDEX idx_accounts_receivable_status_due_date 
  ON public.accounts_receivable(status, due_date);
```

### 1.3 - Criar Tabela de Recebimentos Parciais

```sql
-- =====================================================
-- RECEBIMENTOS (RECEIVABLE PAYMENTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.receivable_payments (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  account_receivable_id UUID NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  cash_transaction_id UUID REFERENCES public.cash_transactions(id) ON DELETE SET NULL,
  
  -- Dados do recebimento
  payment_date DATE NOT NULL,
  payment_value NUMERIC(12,2) NOT NULL CHECK (payment_value > 0),
  payment_method TEXT NOT NULL,
  
  -- Metadados
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.receivable_payments IS 'Registro de recebimentos (total ou parcial) de contas a receber';
COMMENT ON COLUMN public.receivable_payments.cash_transaction_id IS 'Referência à transação no caixa que efetivou o recebimento';
COMMENT ON COLUMN public.receivable_payments.payment_method IS 'Forma de pagamento (PIX, Dinheiro, Transferência, etc)';

-- Índices
CREATE INDEX idx_receivable_payments_account_id ON public.receivable_payments(account_receivable_id);
CREATE INDEX idx_receivable_payments_payment_date ON public.receivable_payments(payment_date);
CREATE INDEX idx_receivable_payments_cash_transaction_id ON public.receivable_payments(cash_transaction_id);
```

### 1.4 - Criar Função para Gerar Código Automático

```sql
-- =====================================================
-- FUNÇÃO: Gerar código de conta a receber
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_receivable_code()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Extrair últimos 2 dígitos do ano atual
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Buscar o próximo número sequencial do ano
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(
        SPLIT_PART(code, '.', 1),
        '[^0-9]',
        '',
        'g'
      ) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.accounts_receivable
  WHERE code LIKE 'CR-' || year_suffix || '%';
  
  -- Formatar código: CR-AANNNN (ex: CR-240001)
  new_code := 'CR-' || year_suffix || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_receivable_code() IS 
  'Gera código sequencial para contas a receber no formato CR-AANNNN (ex: CR-240001)';
```

### 1.5 - Criar Trigger para Código Automático

```sql
-- =====================================================
-- TRIGGER: Auto-gerar código na inserção
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_receivable_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_receivable_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_receivable_code
  BEFORE INSERT ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.set_receivable_code();
```

### 1.6 - Criar Trigger para Atualizar Status por Vencimento

```sql
-- =====================================================
-- TRIGGER: Atualizar status para "vencido"
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_receivable_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a conta está em aberto ou parcialmente paga e venceu
  IF NEW.status IN ('em_aberto', 'parcialmente_pago') AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'vencido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receivable_overdue_status
  BEFORE INSERT OR UPDATE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receivable_overdue_status();
```

### 1.7 - Criar Trigger para Atualizar Valor Restante

```sql
-- =====================================================
-- TRIGGER: Atualizar remaining_value após pagamento
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_receivable_remaining_value()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  receivable_record RECORD;
BEGIN
  -- Buscar informações da conta a receber
  SELECT original_value INTO receivable_record
  FROM public.accounts_receivable
  WHERE id = NEW.account_receivable_id;
  
  -- Calcular total pago até agora
  SELECT COALESCE(SUM(payment_value), 0)
  INTO total_paid
  FROM public.receivable_payments
  WHERE account_receivable_id = NEW.account_receivable_id;
  
  -- Atualizar remaining_value e status
  UPDATE public.accounts_receivable
  SET 
    remaining_value = receivable_record.original_value - total_paid,
    status = CASE
      WHEN (receivable_record.original_value - total_paid) = 0 THEN 'quitado'
      WHEN (receivable_record.original_value - total_paid) < receivable_record.original_value THEN 'parcialmente_pago'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.account_receivable_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receivable_remaining_value
  AFTER INSERT ON public.receivable_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receivable_remaining_value();
```

### 1.8 - Criar Trigger para updated_at

```sql
-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_accounts_receivable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_accounts_receivable_updated_at
  BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accounts_receivable_updated_at();
```

### 1.9 - Criar RLS Policies

```sql
-- =====================================================
-- RLS POLICIES: Contas a Receber
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Todos autenticados podem ver
CREATE POLICY "Usuários autenticados podem visualizar contas a receber"
  ON public.accounts_receivable
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: INSERT - Admin e Editor podem criar
CREATE POLICY "Admin e Editor podem criar contas a receber"
  ON public.accounts_receivable
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Policy: UPDATE - Admin e Editor podem editar
CREATE POLICY "Admin e Editor podem editar contas a receber"
  ON public.accounts_receivable
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

-- Policy: DELETE - Apenas Admin pode excluir
CREATE POLICY "Apenas Admin pode excluir contas a receber"
  ON public.accounts_receivable
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para receivable_payments (mesma lógica)
CREATE POLICY "Usuários autenticados podem visualizar recebimentos"
  ON public.receivable_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin e Editor podem registrar recebimentos"
  ON public.receivable_payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Apenas Admin pode excluir recebimentos"
  ON public.receivable_payments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 1.10 - Criar Função para Buscar Dias com Recebimentos

```sql
-- =====================================================
-- FUNÇÃO: Buscar dias com recebimentos
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_receivable_payment_days(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
  payment_date DATE,
  total_received NUMERIC,
  payment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.payment_date,
    SUM(rp.payment_value) AS total_received,
    COUNT(*) AS payment_count
  FROM public.receivable_payments rp
  WHERE 
    (p_date_from IS NULL OR rp.payment_date >= p_date_from)
    AND (p_date_to IS NULL OR rp.payment_date <= p_date_to)
  GROUP BY rp.payment_date
  ORDER BY rp.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_receivable_payment_days IS 
  'Retorna resumo de recebimentos agrupados por data';
```

---

## 🎯 ETAPA 2: IMPLEMENTAR SERVER ACTIONS

### 2.1 - Criar Arquivo de Actions

**Arquivo**: `app/actions/receivables.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const accountReceivableSchema = z.object({
  contract_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  counterparty: z.string().min(3, 'Contraparte deve ter no mínimo 3 caracteres'),
  original_value: z.number().positive('Valor deve ser maior que zero'),
  due_date: z.string().or(z.date()),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  installment_current: z.number().int().positive().optional().nullable(),
  installment_total: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const receivablePaymentSchema = z.object({
  account_receivable_id: z.string().uuid(),
  payment_date: z.string().or(z.date()),
  payment_value: z.number().positive('Valor deve ser maior que zero'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  bank_account_id: z.string().uuid('Conta bancária é obrigatória'),
  notes: z.string().optional().nullable(),
})

// =====================================================
// Types
// =====================================================

export type AccountReceivableFormData = z.infer<typeof accountReceivableSchema>
export type ReceivablePaymentFormData = z.infer<typeof receivablePaymentSchema>

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
// ACCOUNTS RECEIVABLE - CRUD
// =====================================================

export async function createAccountReceivable(
  data: AccountReceivableFormData
): Promise<ActionResult> {
  try {
    const validatedData = accountReceivableSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para criar contas a receber' }
    }

    const { data: account, error } = await supabase
      .from('accounts_receivable')
      .insert({
        ...validatedData,
        remaining_value: validatedData.original_value,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conta a receber:', error)
      return { success: false, error: 'Erro ao criar conta a receber' }
    }

    revalidatePath('/financeiro/contas-receber')
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

export async function getAccountsReceivable(filters?: {
  dateFrom?: string
  dateTo?: string
  status?: string
  vinculo?: string
  centro_custo?: string
  centroCusto?: string
  code?: string
  description?: string
  valueMin?: number
  valueMax?: number
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    let query = supabase
      .from('accounts_receivable')
      .select(`
        *,
        contract:contracts(id, code),
        person:people(id, full_name),
        company:companies(id, trade_name)
      `)
      .not('status', 'eq', 'cancelado')
      .order('due_date', { ascending: true })

    // Aplicar filtros
    if (filters?.dateFrom) {
      query = query.gte('due_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('due_date', filters.dateTo)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.vinculo) {
      query = query.eq('vinculo', filters.vinculo)
    }
    if (filters?.centro_custo || filters?.centroCusto) {
      query = query.eq('centro_custo', filters.centro_custo || filters.centroCusto)
    }
    if (filters?.code) {
      query = query.ilike('code', `%${filters.code}%`)
    }
    if (filters?.description) {
      query = query.ilike('description', `%${filters.description}%`)
    }
    if (filters?.valueMin) {
      query = query.gte('remaining_value', filters.valueMin)
    }
    if (filters?.valueMax) {
      query = query.lte('remaining_value', filters.valueMax)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar contas a receber:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function updateAccountReceivable(
  id: string,
  data: Partial<AccountReceivableFormData>
): Promise<ActionResult> {
  try {
    const validatedData = accountReceivableSchema.partial().parse(data)
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
      return { success: false, error: 'Sem permissão para editar contas' }
    }

    const { data: account, error } = await supabase
      .from('accounts_receivable')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta' }
    }

    revalidatePath('/financeiro/contas-receber')
    return { success: true, data: account }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao atualizar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function deleteAccountReceivable(id: string): Promise<ActionResult> {
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
      return { success: false, error: 'Apenas administradores podem excluir contas' }
    }

    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir conta:', error)
      return { success: false, error: 'Erro ao excluir conta' }
    }

    revalidatePath('/financeiro/contas-receber')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// RECEIVABLE PAYMENTS - Recebimentos
// =====================================================

export async function createReceivablePayment(
  data: ReceivablePaymentFormData
): Promise<ActionResult> {
  try {
    const validatedData = receivablePaymentSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para registrar recebimentos' }
    }

    // Buscar conta a receber
    const { data: receivable } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', validatedData.account_receivable_id)
      .single()

    if (!receivable) {
      return { success: false, error: 'Conta a receber não encontrada' }
    }

    // Validar valor do pagamento
    if (validatedData.payment_value > receivable.remaining_value) {
      return { 
        success: false, 
        error: `Valor de pagamento (${validatedData.payment_value}) não pode ser maior que o valor restante (${receivable.remaining_value})` 
      }
    }

    // 1. Criar transação no caixa (entrada)
    const { data: cashTransaction, error: cashError } = await supabase
      .from('cash_transactions')
      .insert({
        bank_account_id: validatedData.bank_account_id,
        transaction_date: validatedData.payment_date,
        type: 'entrada',
        description: `Recebimento: ${receivable.description}`,
        vinculo: receivable.vinculo,
        forma: 'Caixa',
        centro_custo: receivable.centro_custo,
        value: validatedData.payment_value,
        account_receivable_id: validatedData.account_receivable_id,
        notes: validatedData.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (cashError) {
      console.error('Erro ao criar transação no caixa:', cashError)
      return { success: false, error: 'Erro ao registrar entrada no caixa' }
    }

    // 2. Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('receivable_payments')
      .insert({
        account_receivable_id: validatedData.account_receivable_id,
        cash_transaction_id: cashTransaction.id,
        payment_date: validatedData.payment_date,
        payment_value: validatedData.payment_value,
        payment_method: validatedData.payment_method,
        notes: validatedData.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError)
      // Reverter transação do caixa
      await supabase.from('cash_transactions').delete().eq('id', cashTransaction.id)
      return { success: false, error: 'Erro ao registrar pagamento' }
    }

    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/caixa')
    return { success: true, data: payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao registrar recebimento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getReceivablePayments(
  accountReceivableId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('receivable_payments')
      .select(`
        *,
        cash_transaction:cash_transactions(*)
      `)
      .eq('account_receivable_id', accountReceivableId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return { success: false, error: 'Erro ao carregar histórico de pagamentos' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
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

// =====================================================
// RESUMOS E ESTATÍSTICAS
// =====================================================

export async function getReceivablesSummary(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const today = new Date().toISOString().split('T')[0]

    // Total em aberto
    const { data: openData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

    const totalOpen = openData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencidas
    const { data: overdueData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .eq('status', 'vencido')

    const totalOverdue = overdueData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencendo hoje
    const { data: todayData } = await supabase
      .from('accounts_receivable')
      .select('remaining_value')
      .eq('due_date', today)
      .in('status', ['em_aberto', 'parcialmente_pago'])

    const totalDueToday = todayData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    return {
      success: true,
      data: {
        totalOpen,
        totalOverdue,
        totalDueToday,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar resumo:', error)
    return { success: false, error: 'Erro ao carregar resumo' }
  }
}
```

---

## 🎯 ETAPA 3: ATUALIZAR TIPOS

### 3.1 - Atualizar `lib/types.ts`

```typescript
// Adicionar/atualizar interface
export interface AccountReceivable {
  id: string
  code: string
  contract_id?: string | null
  person_id?: string | null
  company_id?: string | null
  description: string
  counterparty: string
  original_value: number
  remaining_value: number
  due_date: string | Date
  registration_date: string | Date
  status: 'em_aberto' | 'vencido' | 'parcialmente_pago' | 'quitado' | 'cancelado'
  vinculo: string
  centro_custo: string
  installment_current?: number | null
  installment_total?: number | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at: string
  // Relacionamentos (quando incluídos no select)
  contract?: {
    id: string
    code: string
  }
  person?: {
    id: string
    full_name: string
  }
  company?: {
    id: string
    trade_name: string
  }
}

export interface ReceivablePayment {
  id: string
  account_receivable_id: string
  cash_transaction_id?: string | null
  payment_date: string | Date
  payment_value: number
  payment_method: string
  notes?: string | null
  created_by?: string
  created_at: string
}
```

---

## 🎯 ETAPA 4: IMPLEMENTAR COMPONENTES

### 4.1 - Atualizar Página Principal

**Arquivo**: `app/financeiro/contas-receber/page.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { AccountsReceivableTable } from "@/components/financial/accounts-receivable-table"
import { ReceivablesSummaryCards } from "@/components/financial/receivables-summary-cards"
import {
  AccountsReceivableFilters,
  type AccountsReceivableFilters as FiltersType,
} from "@/components/financial/accounts-receivable-filters"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAccountsReceivable, getUserPermissions } from "@/app/actions/receivables"
import { useToast } from "@/hooks/use-toast"
import type { AccountReceivable } from "@/lib/types"

export default function AccountsReceivablePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState<FiltersType>({})
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    checkPermissions()
  }, [])

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const checkPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setCanEdit(result.data.canEdit)
    }
  }

  const loadData = async () => {
    setIsLoading(true)

    // Converter filtros de Date para string
    const apiFilters: any = {}
    if (filters.dateFrom) {
      apiFilters.dateFrom = filters.dateFrom.toISOString().split('T')[0]
    }
    if (filters.dateTo) {
      apiFilters.dateTo = filters.dateTo.toISOString().split('T')[0]
    }
    if (filters.code) apiFilters.code = filters.code
    if (filters.vinculo) apiFilters.vinculo = filters.vinculo
    if (filters.centroCusto) apiFilters.centroCusto = filters.centroCusto
    if (filters.description) apiFilters.description = filters.description
    if (filters.valueMin) apiFilters.valueMin = filters.valueMin
    if (filters.valueMax) apiFilters.valueMax = filters.valueMax

    const result = await getAccountsReceivable(apiFilters)

    if (result.success) {
      setAccounts(result.data || [])
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setRefreshKey(prev => prev + 1)
  }

  const handleApplyFilters = () => {
    loadData()
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Contas a Receber" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground">Gerencie valores a receber de contratos e operações</p>
          </div>
          <Button 
            onClick={() => router.push("/financeiro/contas-receber/lote")} 
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Recebimento em lote
          </Button>
        </div>

        {!isLoading && <ReceivablesSummaryCards accounts={accounts} />}

        <AccountsReceivableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <AccountsReceivableTable 
          accounts={accounts}
          onSuccess={handleSuccess}
        />
      </div>
    </MainLayout>
  )
}
```

### 4.2 - Atualizar Tabela

**Arquivo**: `components/financial/accounts-receivable-table.tsx`

Adicionar props `onSuccess` e integrar com as actions reais. Substituir todos os `console.log` por chamadas às actions:

```typescript
// Adicionar props
interface AccountsReceivableTableProps {
  accounts: AccountReceivable[]
  onSuccess: () => void  // ← NOVO
}

// No handleReceive:
const handleReceive = async (data: { receiveDate: string; paymentMethod: string; bankAccountId: string }) => {
  if (!selectedAccount) return
  
  const result = await createReceivablePayment({
    account_receivable_id: selectedAccount.id,
    payment_date: data.receiveDate,
    payment_value: selectedAccount.remaining_value,
    payment_method: data.paymentMethod,
    bank_account_id: data.bankAccountId,
  })

  if (result.success) {
    toast({ title: "Sucesso", description: "Recebimento registrado com sucesso" })
    setShowReceiveDialog(false)
    onSuccess()
  } else {
    toast({ title: "Erro", description: result.error, variant: "destructive" })
  }
}

// Similares para handlePartialReceive, handleEdit, handleDelete, handleAddAccount
```

### 4.3 - Criar Componentes de Diálogo

Atualizar/criar os seguintes componentes para integrar com as actions:

- `components/financial/account-form-dialog.tsx` - Formulário de criação (chamar `createAccountReceivable`)
- `components/financial/receive-dialog.tsx` - Dialog de recebimento total
- `components/financial/partial-receive-dialog.tsx` - Dialog de recebimento parcial
- `components/financial/edit-account-dialog.tsx` - Dialog de edição
- `components/financial/delete-account-dialog.tsx` - Confirmação de exclusão

Todos devem usar as actions de `app/actions/receivables.ts`

### 4.4 - Atualizar Cards de Resumo

**Arquivo**: `components/financial/receivables-summary-cards.tsx`

Ajustar para usar `remaining_value` em vez de `value`:

```typescript
const totalOpen = accounts
  .filter((a) => ['em_aberto', 'vencido', 'parcialmente_pago'].includes(a.status))
  .reduce((sum, a) => sum + a.remaining_value, 0)

const totalOverdue = accounts
  .filter((a) => a.status === 'vencido')
  .reduce((sum, a) => sum + a.remaining_value, 0)

const totalDueToday = accounts
  .filter((a) => 
    a.status !== 'quitado' && 
    new Date(a.due_date).toDateString() === new Date().toDateString()
  )
  .reduce((sum, a) => sum + a.remaining_value, 0)
```

---

## 🎯 ETAPA 5: IMPLEMENTAR RECEBIMENTO EM LOTE

### 5.1 - Criar Action de Lote

Adicionar em `app/actions/receivables.ts`:

```typescript
export async function createBatchReceivablePayments(
  payments: Array<{
    account_receivable_id: string
    payment_value: number
  }>,
  commonData: {
    payment_date: string
    payment_method: string
    bank_account_id: string
  }
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Processar cada recebimento
    const results = []
    for (const payment of payments) {
      const result = await createReceivablePayment({
        ...commonData,
        ...payment,
      })
      results.push(result)
    }

    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} recebimento(s) falharam`,
        data: { failures },
      }
    }

    revalidatePath('/financeiro/contas-receber')
    revalidatePath('/financeiro/caixa')
    return { 
      success: true, 
      data: { processed: results.length }
    }
  } catch (error) {
    console.error('Erro no recebimento em lote:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}
```

### 5.2 - Atualizar Página de Lote

**Arquivo**: `app/financeiro/contas-receber/lote/page.tsx`

Integrar com `createBatchReceivablePayments` em vez de usar mock.

---

## 🎯 ETAPA 6: TESTES E VALIDAÇÃO

### 6.1 - Checklist de Testes

#### Banco de Dados
- [ ] Migration aplicada com sucesso
- [ ] Tabelas criadas (`accounts_receivable`, `receivable_payments`)
- [ ] Triggers funcionando (código automático, status vencido, remaining_value)
- [ ] RLS policies ativas e funcionais
- [ ] Índices criados para performance

#### CRUD de Contas a Receber
- [ ] Criar conta a receber (admin/editor)
- [ ] Listar contas com filtros
- [ ] Editar conta (admin/editor)
- [ ] Excluir conta (admin apenas)
- [ ] Visualizador NÃO consegue criar/editar/excluir

#### Recebimentos
- [ ] Recebimento total baixa a conta
- [ ] Recebimento parcial atualiza `remaining_value`
- [ ] Múltiplos recebimentos parciais somam corretamente
- [ ] Transação no caixa é criada automaticamente
- [ ] Histórico de pagamentos visível

#### Filtros
- [ ] Filtro por data de vencimento
- [ ] Filtro por código
- [ ] Filtro por vínculo
- [ ] Filtro por centro de custo
- [ ] Filtro por descrição
- [ ] Filtro por valor (min/max)
- [ ] Limpar filtros restaura lista completa

#### Recebimento em Lote
- [ ] Selecionar múltiplas contas
- [ ] Processar recebimentos em batch
- [ ] Validação de valores
- [ ] Feedback de sucesso/erro

#### UI/UX
- [ ] Loading states funcionando
- [ ] Toasts de sucesso/erro
- [ ] Badges de status corretos (em_aberto, vencido, quitado)
- [ ] Formatação de valores (R$)
- [ ] Formatação de datas (dd/MM/yyyy)
- [ ] Ícones e cores intuitivos

---

## 📦 ETAPA 7: COMANDOS DE EXECUÇÃO

### 7.1 - Aplicar Migration

```bash
# Certifique-se de estar conectado ao Supabase
npx supabase db push
```

### 7.2 - Rodar Aplicação

```bash
# Limpar cache e rodar dev
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm run dev
```

### 7.3 - Verificar Logs (se necessário)

Usar o MCP do Supabase:
```
mcp_supabase_get_logs({ service: "api" })
```

---

## 📚 RESUMO DA ARQUITETURA

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTAS A RECEBER                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Criação da Conta                                         │
│     - Formulário → createAccountReceivable()                 │
│     - Trigger: Gera código (CR-240001)                       │
│     - Trigger: Define status (em_aberto/vencido)             │
│     - remaining_value = original_value                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Recebimento (Total ou Parcial)                           │
│     - Modal → createReceivablePayment()                      │
│     ├─ Cria cash_transaction (entrada no caixa)              │
│     ├─ Cria receivable_payment                               │
│     └─ Trigger: Atualiza remaining_value e status            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Status Automático                                         │
│     - remaining_value = 0 → status = 'quitado'               │
│     - remaining_value < original → status = 'parcialmente'   │
│     - due_date < today → status = 'vencido'                  │
└─────────────────────────────────────────────────────────────┘
```

### Segurança (RLS)

| Ação   | Admin | Editor | Visualizador |
|--------|-------|--------|--------------|
| SELECT | ✅     | ✅      | ✅            |
| INSERT | ✅     | ✅      | ❌            |
| UPDATE | ✅     | ✅      | ❌            |
| DELETE | ✅     | ❌      | ❌            |

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Aplicar Migration** (Etapa 1) ✅
2. **Criar Actions** (Etapa 2) ✅
3. **Atualizar Types** (Etapa 3) ✅
4. **Atualizar Página Principal** (Etapa 4.1) ✅
5. **Atualizar Tabela** (Etapa 4.2) ✅
6. **Criar/Atualizar Dialogs** (Etapa 4.3) ✅
7. **Atualizar Cards** (Etapa 4.4) ✅
8. **Implementar Lote** (Etapa 5) - OPCIONAL
9. **Testar** (Etapa 6) ✅

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Sincronização com Caixa**: Todo recebimento cria automaticamente uma transação de entrada no módulo Caixa
2. **Código Automático**: O código é gerado no formato `CR-AANNNN` (ex: CR-240001) pelo trigger
3. **Status Vencido**: Atualizado automaticamente quando `due_date < CURRENT_DATE`
4. **Valor Restante**: Calculado automaticamente pelo trigger após cada pagamento
5. **Permissões**: Respeitar roles (admin > editor > visualizador)
6. **Validações**: Usar Zod schemas para validar dados no backend
7. **Revalidação**: Sempre usar `revalidatePath()` após mutations

---

## 🔗 REFERÊNCIAS

- **Módulo Caixa**: `app/actions/cash.ts` (usar como base)
- **Componentes**: `components/financial/` (usar como referência)
- **Types**: `lib/types.ts`
- **Mock Data**: `lib/mock-data.ts` (para referência de estrutura)

---

**Desenvolvido por**: QA Agent  
**Data**: 27/11/2025  
**Versão**: 1.0
