# 🗺️ ROTEIRO COMPLETO DE IMPLEMENTAÇÃO
## Sistema de Gestão Patrimonial GRA Empreendimentos

**Data de Análise:** 26 de novembro de 2025  
**Status do Sistema:** Em desenvolvimento (30% completo)

---

## 📊 VISÃO GERAL DO SISTEMA

### Arquitetura Atual
- **Framework:** Next.js 14 (App Router)
- **Banco de Dados:** Supabase PostgreSQL
- **Autenticação:** Supabase Auth com RLS
- **UI:** Shadcn/ui + Tailwind CSS
- **Validação:** Zod
- **State Management:** React Hooks (useState, useEffect)

### Módulos do Sistema
1. 🔐 **Autenticação & Usuários** - ✅ COMPLETO
2. 👥 **Cadastro de Pessoas** - ✅ COMPLETO
3. 🏢 **Cadastro de Empresas** - ✅ COMPLETO
4. 📄 **Contratos** - ⚠️ EM DESENVOLVIMENTO (apenas frontend mockado)
5. 🏠 **Banco de Dados de Ativos** - ⚠️ PARCIAL (apenas componentes UI)
6. 💰 **Financeiro** - ⚠️ PARCIAL (apenas componentes UI)
7. 📊 **Dashboard** - ⚠️ PARCIAL (apenas componentes UI)
8. 📈 **Relatórios** - ❌ NÃO INICIADO

---

## 🗄️ ESTADO ATUAL DO BANCO DE DADOS

### Tabelas Implementadas ✅

#### 1. `profiles` (Usuários)
```
Colunas: id, email, full_name, avatar_url, role, created_at, updated_at
Status: ✅ Completo com RLS, triggers e policies
Migrations: 13 aplicadas
Funcionalidades: CRUD completo, controle de permissões
```

#### 2. `people` (Pessoas Físicas)
```
Colunas: id, full_name, cpf, email, phone, mobile_phone, address (9 campos),
         birth_date, nationality, marital_status, profession, rg (3 campos),
         notes, status, created_by, created_at, updated_at
Status: ✅ Completo com RLS, triggers, validação CPF
Migrations: 4 aplicadas
Funcionalidades: CRUD completo, soft delete, validação matemática CPF
```

#### 3. `companies` (Empresas)
```
Colunas: id, trade_name, cnpj, gra_percentage, status, created_by, 
         created_at, updated_at
Status: ✅ Completo com RLS, triggers, validação CNPJ
Migrations: 3 aplicadas
Funcionalidades: CRUD completo, soft delete, validação matemática CNPJ
```

### Tabelas NÃO Implementadas ❌

#### 4. `properties` (Imóveis)
```sql
-- PRECISA SER CRIADA
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- IMV-0001, IMV-0002...
  identification TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('casa', 'apartamento', 'terreno', 'comercial')),
  area NUMERIC NOT NULL, -- m²
  registry TEXT NOT NULL, -- matrícula
  reference_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel' 
    CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências:**
- ✅ `auth.users` (profile do criador)
- ❌ Função de geração de código automático
- ❌ RLS policies
- ❌ Triggers de updated_at
- ❌ Índices de performance

#### 5. `vehicles` (Veículos)
```sql
-- PRECISA SER CRIADA
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- VEI-0001, VEI-0002...
  type TEXT NOT NULL CHECK (type IN ('carro', 'moto', 'caminhao', 'barco')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  chassis TEXT UNIQUE NOT NULL,
  reference_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências:**
- ✅ `auth.users`
- ❌ Função de geração de código automático
- ❌ RLS policies
- ❌ Triggers
- ❌ Validação de placa e chassi

#### 6. `credits` (Créditos)
```sql
-- PRECISA SER CRIADA
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- CRD-0001, CRD-0002...
  creditor TEXT NOT NULL,
  debtor TEXT NOT NULL,
  origin TEXT NOT NULL,
  nominal_value NUMERIC NOT NULL,
  saldo_gra NUMERIC NOT NULL, -- saldo atual
  interest_rate TEXT,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências:**
- ✅ `auth.users`
- ❌ Função de geração de código
- ❌ RLS policies
- ❌ Triggers
- ❌ Validação de valores

#### 7. `developments` (Empreendimentos)
```sql
-- PRECISA SER CRIADA
CREATE TABLE IF NOT EXISTS public.developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- EMP-0001, EMP-0002...
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('predio', 'loteamento', 'chacaramento')),
  location TEXT NOT NULL,
  participation_percentage NUMERIC NOT NULL 
    CHECK (participation_percentage >= 0 AND participation_percentage <= 100),
  units TEXT[], -- array de unidades
  reference_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'comprometido', 'vendido')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências:**
- ✅ `auth.users`
- ❌ Função de geração de código
- ❌ RLS policies
- ❌ Triggers

#### 8. `contracts` (Contratos) - COMPLEXO
```sql
-- PRECISA SER CRIADA - ESTRUTURA PRINCIPAL
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- CT-0001, CT-0002...
  contract_date DATE NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0, -- deve ser 0 para contratos válidos
  payment_installments INTEGER,
  payment_first_due_date DATE,
  payment_frequency TEXT CHECK (payment_frequency IN ('mensal', 'unico')),
  payment_method TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'cancelado', 'concluido')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA DE PARTES DO CONTRATO (Lado A e Lado B)
CREATE TABLE IF NOT EXISTS public.contract_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('A', 'B')),
  side_name TEXT NOT NULL, -- Nome do lado (ex: "Vendedores")
  person_id UUID REFERENCES public.people(id),
  company_id UUID REFERENCES public.companies(id),
  percentage NUMERIC NOT NULL DEFAULT 100 
    CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_person_or_company CHECK (
    (person_id IS NOT NULL AND company_id IS NULL) OR
    (person_id IS NULL AND company_id IS NOT NULL)
  )
);

-- TABELA DE ITENS DO CONTRATO
CREATE TABLE IF NOT EXISTS public.contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('A', 'B')),
  item_type TEXT NOT NULL 
    CHECK (item_type IN ('imovel', 'veiculo', 'credito', 'empreendimento', 'dinheiro')),
  property_id UUID REFERENCES public.properties(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  credit_id UUID REFERENCES public.credits(id),
  development_id UUID REFERENCES public.developments(id),
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_item_reference CHECK (
    (item_type = 'dinheiro') OR
    (item_type = 'imovel' AND property_id IS NOT NULL) OR
    (item_type = 'veiculo' AND vehicle_id IS NOT NULL) OR
    (item_type = 'credito' AND credit_id IS NOT NULL) OR
    (item_type = 'empreendimento' AND development_id IS NOT NULL)
  )
);

-- TABELA DE PARTICIPAÇÃO EM ITENS
CREATE TABLE IF NOT EXISTS public.contract_item_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.contract_items(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES public.contract_parties(id) ON DELETE CASCADE,
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, party_id)
);

-- HISTÓRICO DO CONTRATO
CREATE TABLE IF NOT EXISTS public.contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências CRÍTICAS:**
- ✅ `auth.users`
- ✅ `people`
- ✅ `companies`
- ❌ `properties` (deve ser criado ANTES)
- ❌ `vehicles` (deve ser criado ANTES)
- ❌ `credits` (deve ser criado ANTES)
- ❌ `developments` (deve ser criado ANTES)
- ❌ Validação de balanceamento (Lado A = Lado B)
- ❌ Triggers complexos
- ❌ RLS policies avançadas

#### 9. Módulo Financeiro (3 tabelas)

```sql
-- CONTAS A RECEBER
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- REC-0001
  contract_id UUID REFERENCES public.contracts(id),
  description TEXT NOT NULL,
  counterparty TEXT NOT NULL, -- nome da contraparte
  value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_aberto'
    CHECK (status IN ('em_aberto', 'vencido', 'quitado', 'parcialmente_quitado')),
  paid_value NUMERIC DEFAULT 0,
  paid_date DATE,
  installment_current INTEGER,
  installment_total INTEGER,
  vinculo TEXT NOT NULL, -- categoria
  centro_custo TEXT NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS public.accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- PAG-0001
  contract_id UUID REFERENCES public.contracts(id),
  description TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_aberto'
    CHECK (status IN ('em_aberto', 'vencido', 'quitado', 'parcialmente_quitado')),
  paid_value NUMERIC DEFAULT 0,
  paid_date DATE,
  installment_current INTEGER,
  installment_total INTEGER,
  vinculo TEXT NOT NULL,
  centro_custo TEXT NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MOVIMENTAÇÕES DE CAIXA
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  description TEXT NOT NULL,
  vinculo TEXT NOT NULL,
  forma TEXT NOT NULL CHECK (forma IN ('Caixa', 'Permuta')),
  centro_custo TEXT NOT NULL,
  value NUMERIC NOT NULL,
  account_receivable_id UUID REFERENCES public.accounts_receivable(id),
  account_payable_id UUID REFERENCES public.accounts_payable(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONTAS BANCÁRIAS (para caixa do dia)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banco', 'especie', 'poupanca', 'investimento')),
  balance NUMERIC NOT NULL DEFAULT 0,
  code TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Dependências:**
- ✅ `auth.users`
- ❌ `contracts` (opcional mas recomendado)
- ❌ Função de cálculo de status (vencido)
- ❌ Função de geração de código
- ❌ Triggers de atualização de status
- ❌ RLS policies

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### **FASE 1: Banco de Dados de Ativos** (PRIORIDADE ALTA)
*Deve ser feito ANTES de Contratos*

#### 1.1 Imóveis (Estimativa: 2 dias)
**Dependências:** ✅ Nenhuma (pode iniciar)

**Tarefas:**
- [ ] **Dia 1 - Manhã:** Criar migrations para tabela `properties`
  - Migration de criação de tabela
  - Migration de RLS policies
  - Migration de triggers (updated_at)
  - Migration de função de código automático (IMV-XXXX)
  - Migration de índices

- [ ] **Dia 1 - Tarde:** Implementar backend
  - Criar `app/actions/properties.ts`
  - Implementar createProperty()
  - Implementar getProperties()
  - Implementar updateProperty()
  - Implementar deleteProperty() - soft delete
  - Implementar getUserPermissions()

- [ ] **Dia 2 - Manhã:** Implementar componentes frontend
  - Atualizar `property-create-modal.tsx` para usar actions reais
  - Criar `property-edit-modal.tsx`
  - Criar `delete-property-modal.tsx`
  - Atualizar `properties-table.tsx` para usar dados reais

- [ ] **Dia 2 - Tarde:** Integrar e testar
  - Atualizar `app/banco-dados/imoveis/page.tsx`
  - Adicionar real-time (refreshKey pattern)
  - Testar CRUD completo
  - Testar permissões

**Arquivos a criar/modificar:**
```
supabase/migrations/
  └── [timestamp]_create_properties_table.sql
  └── [timestamp]_create_properties_rls_policies.sql
  └── [timestamp]_create_properties_triggers.sql
  └── [timestamp]_create_properties_code_function.sql
app/actions/
  └── properties.ts (CRIAR)
components/database/
  └── property-create-modal.tsx (ATUALIZAR)
  └── property-edit-modal.tsx (CRIAR)
  └── delete-property-modal.tsx (CRIAR)
  └── properties-table.tsx (ATUALIZAR)
app/banco-dados/imoveis/
  └── page.tsx (ATUALIZAR)
```

#### 1.2 Veículos (Estimativa: 1.5 dias)
**Dependências:** ❌ Imóveis deve estar completo (para seguir padrão)

**Tarefas:**
- [ ] **Manhã:** Migrations (copiar padrão de Imóveis)
- [ ] **Tarde:** Backend actions (copiar padrão)
- [ ] **Dia 2 - Manhã:** Frontend (copiar padrão)
- [ ] **Dia 2 - Tarde:** Testes

**Arquivos:** (mesmo padrão de Imóveis, substituir "property" por "vehicle")

#### 1.3 Créditos (Estimativa: 2 dias)
**Dependências:** ❌ Veículos completo

**Diferenças:** Lógica adicional de saldo GRA, datas de início/vencimento

#### 1.4 Empreendimentos (Estimativa: 2 dias)
**Dependências:** ❌ Créditos completo

**Diferenças:** Campo de array (units[]), percentual de participação

---

### **FASE 2: Sistema de Contratos** (PRIORIDADE ALTA)
*Módulo mais complexo - requer todos os ativos prontos*

**Estimativa Total:** 8-10 dias

**Dependências CRÍTICAS:**
- ✅ `people` (completo)
- ✅ `companies` (completo)
- ❌ `properties` (FASE 1.1)
- ❌ `vehicles` (FASE 1.2)
- ❌ `credits` (FASE 1.3)
- ❌ `developments` (FASE 1.4)

#### 2.1 Estrutura do Banco (2 dias)
- [ ] **Dia 1:** Criar 6 migrations
  - `contracts` (tabela principal)
  - `contract_parties` (partes A e B)
  - `contract_items` (itens do contrato)
  - `contract_item_participants` (participação em itens)
  - `contract_history` (histórico)
  - Função de geração de código CT-XXXX

- [ ] **Dia 2:** RLS, Triggers e Validações
  - RLS policies para todas as 5 tabelas
  - Triggers de updated_at
  - Trigger de registro no histórico
  - **CRÍTICO:** Função de validação de balanceamento (Lado A = Lado B)

#### 2.2 Backend Actions (3 dias)
- [ ] **Dia 1:** Actions básicas
  - `app/actions/contracts.ts`
  - createContract() - lógica complexa de inserção em 4 tabelas
  - getContracts() - joins complexos
  - getContractById() - join completo com todas as tabelas

- [ ] **Dia 2:** Actions de edição
  - updateContract() - atualizar múltiplas tabelas
  - addParty() - adicionar parte ao contrato
  - removeParty() - remover parte
  - addItem() - adicionar item
  - removeItem() - remover item

- [ ] **Dia 3:** Validações e helpers
  - validateBalance() - garantir equilíbrio
  - calculateSideValue() - calcular valor de cada lado
  - validateParticipations() - somar 100%
  - getUserPermissions()

#### 2.3 Frontend - Criação de Contrato (3 dias)
**Arquivo principal:** `app/contratos/novo/page.tsx`

- [ ] **Dia 1:** Formulário de cabeçalho
  - Código automático (CT-XXXX)
  - Data do contrato
  - Condições de pagamento
  - Observações

- [ ] **Dia 2:** Lado A e Lado B
  - Modal de busca de pessoas (integrar com `people`)
  - Modal de busca de empresas (integrar com `companies`)
  - Adicionar/remover partes
  - Definir nome do lado (Vendedores/Compradores)

- [ ] **Dia 3:** Gestão de Itens
  - Modal de busca de ativos (properties, vehicles, credits, developments)
  - Modal de item "Dinheiro"
  - Distribuição de percentuais entre partes
  - **CRÍTICO:** Validação em tempo real de balanceamento
  - Display de valores: Lado A vs Lado B (deve ser igual)

#### 2.4 Frontend - Listagem e Detalhes (2 dias)
- [ ] **Dia 1:** Listagem
  - Atualizar `app/contratos/page.tsx` para usar dados reais
  - Implementar filtros funcionais
  - Tabela com dados reais
  - Ações (visualizar, editar, cancelar)

- [ ] **Dia 2:** Página de detalhes
  - `app/contratos/[id]/page.tsx`
  - Visualização completa do contrato
  - Histórico de alterações
  - Ações contextuais

---

### **FASE 3: Sistema Financeiro** (PRIORIDADE MÉDIA)

**Estimativa Total:** 6 dias

**Dependências:**
- ❌ Contratos (opcional mas recomendado para vincular contas)

#### 3.1 Contas a Receber (2 dias)
- [ ] **Dia 1:** Banco + Backend
  - Migrations (tabela, RLS, triggers, código REC-XXXX)
  - `app/actions/accounts-receivable.ts`
  - CRUD completo
  - Função de recebimento (parcial e total)
  - Trigger automático de status "vencido"

- [ ] **Dia 2:** Frontend
  - Atualizar `app/financeiro/contas-receber/page.tsx`
  - Integrar componentes com dados reais
  - Modal de recebimento
  - Modal de recebimento parcial
  - Filtros funcionais

#### 3.2 Contas a Pagar (2 dias)
**Padrão idêntico a Contas a Receber**
- Código PAG-XXXX
- Mesmo fluxo de trabalho

#### 3.3 Caixa (2 dias)
- [ ] **Dia 1:** Banco + Backend
  - Migrations (cash_transactions, bank_accounts)
  - `app/actions/cash.ts`
  - Registrar entrada/saída
  - Vincular com contas a receber/pagar
  - Calcular saldos

- [ ] **Dia 2:** Frontend
  - Atualizar `app/financeiro/caixa/page.tsx`
  - Caixa do dia (`app/financeiro/caixa/dia/page.tsx`)
  - Fechamento de caixa (`app/financeiro/caixa/fechamento/page.tsx`)

---

### **FASE 4: Dashboard Funcional** (PRIORIDADE MÉDIA)

**Estimativa:** 3 dias

**Dependências:**
- ❌ Contratos
- ❌ Contas a Receber/Pagar
- ❌ Caixa

#### 4.1 Implementar Dashboard (3 dias)
- [ ] **Dia 1:** Backend de agregações
  - `app/actions/dashboard.ts`
  - Calcular KPIs
  - Calcular resumos financeiros
  - Buscar movimentações recentes

- [ ] **Dia 2:** Atualizar componentes
  - `components/dashboard/kpi-cards.tsx`
  - `components/dashboard/financial-summary-cards.tsx`
  - `components/dashboard/today-movements-cards.tsx`
  - `components/dashboard/cash-summary-card.tsx`

- [ ] **Dia 3:** Integrações e gráficos
  - `components/dashboard/contract-timeline.tsx`
  - `components/dashboard/accounts-payable-today.tsx`
  - Testar carregamento de dados reais

---

### **FASE 5: Sistema de Relatórios** (PRIORIDADE BAIXA)

**Estimativa:** 4 dias

**Dependências:**
- ❌ Todos os módulos anteriores

#### 5.1 Estrutura de Relatórios (4 dias)
- [ ] **Dia 1:** Backend de queries
  - `app/actions/reports.ts`
  - Fluxo de caixa previsto vs realizado
  - Relatório de contratos
  - Relatório de ativos

- [ ] **Dia 2:** Frontend - Filtros
  - `app/relatorios/page.tsx`
  - Sistema de filtros por período
  - Filtros por tipo de contrato/ativo

- [ ] **Dia 3:** Frontend - Visualização
  - Tabelas de dados
  - Gráficos (usar recharts ou similar)
  - Totalizadores

- [ ] **Dia 4:** Exportação
  - Exportar para PDF
  - Exportar para Excel
  - Impressão

---

## 📋 CHECKLIST DE PENDÊNCIAS POR MÓDULO

### ✅ **Autenticação & Usuários** (100% completo)
- [x] Banco de dados (`profiles`)
- [x] RLS policies
- [x] Triggers
- [x] Backend actions (`app/actions/users.ts`)
- [x] Página de listagem (`app/configuracoes/usuarios/page.tsx`)
- [x] CRUD completo (create, edit, delete)
- [x] Controle de permissões (admin/editor/visualizador)
- [x] Página "Minha Conta" (visualização básica)

**Melhorias futuras:**
- [ ] Upload de avatar
- [ ] Edição de nome na página Minha Conta
- [ ] Alteração de senha

---

### ✅ **Cadastro de Pessoas** (100% completo)
- [x] Tabela `people` com 24 campos
- [x] RLS policies (4 policies)
- [x] Triggers (updated_at, validação)
- [x] Backend actions completo
- [x] Validação matemática de CPF
- [x] CRUD completo com 3 modais
- [x] Soft delete (status: ativo/inativo)
- [x] Real-time (refreshKey pattern)
- [x] Controle de permissões

---

### ✅ **Cadastro de Empresas** (100% completo)
- [x] Tabela `companies` com 8 campos
- [x] RLS policies (3 policies)
- [x] Triggers (updated_at)
- [x] Backend actions completo
- [x] Validação matemática de CNPJ
- [x] CRUD completo com 3 modais
- [x] Soft delete (status: ativo/inativo)
- [x] Real-time (refreshKey pattern)
- [x] Controle de permissões
- [x] Formatação brasileira (% GRA com vírgula)

---

### ❌ **Imóveis** (0% implementado)
- [ ] Tabela `properties` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (IMV-XXXX)
- [ ] Backend actions (`app/actions/properties.ts` não existe)
- [ ] Frontend integrado (atualmente usa mockData)
- [ ] CRUD funcional

**Status:** Apenas componentes UI criados, sem conexão com banco

---

### ❌ **Veículos** (0% implementado)
- [ ] Tabela `vehicles` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (VEI-XXXX)
- [ ] Backend actions (`app/actions/vehicles.ts` não existe)
- [ ] Frontend integrado (usa mockData)
- [ ] CRUD funcional

**Status:** Apenas componentes UI criados

---

### ❌ **Créditos** (0% implementado)
- [ ] Tabela `credits` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (CRD-XXXX)
- [ ] Backend actions (`app/actions/credits.ts` não existe)
- [ ] Frontend integrado (usa mockData)
- [ ] Lógica de saldo GRA

**Status:** Apenas componentes UI criados

---

### ❌ **Empreendimentos** (0% implementado)
- [ ] Tabela `developments` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (EMP-XXXX)
- [ ] Backend actions (`app/actions/developments.ts` não existe)
- [ ] Frontend integrado (usa mockData)
- [ ] Lógica de unidades (array)

**Status:** Apenas componentes UI criados

---

### ❌ **Contratos** (10% implementado)
- [ ] Tabela `contracts` (não existe)
- [ ] Tabelas relacionadas (parties, items, participants, history)
- [ ] RLS policies complexas
- [ ] Triggers
- [ ] Função de validação de balanceamento
- [ ] Backend actions (`app/actions/contracts.ts` não existe)
- [ ] Lógica de criação multi-tabela
- [x] Frontend UI básico (mockado)
- [ ] Integração com pessoas/empresas
- [ ] Integração com ativos
- [ ] Sistema de histórico

**Status:** Apenas UI mockada, backend não implementado  
**Bloqueado por:** Falta de tabelas de ativos (properties, vehicles, etc)

---

### ❌ **Contas a Receber** (5% implementado)
- [ ] Tabela `accounts_receivable` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (REC-XXXX)
- [ ] Trigger de status vencido
- [ ] Backend actions (`app/actions/accounts-receivable.ts` não existe)
- [ ] Lógica de recebimento parcial
- [x] Frontend UI básico (mockado)
- [ ] Integração com contratos
- [ ] Integração com caixa

**Status:** Apenas UI mockada com filtros

---

### ❌ **Contas a Pagar** (5% implementado)
- [ ] Tabela `accounts_payable` (não existe)
- [ ] RLS policies
- [ ] Triggers
- [ ] Função de código automático (PAG-XXXX)
- [ ] Trigger de status vencido
- [ ] Backend actions (`app/actions/accounts-payable.ts` não existe)
- [ ] Lógica de pagamento parcial
- [x] Frontend UI básico (mockado)
- [ ] Integração com contratos
- [ ] Integração com caixa

**Status:** Apenas UI mockada

---

### ❌ **Caixa** (5% implementado)
- [ ] Tabela `cash_transactions` (não existe)
- [ ] Tabela `bank_accounts` (não existe)
- [ ] RLS policies
- [ ] Backend actions (`app/actions/cash.ts` não existe)
- [ ] Lógica de entrada/saída
- [ ] Cálculo de saldos
- [x] Frontend UI básico (mockado)
- [ ] Caixa do dia
- [ ] Fechamento de caixa
- [ ] Integração com contas a receber/pagar

**Status:** Apenas UI mockada

---

### ❌ **Dashboard** (10% implementado)
- [ ] Backend de agregações (`app/actions/dashboard.ts` não existe)
- [ ] Queries de KPIs
- [ ] Queries de resumos financeiros
- [x] Componentes UI criados (mockados)
- [ ] Integração com dados reais
- [ ] Atualização em tempo real

**Status:** Componentes criados mas usando mockData

---

### ❌ **Relatórios** (0% implementado)
- [ ] Backend de queries (`app/actions/reports.ts` não existe)
- [ ] Sistema de filtros
- [ ] Relatório de fluxo de caixa
- [ ] Relatório de contratos
- [ ] Relatório de ativos
- [ ] Exportação PDF
- [ ] Exportação Excel
- [ ] Página de relatórios (`app/relatorios/page.tsx` está vazia)

**Status:** Não iniciado

---

## 📊 DIAGRAMA DE DEPENDÊNCIAS

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1 - BASE (✅ COMPLETO)                              │
│  - Autenticação (profiles)                                   │
│  - Pessoas (people)                                          │
│  - Empresas (companies)                                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 2 - ATIVOS (❌ PENDENTE - INICIAR AQUI)            │
│  - Imóveis (properties)          ← COMEÇAR AQUI             │
│  - Veículos (vehicles)           ← DEPOIS DE IMÓVEIS        │
│  - Créditos (credits)            ← DEPOIS DE VEÍCULOS       │
│  - Empreendimentos (developments) ← DEPOIS DE CRÉDITOS      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 3 - CONTRATOS (❌ BLOQUEADO)                        │
│  Depende de: pessoas + empresas + TODOS os ativos           │
│  - Tabelas complexas (5 tabelas)                            │
│  - Lógica de balanceamento                                  │
│  - Histórico                                                 │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 4 - FINANCEIRO (❌ BLOQUEADO)                       │
│  Depende de: contratos (opcional)                           │
│  - Contas a Receber                                         │
│  - Contas a Pagar                                           │
│  - Caixa                                                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 5 - ANALYTICS (❌ BLOQUEADO)                        │
│  Depende de: todos os módulos acima                         │
│  - Dashboard funcional                                       │
│  - Relatórios                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ ESTIMATIVA DE TEMPO TOTAL

| Fase | Módulo | Dias | Status |
|------|--------|------|--------|
| 1.1 | Imóveis | 2 | ❌ Pendente |
| 1.2 | Veículos | 1.5 | ❌ Pendente |
| 1.3 | Créditos | 2 | ❌ Pendente |
| 1.4 | Empreendimentos | 2 | ❌ Pendente |
| **SUBTOTAL FASE 1** | **Ativos** | **7.5** | ❌ |
| 2.1 | Estrutura Contratos | 2 | ❌ Pendente |
| 2.2 | Backend Contratos | 3 | ❌ Pendente |
| 2.3 | Frontend Criação | 3 | ❌ Pendente |
| 2.4 | Frontend Listagem | 2 | ❌ Pendente |
| **SUBTOTAL FASE 2** | **Contratos** | **10** | ❌ |
| 3.1 | Contas a Receber | 2 | ❌ Pendente |
| 3.2 | Contas a Pagar | 2 | ❌ Pendente |
| 3.3 | Caixa | 2 | ❌ Pendente |
| **SUBTOTAL FASE 3** | **Financeiro** | **6** | ❌ |
| 4.1 | Dashboard | 3 | ❌ Pendente |
| **SUBTOTAL FASE 4** | **Dashboard** | **3** | ❌ |
| 5.1 | Relatórios | 4 | ❌ Pendente |
| **SUBTOTAL FASE 5** | **Relatórios** | **4** | ❌ |
| | | | |
| **TOTAL GERAL** | | **30.5 dias** | **❌** |

**Estimativa:** ~6 semanas de trabalho (considerando 5 dias úteis/semana)

---

## 🚀 RECOMENDAÇÃO DE INÍCIO IMEDIATO

### **PRÓXIMA AÇÃO: Implementar Módulo de Imóveis**

**Por quê começar por Imóveis?**
1. ✅ Sem dependências (pode iniciar imediatamente)
2. ✅ Estabelece padrão para Veículos, Créditos e Empreendimentos
3. ✅ Desbloqueia o módulo de Contratos (dependência crítica)
4. ✅ Tem componentes UI já criados (apenas integrar)

**Comando para iniciar:**
```bash
# Criar arquivo de migration
supabase migration new create_properties_table
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Pontos de Atenção

1. **Validação de Balanceamento em Contratos**
   - Lado A deve SEMPRE ser igual ao Lado B
   - Implementar validação em tempo real no frontend
   - Trigger no banco para garantir integridade

2. **Soft Delete em TODOS os módulos**
   - Usar campo `status` em vez de DELETE
   - Manter histórico de dados
   - Permitir reativação futura

3. **Geração de Códigos Automáticos**
   - Implementar função reutilizável no banco
   - Formato: PREFIXO-XXXX (CT-0001, IMV-0001, etc)
   - Usar sequences do PostgreSQL

4. **Real-time Updates**
   - Usar pattern `refreshKey` em todas as páginas
   - Incrementar após ações bem-sucedidas
   - Garantir UX responsiva

5. **Controle de Permissões**
   - Admin: pode tudo
   - Editor: CRUD mas não pode deletar
   - Visualizador: somente leitura
   - Implementar em TODAS as actions

### 🔒 Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Policies baseadas em roles
- ✅ Validação no backend (nunca confiar apenas no frontend)
- ✅ SECURITY DEFINER em funções sensíveis
- ✅ search_path configurado para evitar SQL injection

### 📚 Padrões de Código

**Migrations:**
```sql
-- Sempre incluir:
-- 1. Comentários nas colunas
-- 2. Constraints check
-- 3. Foreign keys
-- 4. Defaults apropriados
-- 5. Campos created_at e updated_at
```

**Server Actions:**
```typescript
// Sempre incluir:
// 1. Validação com Zod
// 2. Verificação de autenticação
// 3. Verificação de permissões
// 4. Tratamento de erros
// 5. revalidatePath após mutações
```

**Frontend:**
```typescript
// Sempre incluir:
// 1. Loading states
// 2. Error handling
// 3. Success feedback (toast)
// 4. Validação em tempo real
// 5. Desabilitar botões durante submissão
```

---

## 📧 CONTATO E SUPORTE

**Projeto:** Sistema de Gestão Patrimonial GRA Empreendimentos  
**Tecnologias:** Next.js 14 + Supabase + TypeScript  
**Documentação Atualizada:** 26 de novembro de 2025

---

**FIM DO ROTEIRO**
