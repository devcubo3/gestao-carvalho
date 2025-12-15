# ROTEIRO DE IMPLEMENTAÇÃO - CONTAS A PAGAR

## 📋 ANÁLISE PRELIMINAR

### Estado Atual do Módulo Financeiro

#### ✅ Já Implementado (Referências)
- **Caixa**: Sistema completo com transações, fechamentos e RLS
- **Contas a Receber**: Sistema completo com pagamentos, triggers e integração com caixa
- **Tabelas Base**: `bank_accounts`, `cash_transactions`, `people`, `companies`, `profiles`
- **Padrões estabelecidos**:
  - Server Actions com validação Zod
  - RLS policies por role (admin, editor, visualizador)
  - Triggers para códigos automáticos (formato: PREFIXO-AANNNN)
  - Triggers para atualização de valores e status
  - Integração automática com módulo Caixa

#### 🔴 Não Implementado (Contas a Pagar)
- **Status**: Usando dados mock (`mockAccountsPayable`)
- **Tabelas**: Não existem no banco de dados
- **Actions**: Não implementadas
- **Integração**: Zero integração com banco real

### Estrutura de Dados Mock Atual

```typescript
export interface AccountPayable {
  id: string
  code: string                    // CP-0541.1 (gerado automaticamente)
  contractId?: string             // Referência opcional ao contrato
  description: string             // Descrição da conta
  counterparty: string            // Nome da contraparte
  value: number                   // Valor a pagar
  dueDate: Date                   // Data de vencimento
  status: "em_aberto" | "vencido" | "pago"
  installment?: {                 // Parcela (opcional)
    current: number
    total: number
  }
  vinculo: string                 // Ex: Fornecedores, Comissões, Taxas
  centroCusto: string            // Ex: Vendas, Obras, Administrativo
  dataRegistro: Date             // Data de criação
  createdAt: Date
  updatedAt: Date
}
```

### Análise Comparativa: Contas a Receber vs Contas a Pagar

| Aspecto | Contas a Receber | Contas a Pagar |
|---------|------------------|----------------|
| **Código** | CR-AANNNN | CP-AANNNN |
| **Transação Caixa** | Entrada | Saída |
| **Valor Parcial** | `remaining_value` | `remaining_value` |
| **Status** | em_aberto, vencido, parcialmente_pago, quitado, cancelado | em_aberto, vencido, parcialmente_pago, quitado, cancelado |
| **Tabela de Pagamentos** | `receivable_payments` | `payable_payments` |
| **Triggers** | ✅ Implementados | ❌ A implementar |

---

## 🎯 ETAPA 1: ESTRUTURA DO BANCO DE DADOS

### 1.1 - Criar Tabela `accounts_payable`

**Migration**: `supabase/migrations/[timestamp]_create_accounts_payable_table.sql`

```sql
-- =====================================================
-- CONTAS A PAGAR (ACCOUNTS PAYABLE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.accounts_payable (
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
  CONSTRAINT valid_installment_payable CHECK (
    (installment_current IS NULL AND installment_total IS NULL) OR
    (installment_current IS NOT NULL AND installment_total IS NOT NULL AND 
     installment_current <= installment_total)
  ),
  CONSTRAINT valid_remaining_value_payable CHECK (remaining_value <= original_value)
);

-- Comentários
COMMENT ON TABLE public.accounts_payable IS 'Contas a pagar do sistema financeiro';
COMMENT ON COLUMN public.accounts_payable.code IS 'Código único gerado automaticamente (ex: CP-250001)';
COMMENT ON COLUMN public.accounts_payable.contract_id IS 'Referência ao contrato que gerou a conta (opcional)';
COMMENT ON COLUMN public.accounts_payable.original_value IS 'Valor original da conta a pagar';
COMMENT ON COLUMN public.accounts_payable.remaining_value IS 'Valor restante a pagar (após pagamentos parciais)';
COMMENT ON COLUMN public.accounts_payable.status IS 'Status: em_aberto, vencido, parcialmente_pago, quitado, cancelado';
COMMENT ON COLUMN public.accounts_payable.vinculo IS 'Categoria/vínculo (Fornecedores, Comissões, Taxas, etc)';
COMMENT ON COLUMN public.accounts_payable.centro_custo IS 'Centro de custo (Vendas, Obras, Administrativo, etc)';
```

### 1.2 - Criar Índices

```sql
-- Índices para performance
CREATE INDEX idx_accounts_payable_due_date ON public.accounts_payable(due_date);
CREATE INDEX idx_accounts_payable_status ON public.accounts_payable(status);
CREATE INDEX idx_accounts_payable_contract_id ON public.accounts_payable(contract_id);
CREATE INDEX idx_accounts_payable_counterparty ON public.accounts_payable(counterparty);
CREATE INDEX idx_accounts_payable_vinculo ON public.accounts_payable(vinculo);
CREATE INDEX idx_accounts_payable_centro_custo ON public.accounts_payable(centro_custo);
CREATE INDEX idx_accounts_payable_registration_date ON public.accounts_payable(registration_date);

-- Índice composto para busca por status + vencimento
CREATE INDEX idx_accounts_payable_status_due_date 
  ON public.accounts_payable(status, due_date);
```

### 1.3 - Criar Tabela de Pagamentos

```sql
-- =====================================================
-- PAGAMENTOS (PAYABLE PAYMENTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payable_payments (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  account_payable_id UUID NOT NULL REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  cash_transaction_id UUID REFERENCES public.cash_transactions(id) ON DELETE SET NULL,
  
  -- Dados do pagamento
  payment_date DATE NOT NULL,
  payment_value NUMERIC(12,2) NOT NULL CHECK (payment_value > 0),
  payment_method TEXT NOT NULL,
  
  -- Metadados
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.payable_payments IS 'Registro de pagamentos (total ou parcial) de contas a pagar';
COMMENT ON COLUMN public.payable_payments.cash_transaction_id IS 'Referência à transação no caixa que efetivou o pagamento';
COMMENT ON COLUMN public.payable_payments.payment_method IS 'Forma de pagamento (PIX, Dinheiro, Transferência, Boleto, etc)';

-- Índices
CREATE INDEX idx_payable_payments_account_id ON public.payable_payments(account_payable_id);
CREATE INDEX idx_payable_payments_payment_date ON public.payable_payments(payment_date);
CREATE INDEX idx_payable_payments_cash_transaction_id ON public.payable_payments(cash_transaction_id);
```

### 1.4 - Criar Função para Gerar Código Automático

```sql
-- =====================================================
-- FUNÇÃO: Gerar código de conta a pagar
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_payable_code()
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
        SPLIT_PART(code, '-', 2),
        '[^0-9]',
        '',
        'g'
      ) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.accounts_payable
  WHERE code LIKE 'CP-' || year_suffix || '%';
  
  -- Formatar código: CP-AANNNN (ex: CP-250001)
  new_code := 'CP-' || year_suffix || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_payable_code() IS 
  'Gera código sequencial para contas a pagar no formato CP-AANNNN (ex: CP-250001)';
```

### 1.5 - Criar Trigger para Código Automático

```sql
-- =====================================================
-- TRIGGER: Auto-gerar código na inserção
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_payable_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_payable_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payable_code
  BEFORE INSERT ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payable_code();
```

### 1.6 - Criar Trigger para Atualizar Status por Vencimento

```sql
-- =====================================================
-- TRIGGER: Atualizar status para "vencido"
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_payable_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a conta está em aberto ou parcialmente paga e venceu
  IF NEW.status IN ('em_aberto', 'parcialmente_pago') AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'vencido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payable_overdue_status
  BEFORE INSERT OR UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payable_overdue_status();
```

### 1.7 - Criar Trigger para Atualizar Valor Restante

```sql
-- =====================================================
-- TRIGGER: Atualizar remaining_value após pagamento
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_payable_remaining_value()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  payable_record RECORD;
BEGIN
  -- Buscar informações da conta a pagar
  SELECT original_value INTO payable_record
  FROM public.accounts_payable
  WHERE id = NEW.account_payable_id;
  
  -- Calcular total pago até agora
  SELECT COALESCE(SUM(payment_value), 0)
  INTO total_paid
  FROM public.payable_payments
  WHERE account_payable_id = NEW.account_payable_id;
  
  -- Atualizar remaining_value e status
  UPDATE public.accounts_payable
  SET 
    remaining_value = payable_record.original_value - total_paid,
    status = CASE
      WHEN (payable_record.original_value - total_paid) = 0 THEN 'quitado'
      WHEN (payable_record.original_value - total_paid) < payable_record.original_value THEN 'parcialmente_pago'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.account_payable_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payable_remaining_value
  AFTER INSERT ON public.payable_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payable_remaining_value();
```

### 1.8 - Criar Trigger para updated_at

```sql
-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_accounts_payable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_accounts_payable_updated_at
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accounts_payable_updated_at();
```

### 1.9 - Criar RLS Policies

```sql
-- =====================================================
-- RLS POLICIES: Contas a Pagar
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payable_payments ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Todos autenticados podem ver
CREATE POLICY "Usuários autenticados podem visualizar contas a pagar"
  ON public.accounts_payable
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: INSERT - Admin e Editor podem criar
CREATE POLICY "Admin e Editor podem criar contas a pagar"
  ON public.accounts_payable
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
CREATE POLICY "Admin e Editor podem editar contas a pagar"
  ON public.accounts_payable
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
CREATE POLICY "Apenas Admin pode excluir contas a pagar"
  ON public.accounts_payable
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para payable_payments (mesma lógica)
CREATE POLICY "Usuários autenticados podem visualizar pagamentos"
  ON public.payable_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin e Editor podem registrar pagamentos"
  ON public.payable_payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Apenas Admin pode excluir pagamentos"
  ON public.payable_payments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 1.10 - Adicionar Referência em cash_transactions

```sql
-- =====================================================
-- ALTER: Adicionar coluna account_payable_id
-- =====================================================

-- A coluna account_payable_id já está prevista no cash_transactions
-- mas pode não estar criada ainda. Verificar e criar se necessário:

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_transactions' 
    AND column_name = 'account_payable_id'
  ) THEN
    ALTER TABLE public.cash_transactions 
    ADD COLUMN account_payable_id UUID REFERENCES public.accounts_payable(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.cash_transactions.account_payable_id IS 
      'Referência à conta a pagar que originou a transação de saída';
  END IF;
END $$;
```

---

## 🎯 ETAPA 2: IMPLEMENTAR SERVER ACTIONS

### 2.1 - Criar Arquivo de Actions

**Arquivo**: `app/actions/payables.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =====================================================
// Schemas de Validação
// =====================================================

const accountPayableSchema = z.object({
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

const payablePaymentSchema = z.object({
  account_payable_id: z.string().uuid(),
  payment_date: z.string().or(z.date()),
  payment_value: z.number().positive('Valor deve ser maior que zero'),
  payment_method: z.string().min(1, 'Forma de pagamento é obrigatória'),
  bank_account_id: z.string().uuid('Conta bancária é obrigatória'),
  notes: z.string().optional().nullable(),
})

// =====================================================
// Types
// =====================================================

export type AccountPayableFormData = z.infer<typeof accountPayableSchema>
export type PayablePaymentFormData = z.infer<typeof payablePaymentSchema>

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
// ACCOUNTS PAYABLE - CRUD
// =====================================================

export async function createAccountPayable(
  data: AccountPayableFormData
): Promise<ActionResult> {
  try {
    const validatedData = accountPayableSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para criar contas a pagar' }
    }

    const { data: account, error } = await supabase
      .from('accounts_payable')
      .insert({
        ...validatedData,
        remaining_value: validatedData.original_value,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conta a pagar:', error)
      return { success: false, error: 'Erro ao criar conta a pagar' }
    }

    revalidatePath('/financeiro/contas-pagar')
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

export async function getAccountsPayable(filters?: {
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
      .from('accounts_payable')
      .select('*')
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
      console.error('Erro ao buscar contas a pagar:', error)
      return { success: false, error: 'Erro ao carregar contas' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function updateAccountPayable(
  id: string,
  data: Partial<AccountPayableFormData>
): Promise<ActionResult> {
  try {
    const validatedData = accountPayableSchema.partial().parse(data)
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
      .from('accounts_payable')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta' }
    }

    revalidatePath('/financeiro/contas-pagar')
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

export async function deleteAccountPayable(id: string): Promise<ActionResult> {
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
      .from('accounts_payable')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir conta:', error)
      return { success: false, error: 'Erro ao excluir conta' }
    }

    revalidatePath('/financeiro/contas-pagar')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

// =====================================================
// PAYABLE PAYMENTS - Pagamentos
// =====================================================

export async function createPayablePayment(
  data: PayablePaymentFormData
): Promise<ActionResult> {
  try {
    const validatedData = payablePaymentSchema.parse(data)
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
      return { success: false, error: 'Sem permissão para registrar pagamentos' }
    }

    // Buscar conta a pagar
    const { data: payable } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', validatedData.account_payable_id)
      .single()

    if (!payable) {
      return { success: false, error: 'Conta a pagar não encontrada' }
    }

    // Validar valor do pagamento
    if (validatedData.payment_value > payable.remaining_value) {
      return { 
        success: false, 
        error: `Valor de pagamento (${validatedData.payment_value}) não pode ser maior que o valor restante (${payable.remaining_value})` 
      }
    }

    // 1. Criar transação no caixa (saída)
    const { data: cashTransaction, error: cashError } = await supabase
      .from('cash_transactions')
      .insert({
        bank_account_id: validatedData.bank_account_id,
        transaction_date: validatedData.payment_date,
        type: 'saida',
        description: `Pagamento: ${payable.description}`,
        vinculo: payable.vinculo,
        forma: 'Caixa',
        centro_custo: payable.centro_custo,
        value: validatedData.payment_value,
        account_payable_id: validatedData.account_payable_id,
        notes: validatedData.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (cashError) {
      console.error('Erro ao criar transação no caixa:', cashError)
      return { success: false, error: 'Erro ao registrar saída no caixa' }
    }

    // 2. Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payable_payments')
      .insert({
        account_payable_id: validatedData.account_payable_id,
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

    revalidatePath('/financeiro/contas-pagar')
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
    console.error('Erro ao registrar pagamento:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

export async function getPayablePayments(
  accountPayableId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('payable_payments')
      .select(`
        *,
        cash_transaction:cash_transactions(*)
      `)
      .eq('account_payable_id', accountPayableId)
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
// BATCH PAYMENTS - Pagamentos em Lote
// =====================================================

export async function createBatchPayablePayments(
  payments: Array<{
    account_payable_id: string
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

    // Processar cada pagamento
    const results = []
    for (const payment of payments) {
      const result = await createPayablePayment({
        ...commonData,
        ...payment,
      })
      results.push(result)
    }

    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} pagamento(s) falharam`,
        data: { failures },
      }
    }

    revalidatePath('/financeiro/contas-pagar')
    revalidatePath('/financeiro/caixa')
    return { 
      success: true, 
      data: { processed: results.length }
    }
  } catch (error) {
    console.error('Erro no pagamento em lote:', error)
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

export async function getPayablesSummary(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const today = new Date().toISOString().split('T')[0]

    // Total em aberto
    const { data: openData } = await supabase
      .from('accounts_payable')
      .select('remaining_value')
      .in('status', ['em_aberto', 'vencido', 'parcialmente_pago'])

    const totalOpen = openData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencidas
    const { data: overdueData } = await supabase
      .from('accounts_payable')
      .select('remaining_value')
      .eq('status', 'vencido')

    const totalOverdue = overdueData?.reduce((sum, item) => sum + Number(item.remaining_value), 0) || 0

    // Vencendo hoje
    const { data: todayData } = await supabase
      .from('accounts_payable')
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
export interface AccountPayable {
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

export interface PayablePayment {
  id: string
  account_payable_id: string
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

**Arquivo**: `app/financeiro/contas-pagar/page.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { AccountsPayableTable } from "@/components/financial/accounts-payable-table"
import { PayablesSummaryCards } from "@/components/financial/payables-summary-cards"
import {
  AccountsPayableFilters,
  type AccountsPayableFilters as FiltersType,
} from "@/components/financial/accounts-payable-filters"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAccountsPayable, getUserPermissions } from "@/app/actions/payables"
import { useToast } from "@/hooks/use-toast"
import type { AccountPayable } from "@/lib/types"

export default function AccountsPayablePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState<FiltersType>({})
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
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
    if (filters.status && filters.status !== '_all') apiFilters.status = filters.status
    if (filters.vinculo) apiFilters.vinculo = filters.vinculo
    if (filters.centroCusto) apiFilters.centroCusto = filters.centroCusto
    if (filters.description) apiFilters.description = filters.description
    if (filters.valueMin) apiFilters.valueMin = filters.valueMin
    if (filters.valueMax) apiFilters.valueMax = filters.valueMax

    const result = await getAccountsPayable(apiFilters)

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
    <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Contas a Pagar" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie valores a pagar de contratos e despesas</p>
          </div>
          <Button 
            onClick={() => router.push("/financeiro/contas-pagar/lote")} 
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Pagamento em lote
          </Button>
        </div>

        {!isLoading && <PayablesSummaryCards accounts={accounts} />}

        <AccountsPayableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <AccountsPayableTable 
          accounts={accounts}
          onSuccess={handleSuccess}
        />
      </div>
    </MainLayout>
  )
}
```

### 4.2 - Atualizar Filtros

**Arquivo**: `components/financial/accounts-payable-filters.tsx`

Seguir o mesmo padrão de `accounts-receivable-filters.tsx`:
- Trocar Popover por input type="date"
- Adicionar campo status
- Implementar updateFilter com remoção de valores vazios

### 4.3 - Atualizar Tabela

**Arquivo**: `components/financial/accounts-payable-table.tsx`

Integrar com actions:
- Adicionar prop `onSuccess`
- Substituir `console.log` por chamadas às actions
- Usar `remaining_value` em vez de `value`
- Implementar handlers para: pay, partial-pay, edit, delete

### 4.4 - Criar/Atualizar Dialogs

Criar ou adaptar os seguintes componentes:
- `components/financial/payable-form-dialog.tsx` - Formulário de criação
- `components/financial/pay-dialog.tsx` - Dialog de pagamento total
- `components/financial/partial-pay-dialog.tsx` - Dialog de pagamento parcial
- `components/financial/edit-payable-dialog.tsx` - Dialog de edição
- `components/financial/delete-payable-dialog.tsx` - Confirmação de exclusão

### 4.5 - Atualizar Cards de Resumo

**Arquivo**: `components/financial/payables-summary-cards.tsx`

Ajustar para usar `remaining_value`:

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

## 🎯 ETAPA 5: IMPLEMENTAR PAGAMENTO EM LOTE

### 5.1 - Atualizar Página de Lote

**Arquivo**: `app/financeiro/contas-pagar/lote/page.tsx`

Integrar com actions:
- Carregar contas reais com `getAccountsPayable({ status: 'em_aberto' })`
- Carregar contas bancárias com `getBankAccounts()`
- Submeter pagamentos com `createBatchPayablePayments()`

---

## 🎯 ETAPA 6: TESTES E VALIDAÇÃO

### 6.1 - Checklist de Testes

#### Banco de Dados
- [ ] Migration aplicada com sucesso
- [ ] Tabelas criadas (`accounts_payable`, `payable_payments`)
- [ ] Triggers funcionando (código automático CP-AANNNN, status vencido, remaining_value)
- [ ] RLS policies ativas e funcionais
- [ ] Índices criados para performance
- [ ] Coluna `account_payable_id` em `cash_transactions`

#### CRUD de Contas a Pagar
- [ ] Criar conta a pagar (admin/editor)
- [ ] Listar contas com filtros
- [ ] Editar conta (admin/editor)
- [ ] Excluir conta (admin apenas)
- [ ] Visualizador NÃO consegue criar/editar/excluir

#### Pagamentos
- [ ] Pagamento total baixa a conta
- [ ] Pagamento parcial atualiza `remaining_value`
- [ ] Múltiplos pagamentos parciais somam corretamente
- [ ] Transação no caixa é criada automaticamente (tipo: saída)
- [ ] Histórico de pagamentos visível

#### Filtros
- [ ] Filtro por data de vencimento
- [ ] Filtro por código
- [ ] Filtro por status
- [ ] Filtro por vínculo
- [ ] Filtro por centro de custo
- [ ] Filtro por descrição
- [ ] Filtro por valor (min/max)
- [ ] Limpar filtros restaura lista completa

#### Pagamento em Lote
- [ ] Selecionar múltiplas contas
- [ ] Processar pagamentos em batch
- [ ] Validação de valores
- [ ] Feedback de sucesso/erro

#### UI/UX
- [ ] Loading states funcionando
- [ ] Toasts de sucesso/erro
- [ ] Badges de status corretos
- [ ] Formatação de valores (R$)
- [ ] Formatação de datas (dd/MM/yyyy)
- [ ] Ícones e cores intuitivos

---

## 📦 ETAPA 7: COMANDOS DE EXECUÇÃO

### 7.1 - Aplicar Migration

```powershell
# Certifique-se de estar conectado ao Supabase
npx supabase db push
```

### 7.2 - Verificar Estrutura

```powershell
# Verificar se as tabelas foram criadas
# Use o MCP do Supabase para listar tabelas
```

### 7.3 - Rodar Aplicação

```powershell
# Limpar cache e rodar dev
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm run dev
```

---

## 📚 RESUMO DA ARQUITETURA

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTAS A PAGAR                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Criação da Conta                                         │
│     - Formulário → createAccountPayable()                    │
│     - Trigger: Gera código (CP-250001)                       │
│     - Trigger: Define status (em_aberto/vencido)             │
│     - remaining_value = original_value                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Pagamento (Total ou Parcial)                             │
│     - Modal → createPayablePayment()                         │
│     ├─ Cria cash_transaction (SAÍDA no caixa)                │
│     ├─ Cria payable_payment                                  │
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

### Diferenças: Contas a Receber x Contas a Pagar

| Aspecto | Contas a Receber | Contas a Pagar |
|---------|------------------|----------------|
| **Tabela Principal** | `accounts_receivable` | `accounts_payable` |
| **Tabela Pagamentos** | `receivable_payments` | `payable_payments` |
| **Código** | CR-AANNNN | CP-AANNNN |
| **Transação Caixa** | tipo: 'entrada' | tipo: 'saida' |
| **Function Código** | `generate_receivable_code()` | `generate_payable_code()` |
| **Trigger Código** | `set_receivable_code()` | `set_payable_code()` |
| **Trigger Valor** | `update_receivable_remaining_value()` | `update_payable_remaining_value()` |
| **Actions File** | `app/actions/receivables.ts` | `app/actions/payables.ts` |

### Segurança (RLS)

| Ação   | Admin | Editor | Visualizador |
|--------|-------|--------|--------------|
| SELECT | ✅     | ✅      | ✅            |
| INSERT | ✅     | ✅      | ❌            |
| UPDATE | ✅     | ✅      | ❌            |
| DELETE | ✅     | ❌      | ❌            |

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Aplicar Migration** (Etapa 1) - Criar estrutura do banco
2. **Criar Actions** (Etapa 2) - `app/actions/payables.ts`
3. **Atualizar Types** (Etapa 3) - `lib/types.ts`
4. **Atualizar Página Principal** (Etapa 4.1) - `app/financeiro/contas-pagar/page.tsx`
5. **Atualizar Filtros** (Etapa 4.2) - `components/financial/accounts-payable-filters.tsx`
6. **Atualizar Tabela** (Etapa 4.3) - `components/financial/accounts-payable-table.tsx`
7. **Criar/Atualizar Dialogs** (Etapa 4.4) - Componentes de modal
8. **Atualizar Cards** (Etapa 4.5) - `components/financial/payables-summary-cards.tsx`
9. **Implementar Lote** (Etapa 5) - `app/financeiro/contas-pagar/lote/page.tsx`
10. **Testar** (Etapa 6) - Validar todas as funcionalidades

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Sincronização com Caixa**: Todo pagamento cria automaticamente uma transação de **SAÍDA** no módulo Caixa
2. **Código Automático**: O código é gerado no formato `CP-AANNNN` (ex: CP-250001) pelo trigger
3. **Status Vencido**: Atualizado automaticamente quando `due_date < CURRENT_DATE`
4. **Valor Restante**: Calculado automaticamente pelo trigger após cada pagamento
5. **Permissões**: Respeitar roles (admin > editor > visualizador)
6. **Validações**: Usar Zod schemas para validar dados no backend
7. **Revalidação**: Sempre usar `revalidatePath()` após mutations
8. **Padrão de Código**: Seguir exatamente o padrão de Contas a Receber para consistência

---

## 🔗 REFERÊNCIAS

- **Módulo Contas a Receber**: `app/actions/receivables.ts` (usar como base)
- **Módulo Caixa**: `app/actions/cash.ts` (referência de integração)
- **Componentes**: `components/financial/` (usar como referência)
- **Types**: `lib/types.ts`
- **Mock Data**: `lib/mock-data.ts` (para referência de estrutura)
- **Roteiro Contas a Receber**: `ROTEIRO_IMPLEMENTACAO_CONTAS_RECEBER.md`

---

## ✅ CHECKLIST FINAL

### Banco de Dados
- [ ] Migration criada e aplicada
- [ ] Tabela `accounts_payable` criada
- [ ] Tabela `payable_payments` criada
- [ ] Função `generate_payable_code()` criada
- [ ] Trigger `set_payable_code` criado
- [ ] Trigger `update_payable_overdue_status` criado
- [ ] Trigger `update_payable_remaining_value` criado
- [ ] Trigger `update_accounts_payable_updated_at` criado
- [ ] RLS policies criadas e ativas
- [ ] Índices criados
- [ ] Coluna `account_payable_id` em `cash_transactions`

### Backend
- [ ] Arquivo `app/actions/payables.ts` criado
- [ ] Schema Zod definido
- [ ] CRUD completo implementado
- [ ] Integração com caixa implementada
- [ ] Validações implementadas
- [ ] Permissões verificadas
- [ ] Batch payments implementado

### Frontend
- [ ] Página principal atualizada
- [ ] Filtros atualizados (input type="date" + status)
- [ ] Tabela atualizada com actions
- [ ] Dialogs criados/atualizados
- [ ] Cards de resumo atualizados
- [ ] Página de lote atualizada
- [ ] Loading states implementados
- [ ] Toasts de feedback implementados

### Testes
- [ ] Criar conta funcionando
- [ ] Listar contas funcionando
- [ ] Editar conta funcionando
- [ ] Excluir conta funcionando
- [ ] Pagamento total funcionando
- [ ] Pagamento parcial funcionando
- [ ] Pagamento em lote funcionando
- [ ] Filtros funcionando
- [ ] Integração com caixa funcionando
- [ ] Triggers funcionando corretamente
- [ ] Permissões funcionando corretamente

---

**Desenvolvido por**: QA Agent  
**Data**: 09/12/2025  
**Versão**: 1.0  
**Base**: Módulo Contas a Receber (implementado e testado)
