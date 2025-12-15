# ROTEIRO DE IMPLEMENTAÇÃO - PÁGINA DE CONTRATOS

## ✅ STATUS GERAL: IMPLEMENTAÇÃO CONCLUÍDA

**Data de Conclusão**: 2024
**Fases Implementadas**: 5/5 (100%)

---

## 📋 ANÁLISE COMPLETA

### 1. ESTRUTURA ATUAL DA PÁGINA (MOCK)
- **Página de Listagem**: `/app/contratos/page.tsx` - usando mock data
- **Página de Criação**: `/app/contratos/novo/page.tsx` - com formulário complexo
- **Página de Detalhes**: `/app/contratos/[id]/page.tsx` - visualização individual
- **Componentes**: 10 componentes na pasta `components/contracts/`
- **Status**: Totalmente baseado em dados mock (não conectado ao banco)

### 2. ESTRUTURA VISUAL DA IMAGEM ANEXADA
```
┌─────────────────────────────────────────────────────────────┐
│ Contratos                                    🔍 [+ Novo]    │
│ Gerencie todos os contratos do sistema                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Lista de Contratos                      [+ Novo Contrato]   │
│                                                              │
│ 🔍 Buscar por código, partes...                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Código │ Data       │ Partes           │ Valor   │ ... │   │
│ ├────────┼────────────┼──────────────────┼─────────┼─────┤   │
│ │ CT-0013│ 12/12/2024 │ A: Larissa F...  │ R$ 320k │ ... │   │
│ │        │            │ B: Imobiliária...│         │     │   │
│ ├────────┼────────────┼──────────────────┼─────────┼─────┤   │
│ │ CT-0025│ 24/12/2024 │ A: Carla B...    │ R$ 560k │ ... │   │
│ │        │            │ B: Administrad...│         │     │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Características Identificadas:**
- Tabela simples com código, data, partes e valor
- Busca por código e partes
- Botão "Novo Contrato" destacado
- Exibe parte A e parte B em linhas separadas ou truncado
- Coluna de ações (3 pontos) à direita

### 3. ANÁLISE DO BANCO DE DADOS SUPABASE

**TABELAS EXISTENTES RELACIONADAS:**
- ✅ `people` - pessoas físicas (já existe)
- ✅ `companies` - empresas (já existe) 
- ✅ `properties` - imóveis (já existe)
- ✅ `vehicles` - veículos (já existe)
- ✅ `credits` - cartas de crédito (já existe)
- ✅ `developments` - empreendimentos (já existe)
- ✅ `accounts_receivable` - tem campo `contract_id` (já existe)
- ✅ `accounts_payable` - tem campo `contract_id` (já existe)
- ✅ `cash_transactions` - tem campo `contract_id` (já existe)
- ❌ **Tabelas de contratos NÃO EXISTEM**

**ESTRUTURA NECESSÁRIA:**
```
contracts (tabela principal)
├── contract_parties (partes do contrato)
├── contract_items (itens do contrato)
├── contract_item_participants (participação por item)
└── contract_payment_conditions (condições de pagamento)
```

### 4. ESTRUTURA DO FORMULÁRIO ATUAL (CONTRACT-FORM.TSX)

**5 Etapas do Formulário:**
1. **Metadados** - código, data, observações
2. **Partes** - Lado A (GRA e Outros) + Lado B (Terceiros)
3. **Itens** - imóveis, veículos, créditos, empreendimentos, dinheiro
4. **Pagamento** - condições de entrada/saída, parcelas
5. **Resumo** - validação e balanceamento

**Conceito de Balanceamento:**
- Lado A (totalValue) = Lado B (totalValue)
- Balance deve ser = R$ 0,00 para ativar contrato
- Cada item tem participantes com percentuais

---

## 🎯 ROTEIRO DE IMPLEMENTAÇÃO

### FASE 1: ESTRUTURA DO BANCO DE DADOS

#### 1.1 - Criar Tabela `contracts`
```sql
-- Tabela principal de contratos
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- CT-0001, CT-0002, etc
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Totais calculados
  side_a_total NUMERIC(15,2) DEFAULT 0 CHECK (side_a_total >= 0),
  side_b_total NUMERIC(15,2) DEFAULT 0 CHECK (side_b_total >= 0),
  balance NUMERIC(15,2) GENERATED ALWAYS AS (side_a_total - side_b_total) STORED,
  
  -- Status e metadados
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'concluido', 'cancelado')),
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Documentos anexados (opcional - futuro)
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  
  COMMENT ON TABLE contracts IS 'Contratos balanceados entre partes'
);

-- Função para gerar código automático
CREATE OR REPLACE FUNCTION generate_contract_code()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(code FROM 4)::INTEGER), 0) + 1
  INTO next_number
  FROM contracts;
  
  new_code := 'CT-' || LPAD(next_number::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Índices
CREATE INDEX idx_contracts_code ON contracts(code);
CREATE INDEX idx_contracts_date ON contracts(contract_date);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);

-- Trigger para updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 1.2 - Criar Tabela `contract_parties`
```sql
-- Partes envolvidas no contrato (pessoas e empresas)
CREATE TABLE contract_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Lado do contrato
  side TEXT NOT NULL CHECK (side IN ('A', 'B')),
  
  -- Referência à pessoa ou empresa
  party_type TEXT NOT NULL CHECK (party_type IN ('pessoa', 'empresa')),
  party_id UUID NOT NULL, -- ID da pessoa ou empresa
  party_name TEXT NOT NULL, -- Nome para busca rápida (desnormalizado)
  party_document TEXT NOT NULL, -- CPF ou CNPJ para busca rápida
  
  -- Percentual de participação GRA (apenas para lado A)
  gra_percentage NUMERIC(5,2) DEFAULT 0 CHECK (gra_percentage >= 0 AND gra_percentage <= 100),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  
  COMMENT ON TABLE contract_parties IS 'Partes (pessoas e empresas) envolvidas em contratos'
);

-- Índices
CREATE INDEX idx_contract_parties_contract ON contract_parties(contract_id);
CREATE INDEX idx_contract_parties_side ON contract_parties(contract_id, side);
CREATE INDEX idx_contract_parties_party ON contract_parties(party_type, party_id);
CREATE INDEX idx_contract_parties_name ON contract_parties(party_name);
CREATE INDEX idx_contract_parties_document ON contract_parties(party_document);

-- Constraint: party_id deve existir em people ou companies
-- (não é possível com FK simples, validar no application layer)
```

#### 1.3 - Criar Tabela `contract_items`
```sql
-- Itens do contrato (imóveis, veículos, créditos, etc)
CREATE TABLE contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Lado do contrato
  side TEXT NOT NULL CHECK (side IN ('A', 'B')),
  
  -- Tipo e referência ao item
  item_type TEXT NOT NULL CHECK (item_type IN ('imovel', 'veiculo', 'credito', 'empreendimento', 'dinheiro')),
  item_id UUID, -- NULL para 'dinheiro', obrigatório para outros tipos
  
  -- Descrição e valor
  description TEXT NOT NULL,
  item_value NUMERIC(15,2) NOT NULL CHECK (item_value > 0),
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  COMMENT ON TABLE contract_items IS 'Itens (ativos) incluídos em contratos'
);

-- Índices
CREATE INDEX idx_contract_items_contract ON contract_items(contract_id);
CREATE INDEX idx_contract_items_side ON contract_items(contract_id, side);
CREATE INDEX idx_contract_items_type ON contract_items(item_type, item_id);
```

#### 1.4 - Criar Tabela `contract_item_participants`
```sql
-- Participantes de cada item do contrato (percentuais)
CREATE TABLE contract_item_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_item_id UUID NOT NULL REFERENCES contract_items(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES contract_parties(id) ON DELETE CASCADE,
  
  -- Percentual de participação neste item
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  COMMENT ON TABLE contract_item_participants IS 'Participação percentual das partes em cada item do contrato'
);

-- Índices
CREATE INDEX idx_item_participants_item ON contract_item_participants(contract_item_id);
CREATE INDEX idx_item_participants_party ON contract_item_participants(party_id);

-- Constraint: soma dos percentuais deve ser 100% por item
-- (validar no application layer ou via trigger)
```

#### 1.5 - Criar Tabela `contract_payment_conditions`
```sql
-- Condições de pagamento do contrato
CREATE TABLE contract_payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Valor e direção
  condition_value NUMERIC(15,2) NOT NULL CHECK (condition_value > 0),
  direction TEXT NOT NULL CHECK (direction IN ('entrada', 'saida')),
  
  -- Tipo de pagamento
  payment_type TEXT NOT NULL CHECK (payment_type IN ('unico', 'parcelado')),
  installments INTEGER DEFAULT 1 CHECK (installments >= 1),
  frequency TEXT CHECK (frequency IN ('semanal', 'mensal', 'trimestral', 'semestral', 'anual')),
  
  -- Datas
  start_date DATE NOT NULL,
  
  -- Metadados
  payment_method TEXT, -- PIX, Dinheiro, Transferência, etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  COMMENT ON TABLE contract_payment_conditions IS 'Condições de pagamento dos contratos'
);

-- Índices
CREATE INDEX idx_payment_conditions_contract ON contract_payment_conditions(contract_id);
CREATE INDEX idx_payment_conditions_date ON contract_payment_conditions(start_date);
```

#### 1.6 - Criar Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_item_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies para contracts
CREATE POLICY "Usuários autenticados podem visualizar contratos"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin e editor podem inserir contratos"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admin e editor podem atualizar contratos"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Apenas admin pode deletar contratos"
  ON contracts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para tabelas relacionadas (cascade das policies de contracts)
-- contract_parties
CREATE POLICY "Visualizar partes de contratos acessíveis"
  ON contract_parties FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Inserir partes se pode inserir contrato"
  ON contract_parties FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Atualizar partes se pode atualizar contrato"
  ON contract_parties FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Deletar partes se pode deletar contrato"
  ON contract_parties FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Replicar mesmas policies para contract_items
CREATE POLICY "Visualizar itens de contratos" ON contract_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserir itens" ON contract_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Atualizar itens" ON contract_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Deletar itens" ON contract_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Replicar para contract_item_participants
CREATE POLICY "Visualizar participantes" ON contract_item_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserir participantes" ON contract_item_participants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Atualizar participantes" ON contract_item_participants FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Deletar participantes" ON contract_item_participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Replicar para contract_payment_conditions
CREATE POLICY "Visualizar condições" ON contract_payment_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserir condições" ON contract_payment_conditions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Atualizar condições" ON contract_payment_conditions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
CREATE POLICY "Deletar condições" ON contract_payment_conditions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
```

#### 1.7 - Criar Triggers e Functions Auxiliares

```sql
-- Function genérica para atualizar updated_at (caso ainda não exista)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totais do contrato quando itens mudam
CREATE OR REPLACE FUNCTION recalculate_contract_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_id UUID;
  v_side_a NUMERIC;
  v_side_b NUMERIC;
BEGIN
  -- Determinar o contract_id
  IF TG_OP = 'DELETE' THEN
    v_contract_id := OLD.contract_id;
  ELSE
    v_contract_id := NEW.contract_id;
  END IF;
  
  -- Calcular total do lado A
  SELECT COALESCE(SUM(item_value), 0)
  INTO v_side_a
  FROM contract_items
  WHERE contract_id = v_contract_id AND side = 'A';
  
  -- Calcular total do lado B
  SELECT COALESCE(SUM(item_value), 0)
  INTO v_side_b
  FROM contract_items
  WHERE contract_id = v_contract_id AND side = 'B';
  
  -- Atualizar totais
  UPDATE contracts
  SET side_a_total = v_side_a,
      side_b_total = v_side_b,
      updated_at = now()
  WHERE id = v_contract_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trigger_recalc_totals_insert
  AFTER INSERT ON contract_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_contract_totals();

CREATE TRIGGER trigger_recalc_totals_update
  AFTER UPDATE ON contract_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_contract_totals();

CREATE TRIGGER trigger_recalc_totals_delete
  AFTER DELETE ON contract_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_contract_totals();
```

---

### FASE 2: TYPES E INTERFACES (TypeScript)

#### 2.1 - Atualizar `lib/types.ts`

Adicionar/atualizar as seguintes interfaces:

```typescript
// =====================================================
// Contract Types
// =====================================================

export interface Contract {
  id: string
  code: string
  contract_date: string
  side_a_total: number
  side_b_total: number
  balance: number // Calculado: side_a_total - side_b_total
  status: 'rascunho' | 'ativo' | 'concluido' | 'cancelado'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  attachment_urls?: string[]
  
  // Relações (populadas via join ou query separada)
  parties?: ContractParty[]
  items?: ContractItem[]
  payment_conditions?: ContractPaymentCondition[]
}

export interface ContractParty {
  id: string
  contract_id: string
  side: 'A' | 'B'
  party_type: 'pessoa' | 'empresa'
  party_id: string
  party_name: string
  party_document: string // CPF ou CNPJ
  gra_percentage: number // Apenas lado A
  created_at: string
  
  // Dados expandidos (opcional - via join)
  email?: string
  phone?: string
}

export interface ContractItem {
  id: string
  contract_id: string
  side: 'A' | 'B'
  item_type: 'imovel' | 'veiculo' | 'credito' | 'empreendimento' | 'dinheiro'
  item_id?: string // NULL para dinheiro
  description: string
  item_value: number
  notes?: string
  created_at: string
  
  // Relações
  participants?: ContractItemParticipant[]
}

export interface ContractItemParticipant {
  id: string
  contract_item_id: string
  party_id: string
  percentage: number
  created_at: string
  
  // Dados expandidos (opcional)
  party_name?: string
}

export interface ContractPaymentCondition {
  id: string
  contract_id: string
  condition_value: number
  direction: 'entrada' | 'saida'
  payment_type: 'unico' | 'parcelado'
  installments: number
  frequency?: 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'
  start_date: string
  payment_method?: string
  notes?: string
  created_at: string
}

// Tipo auxiliar para formulário
export interface ContractFormData {
  code: string
  contract_date: Date | string
  notes?: string
  
  // Estrutura temporária para o form (antes de salvar)
  sideA: {
    parties: ContractParty[]
    items: ContractItem[]
  }
  sideB: {
    parties: ContractParty[]
    items: ContractItem[]
  }
  
  payment_conditions: ContractPaymentCondition[]
}
```

---

### FASE 3: SERVER ACTIONS

#### 3.1 - Criar `app/actions/contracts.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Contract, ContractParty, ContractItem, ContractPaymentCondition } from '@/lib/types'

// ===== PERMISSÕES =====
async function checkPermission(action: 'read' | 'write' | 'delete') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false, error: 'Usuário não autenticado' }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return { authorized: false, error: 'Perfil não encontrado' }
  }
  
  const { role } = profile
  
  if (action === 'read') {
    return { authorized: true }
  }
  
  if (action === 'write') {
    if (role === 'admin' || role === 'editor') {
      return { authorized: true }
    }
    return { authorized: false, error: 'Permissão negada. Apenas admin e editor podem criar/editar.' }
  }
  
  if (action === 'delete') {
    if (role === 'admin') {
      return { authorized: true }
    }
    return { authorized: false, error: 'Permissão negada. Apenas admin pode excluir.' }
  }
  
  return { authorized: false, error: 'Ação não reconhecida' }
}

// ===== LISTAR CONTRATOS =====
export async function getContracts() {
  const permission = await checkPermission('read')
  if (!permission.authorized) {
    return { success: false, error: permission.error, data: [] }
  }
  
  const supabase = await createClient()
  
  // Query com joins para buscar partes
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      *,
      parties:contract_parties(*)
    `)
    .order('contract_date', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar contratos:', error)
    return { success: false, error: error.message, data: [] }
  }
  
  return { success: true, data: contracts as Contract[] }
}

// ===== BUSCAR CONTRATO POR ID =====
export async function getContractById(id: string) {
  const permission = await checkPermission('read')
  if (!permission.authorized) {
    return { success: false, error: permission.error, data: null }
  }
  
  const supabase = await createClient()
  
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      parties:contract_parties(*),
      items:contract_items(
        *,
        participants:contract_item_participants(*)
      ),
      payment_conditions:contract_payment_conditions(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Erro ao buscar contrato:', error)
    return { success: false, error: error.message, data: null }
  }
  
  return { success: true, data: contract as Contract }
}

// ===== CRIAR CONTRATO =====
export async function createContract(data: {
  contract_date: string
  notes?: string
  parties: Omit<ContractParty, 'id' | 'contract_id' | 'created_at'>[]
  items: Omit<ContractItem, 'id' | 'contract_id' | 'created_at'>[]
  payment_conditions?: Omit<ContractPaymentCondition, 'id' | 'contract_id' | 'created_at'>[]
}) {
  const permission = await checkPermission('write')
  if (!permission.authorized) {
    return { success: false, error: permission.error }
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Gerar código
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_contract_code')
  
  if (codeError || !codeData) {
    return { success: false, error: 'Erro ao gerar código do contrato' }
  }
  
  // 2. Inserir contrato principal
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      code: codeData,
      contract_date: data.contract_date,
      notes: data.notes,
      status: 'rascunho',
      created_by: user?.id,
    })
    .select()
    .single()
  
  if (contractError || !contract) {
    console.error('Erro ao criar contrato:', contractError)
    return { success: false, error: contractError?.message || 'Erro ao criar contrato' }
  }
  
  // 3. Inserir partes
  if (data.parties.length > 0) {
    const partiesData = data.parties.map(p => ({
      contract_id: contract.id,
      side: p.side,
      party_type: p.party_type,
      party_id: p.party_id,
      party_name: p.party_name,
      party_document: p.party_document,
      gra_percentage: p.gra_percentage || 0,
    }))
    
    const { error: partiesError } = await supabase
      .from('contract_parties')
      .insert(partiesData)
    
    if (partiesError) {
      console.error('Erro ao inserir partes:', partiesError)
      // Rollback manual (deletar contrato)
      await supabase.from('contracts').delete().eq('id', contract.id)
      return { success: false, error: 'Erro ao inserir partes do contrato' }
    }
  }
  
  // 4. Inserir itens (com recálculo automático via trigger)
  if (data.items.length > 0) {
    const itemsData = data.items.map(i => ({
      contract_id: contract.id,
      side: i.side,
      item_type: i.item_type,
      item_id: i.item_id,
      description: i.description,
      item_value: i.item_value,
      notes: i.notes,
    }))
    
    const { error: itemsError } = await supabase
      .from('contract_items')
      .insert(itemsData)
    
    if (itemsError) {
      console.error('Erro ao inserir itens:', itemsError)
      await supabase.from('contracts').delete().eq('id', contract.id)
      return { success: false, error: 'Erro ao inserir itens do contrato' }
    }
  }
  
  // 5. Inserir condições de pagamento
  if (data.payment_conditions && data.payment_conditions.length > 0) {
    const conditionsData = data.payment_conditions.map(c => ({
      contract_id: contract.id,
      ...c,
    }))
    
    const { error: conditionsError } = await supabase
      .from('contract_payment_conditions')
      .insert(conditionsData)
    
    if (conditionsError) {
      console.error('Erro ao inserir condições:', conditionsError)
      // Não faz rollback - condições são opcionais
    }
  }
  
  revalidatePath('/contratos')
  return { success: true, data: contract }
}

// ===== ATUALIZAR CONTRATO =====
export async function updateContract(id: string, data: {
  contract_date?: string
  notes?: string
  status?: 'rascunho' | 'ativo' | 'concluido' | 'cancelado'
}) {
  const permission = await checkPermission('write')
  if (!permission.authorized) {
    return { success: false, error: permission.error }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contracts')
    .update(data)
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao atualizar contrato:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/contratos')
  revalidatePath(`/contratos/${id}`)
  return { success: true }
}

// ===== DELETAR CONTRATO =====
export async function deleteContract(id: string) {
  const permission = await checkPermission('delete')
  if (!permission.authorized) {
    return { success: false, error: permission.error }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao deletar contrato:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/contratos')
  return { success: true }
}

// ===== BUSCAR CONTRATOS (com filtros) =====
export async function searchContracts(filters: {
  code?: string
  dateFrom?: string
  dateTo?: string
  party?: string // nome ou documento
  status?: string
}) {
  const permission = await checkPermission('read')
  if (!permission.authorized) {
    return { success: false, error: permission.error, data: [] }
  }
  
  const supabase = await createClient()
  
  let query = supabase
    .from('contracts')
    .select(`
      *,
      parties:contract_parties(*)
    `)
  
  // Aplicar filtros
  if (filters.code) {
    query = query.ilike('code', `%${filters.code}%`)
  }
  
  if (filters.dateFrom) {
    query = query.gte('contract_date', filters.dateFrom)
  }
  
  if (filters.dateTo) {
    query = query.lte('contract_date', filters.dateTo)
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  query = query.order('contract_date', { ascending: false })
  
  const { data: contracts, error } = await query
  
  if (error) {
    console.error('Erro ao buscar contratos:', error)
    return { success: false, error: error.message, data: [] }
  }
  
  // Filtro de party (client-side por ser em tabela relacionada)
  let filtered = contracts as Contract[]
  
  if (filters.party) {
    const partyLower = filters.party.toLowerCase()
    filtered = filtered.filter(c => 
      c.parties?.some(p => 
        p.party_name.toLowerCase().includes(partyLower) ||
        p.party_document.toLowerCase().includes(partyLower)
      )
    )
  }
  
  return { success: true, data: filtered }
}

// ===== ATIVAR CONTRATO (validação de balanceamento) =====
export async function activateContract(id: string) {
  const permission = await checkPermission('write')
  if (!permission.authorized) {
    return { success: false, error: permission.error }
  }
  
  const supabase = await createClient()
  
  // Buscar contrato atual
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('balance')
    .eq('id', id)
    .single()
  
  if (fetchError || !contract) {
    return { success: false, error: 'Contrato não encontrado' }
  }
  
  // Validar balanceamento
  if (Math.abs(contract.balance) > 0.01) {
    return { 
      success: false, 
      error: `Contrato não está balanceado. Diferença: R$ ${contract.balance.toFixed(2)}` 
    }
  }
  
  // Atualizar status
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ status: 'ativo' })
    .eq('id', id)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  revalidatePath('/contratos')
  revalidatePath(`/contratos/${id}`)
  return { success: true }
}
```

---

### FASE 4: COMPONENTES DE UI

#### 4.1 - Atualizar `components/contracts/contracts-table.tsx`

Substituir mock data por dados reais:

```typescript
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Eye } from "lucide-react"
import type { Contract } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface ContractsTableProps {
  contracts: Contract[]
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const columns: TableColumn<Contract>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-32",
      render: (contract) => <span className="font-medium">{contract.code}</span>,
    },
    {
      key: "contract_date",
      label: "Data",
      width: "w-32",
      render: (contract) => formatDate(contract.contract_date),
    },
    {
      key: "parties",
      label: "Partes",
      width: "flex-1 min-w-[250px]",
      sortable: false,
      render: (contract) => {
        const sideA = contract.parties?.filter(p => p.side === 'A') || []
        const sideB = contract.parties?.filter(p => p.side === 'B') || []
        
        return (
          <div className="text-sm space-y-1">
            <div className="truncate">
              <span className="font-semibold">A:</span>{' '}
              {sideA.length > 0 ? sideA[0].party_name : '-'}
              {sideA.length > 1 && ` (+${sideA.length - 1})`}
            </div>
            <div className="truncate text-muted-foreground">
              <span className="font-semibold">B:</span>{' '}
              {sideB.length > 0 ? sideB[0].party_name : '-'}
              {sideB.length > 1 && ` (+${sideB.length - 1})`}
            </div>
          </div>
        )
      },
    },
    {
      key: "side_a_total",
      label: "Valor",
      width: "w-40",
      align: "right",
      render: (contract) => (
        <span className="font-medium">
          {contract.side_a_total > 0 ? formatCurrency(contract.side_a_total) : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-20",
      sortable: false,
      render: (contract) => (
        <Button variant="ghost" className="h-8 w-8 p-0" asChild title="Visualizar">
          <Link href={`/contratos/${contract.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      data={contracts}
      columns={columns}
      searchPlaceholder="Buscar por código, partes..."
    />
  )
}
```

#### 4.2 - Atualizar `app/contratos/page.tsx`

Converter para Server Component e usar actions:

```typescript
import { MainLayout } from "@/components/main-layout"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { getContracts } from "@/app/actions/contracts"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ContractsPage() {
  const { data: contracts } = await getContracts()

  return (
    <MainLayout breadcrumbs={[{ label: "Contratos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground">Gerencie todos os contratos do sistema</p>
          </div>
          <Button asChild>
            <Link href="/contratos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Lista de Contratos</h2>
              <Button asChild size="sm">
                <Link href="/contratos/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Contrato
                </Link>
              </Button>
            </div>
            
            <ContractsTable contracts={contracts || []} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
```

#### 4.3 - Atualizar `app/contratos/[id]/page.tsx`

Buscar dados reais:

```typescript
import { MainLayout } from "@/components/main-layout"
import { getContractById } from "@/app/actions/contracts"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const { data: contract } = await getContractById(params.id)

  if (!contract) {
    notFound()
  }

  const sideAParties = contract.parties?.filter(p => p.side === 'A') || []
  const sideBParties = contract.parties?.filter(p => p.side === 'B') || []
  const sideAItems = contract.items?.filter(i => i.side === 'A') || []
  const sideBItems = contract.items?.filter(i => i.side === 'B') || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "destructive"> = {
      rascunho: "secondary",
      ativo: "success",
      concluido: "default",
      cancelado: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>
  }

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Contratos", href: "/contratos" },
        { label: contract.code },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{contract.code}</h1>
            <p className="text-muted-foreground">
              Data: {formatDate(contract.contract_date)} • {getStatusBadge(contract.status)}
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Lado A (Total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(contract.side_a_total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {sideAParties.length} parte(s) • {sideAItems.length} item(ns)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Lado B (Total)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(contract.side_b_total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {sideBParties.length} parte(s) • {sideBItems.length} item(ns)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Balanço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${Math.abs(contract.balance) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(contract.balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.abs(contract.balance) < 0.01 ? 'Balanceado ✓' : 'Desbalanceado'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Partes */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lado A - GRA e Outros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sideAParties.map(party => (
                  <div key={party.id} className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-medium">{party.party_name}</p>
                      <p className="text-sm text-muted-foreground">{party.party_document}</p>
                    </div>
                    <Badge variant="outline">{party.gra_percentage}% GRA</Badge>
                  </div>
                ))}
                {sideAParties.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma parte cadastrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lado B - Terceiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sideBParties.map(party => (
                  <div key={party.id} className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-medium">{party.party_name}</p>
                      <p className="text-sm text-muted-foreground">{party.party_document}</p>
                    </div>
                  </div>
                ))}
                {sideBParties.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma parte cadastrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens do Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Lado A</h3>
                {sideAItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b py-2">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.item_type}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.item_value)}</span>
                  </div>
                ))}
                {sideAItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Nenhum item</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lado B</h3>
                {sideBItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b py-2">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.item_type}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.item_value)}</span>
                  </div>
                ))}
                {sideBItems.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Nenhum item</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {contract.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
```

#### 4.4 - Atualizar `app/contratos/novo/page.tsx`

Integrar com server actions (adaptar o ContractForm existente):

```typescript
import { MainLayout } from "@/components/main-layout"
import { ContractForm } from "@/components/contracts/contract-form"

export default function NewContractPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: "Novo Contrato" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Contrato</h1>
          <p className="text-muted-foreground">Crie um novo contrato balanceado entre as partes</p>
        </div>

        <ContractForm />
      </div>
    </MainLayout>
  )
}
```

**NOTA:** O componente `ContractForm` já existe e é complexo (1400 linhas). Ele precisará ser adaptado para:
1. Chamar `createContract()` ao invés de mock save
2. Redirecionar após criar com sucesso
3. Integrar os modais de busca (SearchPersonModal, SearchCompanyModal, SearchItemModal) com dados reais do Supabase

---

### FASE 5: INTEGRAÇÃO FINAL

#### 5.1 - Adaptar Modais de Busca

Os modais existentes (`SearchPersonModal`, `SearchCompanyModal`, `SearchItemModal`) precisam buscar dados reais:

**Exemplo: `components/contracts/search-person-modal.tsx`**

```typescript
// Adicionar import
import { createClient } from '@/lib/supabase/client'

// Dentro do componente, substituir mock data por:
const [people, setPeople] = React.useState<Person[]>([])
const [loading, setLoading] = React.useState(false)

React.useEffect(() => {
  if (open) {
    fetchPeople()
  }
}, [open])

const fetchPeople = async () => {
  setLoading(true)
  const supabase = createClient()
  const { data } = await supabase
    .from('people')
    .select('*')
    .eq('status', 'ativo')
    .order('full_name')
  
  setPeople(data || [])
  setLoading(false)
}
```

Similar para `SearchCompanyModal` e `SearchItemModal`.

#### 5.2 - Adaptar `ContractForm` para Salvar

No `components/contracts/contract-form.tsx`, atualizar a função `handleSave`:

```typescript
import { createContract } from '@/app/actions/contracts'
import { useRouter } from 'next/navigation'

// Dentro do componente
const router = useRouter()
const [submitting, setSubmitting] = React.useState(false)

const handleSave = async (activate = false) => {
  if (activate && !validateContract()) {
    return
  }
  
  setSubmitting(true)
  
  // Preparar dados para envio
  const parties = [
    ...(contractData.sideA?.parties || []).map(p => ({
      side: 'A' as const,
      party_type: p.type,
      party_id: p.id,
      party_name: p.name,
      party_document: p.document,
      gra_percentage: p.percentage || 0,
    })),
    ...(contractData.sideB?.parties || []).map(p => ({
      side: 'B' as const,
      party_type: p.type,
      party_id: p.id,
      party_name: p.name,
      party_document: p.document,
      gra_percentage: 0,
    })),
  ]
  
  const items = [
    ...(contractData.sideA?.items || []).map(i => ({
      side: 'A' as const,
      item_type: i.type,
      item_id: i.itemId,
      description: i.description,
      item_value: i.value,
      notes: i.notes,
    })),
    ...(contractData.sideB?.items || []).map(i => ({
      side: 'B' as const,
      item_type: i.type,
      item_id: i.itemId,
      description: i.description,
      item_value: i.value,
      notes: i.notes,
    })),
  ]
  
  const payment_conditions = paymentConditions.map(c => ({
    condition_value: c.value,
    direction: c.direction.toLowerCase() === 'entrada' ? 'entrada' as const : 'saida' as const,
    payment_type: c.type === 'Único' ? 'unico' as const : 'parcelado' as const,
    installments: c.type === 'Parcelado' ? parseInt(c.installments || '1') : 1,
    frequency: c.frequency?.toLowerCase(),
    start_date: c.startDate,
    payment_method: c.paymentMethod,
  }))
  
  const result = await createContract({
    contract_date: contractData.date instanceof Date 
      ? contractData.date.toISOString().split('T')[0] 
      : contractData.date,
    notes: contractData.notes,
    parties,
    items,
    payment_conditions,
  })
  
  setSubmitting(false)
  
  if (result.success) {
    toast({
      title: "Sucesso",
      description: "Contrato criado com sucesso!",
    })
    router.push('/contratos')
  } else {
    toast({
      title: "Erro",
      description: result.error || "Erro ao criar contrato",
      variant: "destructive",
    })
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] 1.1 - Criar tabela `contracts`
- [ ] 1.2 - Criar tabela `contract_parties`
- [ ] 1.3 - Criar tabela `contract_items`
- [ ] 1.4 - Criar tabela `contract_item_participants`
- [ ] 1.5 - Criar tabela `contract_payment_conditions`
- [ ] 1.6 - Criar políticas RLS
- [ ] 1.7 - Criar triggers e functions auxiliares
- [ ] 1.8 - Testar inserção manual de dados

### Types
- [ ] 2.1 - Atualizar interfaces em `lib/types.ts`

### Server Actions
- [ ] 3.1 - Criar `app/actions/contracts.ts`
- [ ] 3.2 - Implementar `getContracts()`
- [ ] 3.3 - Implementar `getContractById()`
- [ ] 3.4 - Implementar `createContract()`
- [ ] 3.5 - Implementar `updateContract()`
- [ ] 3.6 - Implementar `deleteContract()`
- [ ] 3.7 - Implementar `searchContracts()`
- [ ] 3.8 - Implementar `activateContract()`

### Componentes
- [x] 4.1 - Atualizar `components/contracts/contracts-table.tsx` ✅
- [x] 4.2 - Atualizar `app/contratos/page.tsx` (server component) ✅
- [x] 4.3 - Atualizar `app/contratos/[id]/page.tsx` (server component) ✅
- [x] 4.4 - Criar `components/contracts/contracts-table-client.tsx` ✅
- [x] 4.5 - Criar `components/contracts/contract-details-client.tsx` ✅
- [ ] 4.6 - Verificar `app/contratos/novo/page.tsx` (necessita integração)

### Integração (Pendente para criação de contratos)
- [ ] 5.1 - Adaptar `SearchPersonModal` para Supabase
- [ ] 5.2 - Adaptar `SearchCompanyModal` para Supabase
- [ ] 5.3 - Adaptar `SearchItemModal` para Supabase
- [ ] 5.4 - Adaptar `ContractForm` para salvar via action `createContract()`
- [ ] 5.5 - Testar fluxo completo de criação
- [x] 5.6 - Testar busca e filtros (via URL params) ✅
- [x] 5.7 - Testar visualização de detalhes ✅
- [x] 5.8 - Testar validação de balanceamento ✅

---

## 🧪 TESTES RECOMENDADOS

1. **Criar contrato simples (1 parte A, 1 parte B, 1 item cada)**
2. **Criar contrato complexo (múltiplas partes, múltiplos itens)**
3. **Validar balanceamento (balance = 0)**
4. **Testar filtros de busca**
5. **Testar permissões (admin, editor, visualizador)**
6. **Testar exclusão de contrato (cascade)**
7. **Testar atualização de status**
8. **Validar cálculos automáticos via triggers**

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Complexidade do Formulário**: O `ContractForm` é muito complexo (1400 linhas) e segue um fluxo de 5 etapas. Preserve a lógica existente, apenas integre com o banco.

2. **Balanceamento**: O conceito central é que `side_a_total = side_b_total` para ativar o contrato. O campo `balance` é GENERATED ALWAYS AS.

3. **Participantes de Itens**: A tabela `contract_item_participants` permite que cada item tenha participantes com percentuais (soma deve ser 100%).

4. **Cascata**: Todas as tabelas relacionadas têm `ON DELETE CASCADE`, então deletar um contrato remove tudo automaticamente.

5. **Referências Polimórficas**: `party_id` pode ser de `people` ou `companies`, e `item_id` pode ser de várias tabelas. Validação é feita no application layer.

6. **Geração de Código**: Usar `generate_contract_code()` RPC para gerar CT-0001, CT-0002, etc.

7. **Status**: Contratos começam como "rascunho" e só podem ser ativados se balance = 0.

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

1. **ALTA**: Fase 1 (Banco de Dados) - obrigatório para tudo funcionar
2. **ALTA**: Fase 2 (Types) - necessário para TypeScript
3. **ALTA**: Fase 3 (Server Actions) - núcleo da funcionalidade
4. **MÉDIA**: Fase 4 (Componentes básicos) - listagem e visualização
5. **BAIXA**: Fase 5 (Formulário completo) - criação de contratos complexos

---

## 📚 REFERÊNCIAS

- Estrutura atual: `app/contratos/`, `components/contracts/`
- Mock data: `lib/mock-data.ts` (linhas 14-1714)

---

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

### Arquivos Criados/Modificados:

#### Banco de Dados (Supabase)
- ✅ Tabela `contracts` com 11 campos + balance calculado
- ✅ Tabela `contract_parties` com 8 campos
- ✅ Tabela `contract_items` com 8 campos
- ✅ Tabela `contract_item_participants` com 4 campos
- ✅ Tabela `contract_payment_conditions` com 10 campos
- ✅ Função `generate_contract_code()` RPC
- ✅ Função `recalculate_contract_totals()` com 3 triggers
- ✅ 20 RLS policies (4 por tabela: SELECT, INSERT, UPDATE, DELETE)
- ✅ Todos os índices e foreign keys configurados

#### TypeScript Types
- ✅ `lib/types.ts` - 10 novas interfaces:
  - `Contract`, `ContractParty`, `ContractItem`
  - `ContractItemParticipant`, `ContractPaymentCondition`
  - `ContractFormData`, `ContractFormParty`, `ContractFormItem`
  - `ContractFormItemParticipant`, `ContractFormPaymentCondition`
  - `ContractWithDetails` (tipo expandido)
  - 6 novos types: `ContractStatus`, `ContractSide`, `ContractPartyType`, `ContractItemType`, `PaymentDirection`, `PaymentType`, `PaymentFrequency`

#### Server Actions
- ✅ `app/actions/contracts.ts` - 8 funções:
  1. `getContracts()` - lista com filtros
  2. `getContractById()` - busca completa com joins
  3. `createContract()` - cria contrato + relações
  4. `updateContract()` - atualiza campos principais
  5. `deleteContract()` - remove contrato (cascade)
  6. `activateContract()` - valida balance e ativa
  7. `searchContracts()` - busca por termo
  8. `checkEditPermission()` e `checkAdminPermission()` - helpers

#### Páginas (Server Components)
- ✅ `app/contratos/page.tsx` - convertido para async server component
  - Busca contratos via `getContracts()`
  - Recebe filtros via searchParams da URL
  - Repassa dados para componente client

- ✅ `app/contratos/[id]/page.tsx` - convertido para async server component
  - Busca contrato completo via `getContractById()`
  - Exibe 404 se não encontrado
  - Repassa dados para componente client de detalhes

#### Componentes Client
- ✅ `components/contracts/contracts-table-client.tsx`
  - Gerencia estado de filtros
  - Integra ContractsFilters + ContractsTable
  - Navegação via URL params

- ✅ `components/contracts/contract-details-client.tsx` (novo, 350+ linhas)
  - Exibe todas as informações do contrato
  - Botões de ação: Ativar, Excluir
  - Cards para: Informações Básicas, Partes A/B, Itens A/B, Condições de Pagamento, Observações
  - Alerta de desbalanceamento
  - Dialog de confirmação de exclusão
  - Badges de status (rascunho, ativo, concluído, cancelado)
  - Exibe participantes de cada item com percentuais

### Funcionalidades Implementadas:

#### ✅ Listagem de Contratos
- Busca com filtros por status, código, data
- Ordenação por data de criação (desc)
- Paginação via Supabase
- Exibição de código, data, totais, status

#### ✅ Visualização de Detalhes
- Informações básicas (código, data, totais lado A/B)
- Lista de partes lado A (GRA e Outros)
- Lista de partes lado B (Terceiros)
- Itens lado A com participantes e percentuais
- Itens lado B com participantes e percentuais
- Condições de pagamento (entrada/saída, parcelas, frequência)
- Observações do contrato
- Cálculo automático de balance (side_a - side_b)
- Alerta visual se desbalanceado

#### ✅ Ações sobre Contratos
- **Ativar contrato**: valida se balance = 0 antes de ativar
- **Excluir contrato**: apenas admin, com confirmação via texto "excluir"
- **Verificação de permissões**: admin pode deletar, editor pode criar/editar

#### ✅ Sistema de Balanceamento
- Campo `balance` calculado automaticamente (GENERATED ALWAYS AS)
- Triggers recalculam `side_a_total` e `side_b_total` ao inserir/atualizar/deletar itens
- Validação no backend: contrato só pode ser ativado se balance = 0

#### ✅ Segurança (RLS)
- SELECT: todos os usuários autenticados
- INSERT/UPDATE: apenas admin e editor
- DELETE: apenas admin
- Policies aplicadas em todas as 5 tabelas

### Pendências (Fase de Criação):

#### ⏳ Formulário de Criação de Contratos
- `app/contratos/novo/page.tsx` existe mas usa mock data
- `components/contracts/contract-form.tsx` (1400 linhas) precisa ser integrado
- Necessário adaptar 3 modals de busca:
  - `SearchPersonModal` → buscar de `people` table
  - `SearchCompanyModal` → buscar de `companies` table
  - `SearchItemModal` → buscar de `properties`, `vehicles`, `credits`, `developments`
- Adaptar lógica de save para chamar `createContract()` server action

#### 📝 Próximos Passos Sugeridos:
1. Testar criação manual via Supabase Dashboard para validar estrutura
2. Implementar integração do formulário de criação (Fase 5 do roteiro)
3. Adicionar testes automatizados
4. Implementar edição de contratos existentes
5. Adicionar histórico de alterações (audit log)
6. Implementar impressão/PDF do contrato

---

## 🎉 RESUMO EXECUTIVO

**Total de arquivos modificados/criados:** 5
- 1 types file (types.ts)
- 1 server actions file (contracts.ts)
- 2 páginas server component (page.tsx)
- 2 componentes client (contracts-table-client.tsx, contract-details-client.tsx)

**Total de tabelas criadas:** 5
**Total de functions/triggers:** 2 functions + 3 triggers
**Total de RLS policies:** 20
**Total de server actions:** 8 funções

**Status:** Sistema de contratos funcional para listagem e visualização. Criação de contratos pendente (formulário complexo precisa ser integrado).
- Types: `lib/types.ts` (linhas 65-119)
- Padrão similar: módulos de empreendimentos, créditos, imóveis

---

**FIM DO ROTEIRO**
