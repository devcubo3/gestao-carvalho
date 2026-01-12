# 📋 Roteiro de Implementação - Página Início

**Data de Análise:** 11 de janeiro de 2026  
**Responsável:** QA Agent  
**Status:** Pronto para Desenvolvimento

---

## 🎯 Objetivo

Transformar a página inicial (Dashboard) de um sistema com dados mockados para um sistema 100% funcional conectado ao banco de dados Supabase, exibindo informações reais e atualizadas do sistema de gestão de patrimônio.

---

## 📊 Análise do Estado Atual

### ✅ Componentes Já Implementados
- ✅ Layout da página (`app/page.tsx`)
- ✅ Componentes visuais do dashboard:
  - `MonthlyKPICards` - Cards de KPIs mensais
  - `TodayMovementsCards` - Cards de movimentações de hoje
  - `QuickActions` - Ações rápidas
  - `ContractTimeline` - Timeline de contratos
  - `RecentAdditions` - Adições recentes

### ❌ Problemas Identificados

1. **Dados Mockados**: Todas as informações vêm de `lib/mock-data.ts`
2. **Sem Conexão com Supabase**: Nenhuma consulta real ao banco de dados
3. **Dados Desatualizados**: Informações não refletem o estado real do sistema
4. **Componentes Hardcoded**: `RecentAdditions` tem dados fixos em vez de consultar o banco

### 📦 Banco de Dados Disponível

**Tabelas Relevantes:**
- `contracts` - Contratos (0 registros)
- `accounts_receivable` - Contas a receber (0 registros)
- `accounts_payable` - Contas a pagar (0 registros)
- `cash_transactions` - Transações de caixa (0 registros)
- `bank_accounts` - Contas bancárias (2 registros, saldo total: R$ 222.830,66)
- `properties` - Imóveis (1 registro)
- `vehicles` - Veículos (0 registros)
- `credits` - Créditos (0 registros)
- `developments` - Empreendimentos (0 registros)
- `people` - Pessoas (0 registros)
- `companies` - Empresas (0 registros)

---

## 🏗️ Estrutura de Implementação

### Fase 1: Criar Server Actions para Buscar Dados Reais

**Arquivo:** `app/actions/dashboard.ts` (NOVO)

#### 1.1 - Action: getMonthlyKPIs
```typescript
/**
 * Busca KPIs mensais do banco de dados
 * - Valor a pagar no mês
 * - Valor a receber no mês
 * - Saldo financeiro no mês
 * - Novos contratos no mês
 */
export async function getMonthlyKPIs(): Promise<MonthlyKPIs>
```

**Query SQL necessária:**
```sql
-- Valor a pagar no mês (contas_pagar)
SELECT SUM(remaining_value) 
FROM accounts_payable 
WHERE EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND status IN ('em_aberto', 'vencido', 'parcialmente_pago')

-- Valor a receber no mês (contas_receber)
SELECT SUM(remaining_value) 
FROM accounts_receivable 
WHERE EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND status IN ('em_aberto', 'vencido', 'parcialmente_pago')

-- Novos contratos no mês
SELECT COUNT(*) 
FROM contracts 
WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
```

#### 1.2 - Action: getTodayMovements
```typescript
/**
 * Busca movimentações de hoje
 * - Contas a pagar vencendo hoje
 * - Contas a receber vencendo hoje
 * - Lista detalhada das 5 principais de cada
 */
export async function getTodayMovements(): Promise<TodayMovements>
```

**Query SQL necessária:**
```sql
-- Contas a pagar hoje
SELECT 
  id, code, description, remaining_value, 
  vinculo, centro_custo, due_date
FROM accounts_payable 
WHERE due_date = CURRENT_DATE
  AND status IN ('em_aberto', 'vencido')
ORDER BY remaining_value DESC
LIMIT 5

-- Contas a receber hoje
SELECT 
  id, code, description, remaining_value, 
  counterparty, due_date
FROM accounts_receivable 
WHERE due_date = CURRENT_DATE
  AND status IN ('em_aberto', 'vencido')
ORDER BY remaining_value DESC
LIMIT 5
```

#### 1.3 - Action: getRecentContracts
```typescript
/**
 * Busca os 5 contratos mais recentes com suas partes
 */
export async function getRecentContracts(): Promise<Contract[]>
```

**Query SQL necessária:**
```sql
SELECT 
  c.id, c.code, c.contract_date, c.status,
  c.side_a_total, c.side_b_total, c.balance,
  c.created_at, c.updated_at
FROM contracts c
ORDER BY c.updated_at DESC
LIMIT 5
```

**Importante:** Precisará fazer join ou query separada para buscar as partes:
```sql
SELECT 
  cp.id, cp.side, cp.party_name, cp.party_document
FROM contract_parties cp
WHERE cp.contract_id = $1
ORDER BY cp.side, cp.created_at
```

#### 1.4 - Action: getRecentAdditions
```typescript
/**
 * Busca adições recentes de imóveis, veículos, créditos e empreendimentos
 * Retorna os 5 mais recentes de cada categoria
 */
export async function getRecentAdditions(): Promise<RecentAddition[]>
```

**Query SQL necessária:**
```sql
-- Imóveis recentes
SELECT 
  id, code, identification as name, 
  sale_value as value, created_at,
  'imovel' as type
FROM properties
ORDER BY created_at DESC
LIMIT 5

-- Veículos recentes
SELECT 
  id, code, 
  CONCAT(brand, ' ', model, ' - ', plate) as name, 
  reference_value as value, created_at,
  'veiculo' as type
FROM vehicles
ORDER BY created_at DESC
LIMIT 5

-- Créditos recentes
SELECT 
  id, code, 
  CONCAT('Crédito - ', origin) as name, 
  current_balance as value, created_at,
  'credito' as type
FROM credits
ORDER BY created_at DESC
LIMIT 5

-- Empreendimentos recentes
SELECT 
  id, code, name, 
  reference_value as value, created_at,
  'empreendimento' as type
FROM developments
ORDER BY created_at DESC
LIMIT 5

-- Combinar todos e pegar os 5 mais recentes
```

#### 1.5 - Action: getBankAccountsSummary
```typescript
/**
 * Busca resumo das contas bancárias
 * - Total de contas ativas
 * - Saldo total consolidado
 */
export async function getBankAccountsSummary(): Promise<BankSummary>
```

**Query SQL necessária:**
```sql
SELECT 
  COUNT(*) as total_accounts,
  SUM(balance) as total_balance
FROM bank_accounts
WHERE status = 'ativo'
```

---

### Fase 2: Atualizar Tipos TypeScript

**Arquivo:** `lib/types.ts`

#### 2.1 - Adicionar/Atualizar Tipos

```typescript
// KPIs Mensais
export interface MonthlyKPIs {
  monthlyPayables: number      // Valor a pagar no mês
  monthlyReceivables: number   // Valor a receber no mês
  monthlyBalance: number       // Saldo (receivables - payables)
  newContractsThisMonth: number // Quantidade de contratos novos
}

// Movimentações de Hoje
export interface TodayMovements {
  todayPayables: number
  todayReceivables: number
  todayPayablesCount: number
  todayReceivablesCount: number
}

// Item de movimentação
export interface MovementItem {
  id: string
  code: string
  description: string
  value: number              // remaining_value
  counterparty?: string      // Para contas a receber
  vinculo?: string          // Para contas a pagar
  centro_custo?: string     // Para contas a pagar
  dueDate: string
}

// Lista de movimentações
export interface TodayMovementsList {
  todayPayablesList: MovementItem[]
  todayReceivablesList: MovementItem[]
}

// Adições Recentes
export interface RecentAddition {
  id: string
  code: string
  type: 'imovel' | 'veiculo' | 'credito' | 'empreendimento'
  name: string
  value: number
  date: Date
}

// Resumo Bancário
export interface BankSummary {
  totalAccounts: number
  totalBalance: number
}

// Contrato (simplificado para dashboard)
export interface DashboardContract {
  id: string
  code: string
  contractDate: string
  status: string
  sideATotal: number
  sideBTotal: number
  balance: number
  parties: {
    sideA: Array<{ name: string; document: string }>
    sideB: Array<{ name: string; document: string }>
  }
  updatedAt: string
}
```

---

### Fase 3: Atualizar lib/dashboard-data.ts

**Ação:** Substituir funções mockadas por chamadas aos server actions

#### 3.1 - Remover Dependências de Mock

```typescript
// REMOVER imports de mock-data
// import { mockContracts, mockAccountsReceivable, ... } from "./mock-data"

// ADICIONAR imports dos server actions
import { 
  getMonthlyKPIs, 
  getTodayMovements,
  getRecentContracts,
  getRecentAdditions,
  getBankAccountsSummary
} from "@/app/actions/dashboard"
```

#### 3.2 - Tornar Funções Assíncronas

```typescript
// ANTES
export function getMonthlyKPIs(): MonthlyKPIs {
  // código com dados mockados
}

// DEPOIS
export async function fetchMonthlyKPIs(): Promise<MonthlyKPIs> {
  const data = await getMonthlyKPIs()
  return data
}
```

**Nota:** Renomear as funções para `fetch*` para deixar claro que são assíncronas.

---

### Fase 4: Atualizar Componentes do Dashboard

#### 4.1 - Atualizar `app/page.tsx`

**Mudanças:**
1. Converter para `async function`
2. Usar `await` para buscar dados
3. Passar dados reais para componentes

```typescript
// ANTES
export default function HomePage() {
  const monthlyKPIs = getMonthlyKPIs()
  const todayMovements = getTodayMovements()
  const todayMovementsList = getTodayMovementsList()
  
  return (
    <MainLayout breadcrumbs={[{ label: "Início" }]}>
      {/* ... */}
    </MainLayout>
  )
}

// DEPOIS
export default async function HomePage() {
  // Buscar dados do banco
  const monthlyKPIs = await getMonthlyKPIs()
  const todayData = await getTodayMovements()
  const recentContracts = await getRecentContracts()
  const recentAdditions = await getRecentAdditions()
  const bankSummary = await getBankAccountsSummary()
  
  return (
    <MainLayout breadcrumbs={[{ label: "Início" }]}>
      {/* Seção: Resumo Bancário - NOVO */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumo Bancário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Contas Bancárias</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(bankSummary.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {bankSummary.totalAccounts} {bankSummary.totalAccounts === 1 ? 'conta ativa' : 'contas ativas'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Resto do código... */}
    </MainLayout>
  )
}
```

#### 4.2 - Atualizar `components/dashboard/today-movements-cards.tsx`

**Mudanças:**
1. Ajustar interface `MovementItem` para incluir `code`
2. Exibir código da conta no card
3. Usar `counterparty` ou `vinculo/centro_custo` dependendo do tipo

```typescript
// No item de conta a pagar:
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2">
    <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
  </div>
  <p className="text-sm font-medium truncate">{item.description}</p>
  <p className="text-xs text-muted-foreground">
    {item.vinculo} • {item.centro_custo}
  </p>
</div>

// No item de conta a receber:
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2">
    <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
  </div>
  <p className="text-sm font-medium truncate">{item.description}</p>
  <p className="text-xs text-muted-foreground">{item.counterparty}</p>
</div>
```

#### 4.3 - Atualizar `components/dashboard/contract-timeline.tsx`

**Mudanças:**
1. Ajustar interface para `DashboardContract`
2. Exibir partes corretamente do novo formato
3. Tratar caso sem partes

```typescript
export function ContractTimeline({ 
  contracts 
}: { 
  contracts: DashboardContract[] 
}) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Últimos Contratos</CardTitle>
        <FileText className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {contracts.length > 0 ? (
          <>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center space-x-4 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contract.code}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contract.status === 'ativo' ? 'bg-green-100 text-green-700' :
                        contract.status === 'rascunho' ? 'bg-yellow-100 text-yellow-700' :
                        contract.status === 'concluido' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contract.parties.sideA[0]?.name || 'Sem parte A'} ↔ {contract.parties.sideB[0]?.name || 'Sem parte B'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {formatDate(contract.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(contract.sideATotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">Lado A</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {formatCurrency(contract.sideBTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">Lado B</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      contract.balance === 0 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {formatCurrency(Math.abs(contract.balance))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contract.balance === 0 ? 'Balanceado' : 'Diferença'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/contratos">
                Ver todos os contratos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhum contrato encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/contratos/novo">Criar primeiro contrato</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 4.4 - Reescrever `components/dashboard/recent-additions.tsx`

**Mudanças:**
1. Remover dados mockados hardcoded
2. Receber dados via props
3. Mapear ícones dinamicamente

```typescript
"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Car, CreditCard, Building2, ArrowRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import type { RecentAddition } from "@/lib/types"

const typeConfig = {
  imovel: {
    label: "Imóvel",
    icon: MapPin,
    href: (id: string) => `/banco-dados/imoveis/${id}`
  },
  veiculo: {
    label: "Veículo",
    icon: Car,
    href: (id: string) => `/banco-dados/veiculos/${id}`
  },
  credito: {
    label: "Crédito",
    icon: CreditCard,
    href: (id: string) => `/banco-dados/creditos/${id}`
  },
  empreendimento: {
    label: "Empreendimento",
    icon: Building2,
    href: (id: string) => `/banco-dados/empreendimentos/${id}`
  },
}

interface RecentAdditionsProps {
  additions: RecentAddition[]
}

export function RecentAdditions({ additions }: RecentAdditionsProps) {
  if (additions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma adição recente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre imóveis, veículos, créditos ou empreendimentos
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {additions.map((item) => {
            const config = typeConfig[item.type]
            const Icon = config.icon
            
            return (
              <div 
                key={item.id} 
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                      {config.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {item.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.value)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={config.href(item.id)}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/banco-dados">
              Ver banco de dados completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Fase 5: Melhorias Visuais e UX

#### 5.1 - Adicionar Card de Resumo Bancário

**Local:** `app/page.tsx`

Criar nova seção logo após o header mostrando:
- Total em contas bancárias
- Quantidade de contas ativas
- Link rápido para página de contas bancárias

```typescript
<div>
  <h2 className="text-xl font-semibold mb-4">Resumo Bancário</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/financeiro/contas-bancarias')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(bankSummary.totalBalance)}
        </div>
        <p className="text-xs text-muted-foreground">
          {bankSummary.totalAccounts} {bankSummary.totalAccounts === 1 ? 'conta ativa' : 'contas ativas'}
        </p>
      </CardContent>
    </Card>
  </div>
</div>
```

#### 5.2 - Adicionar Estados de Loading

**Opção 1: Usar Suspense (Recomendado)**

```typescript
// app/page.tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function HomePage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Início" }]}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão de patrimônio
          </p>
        </div>

        {/* KPIs Mensais com Loading */}
        <Suspense fallback={<MonthlyKPIsSkeleton />}>
          <MonthlyKPIsSection />
        </Suspense>

        {/* Movimentações de Hoje com Loading */}
        <Suspense fallback={<TodayMovementsSkeleton />}>
          <TodayMovementsSection />
        </Suspense>

        {/* Ações Rápidas (não precisa loading) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <QuickActions />
        </div>

        {/* Atividade Recente com Loading */}
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivitySection />
        </Suspense>
      </div>
    </MainLayout>
  )
}

// Criar componentes de seção separados
async function MonthlyKPIsSection() {
  const monthlyKPIs = await getMonthlyKPIs()
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Mensal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MonthlyKPICards {...monthlyKPIs} />
      </div>
    </div>
  )
}

// Criar componentes Skeleton
function MonthlyKPIsSkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visão Mensal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[160px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

#### 5.3 - Adicionar Indicadores Visuais

**Cards de Movimentação:**
- Badge de status (em_aberto, vencido, etc)
- Cores diferentes para contas vencidas (vermelho)
- Ícone de alerta para contas vencidas

**Timeline de Contratos:**
- Badge de status do contrato (rascunho, ativo, concluído)
- Indicador visual se contrato está balanceado ou não
- Cores: verde (balanceado), amarelo (diferença pequena), vermelho (grande diferença)

---

### Fase 6: Otimizações e Cache

#### 6.1 - Configurar Revalidação de Cache

**No arquivo de server actions:**

```typescript
// app/actions/dashboard.ts
import { unstable_cache } from 'next/cache'

export const getMonthlyKPIs = unstable_cache(
  async () => {
    // código da função
  },
  ['dashboard-monthly-kpis'],
  {
    revalidate: 300, // 5 minutos
    tags: ['dashboard', 'financial']
  }
)
```

#### 6.2 - Invalidar Cache em Ações Relevantes

**Quando criar/editar/deletar:**
- Contas a receber → revalidar 'dashboard', 'financial'
- Contas a pagar → revalidar 'dashboard', 'financial'
- Contratos → revalidar 'dashboard', 'contracts'
- Imóveis/Veículos/etc → revalidar 'dashboard', 'assets'

```typescript
// Exemplo em app/actions/contracts.ts
import { revalidateTag } from 'next/cache'

export async function createContract(data: ContractFormData) {
  // ... código de criação
  
  revalidateTag('dashboard')
  revalidateTag('contracts')
  revalidatePath('/contratos')
  revalidatePath('/')
  
  return { success: true }
}
```

---

## 📝 Checklist de Implementação

### ✅ Pré-requisitos
- [ ] Verificar que o Supabase está configurado corretamente
- [ ] Verificar que as RLS policies permitem leitura dos dados
- [ ] Confirmar estrutura das tabelas

### 📦 Fase 1: Server Actions
- [ ] Criar arquivo `app/actions/dashboard.ts`
- [ ] Implementar `getMonthlyKPIs()`
- [ ] Implementar `getTodayMovements()`
- [ ] Implementar `getRecentContracts()`
- [ ] Implementar `getRecentAdditions()`
- [ ] Implementar `getBankAccountsSummary()`
- [ ] Testar cada action individualmente

### 🎨 Fase 2: Tipos TypeScript
- [ ] Adicionar tipos em `lib/types.ts`:
  - [ ] `MonthlyKPIs`
  - [ ] `TodayMovements`
  - [ ] `MovementItem`
  - [ ] `TodayMovementsList`
  - [ ] `RecentAddition`
  - [ ] `BankSummary`
  - [ ] `DashboardContract`

### 🔧 Fase 3: Atualizar lib/dashboard-data.ts
- [ ] Remover imports de `mock-data`
- [ ] Importar server actions
- [ ] Converter funções para assíncronas
- [ ] Renomear para `fetch*`
- [ ] Remover lógica de cálculo mockada

### 🎯 Fase 4: Atualizar Componentes
- [ ] `app/page.tsx`:
  - [ ] Converter para `async function`
  - [ ] Buscar dados reais com `await`
  - [ ] Adicionar seção de resumo bancário
  - [ ] Passar dados reais para componentes filhos
- [ ] `components/dashboard/today-movements-cards.tsx`:
  - [ ] Ajustar interface `MovementItem`
  - [ ] Exibir campo `code`
  - [ ] Diferenciar exibição de pagar vs receber
- [ ] `components/dashboard/contract-timeline.tsx`:
  - [ ] Usar tipo `DashboardContract`
  - [ ] Ajustar exibição de partes
  - [ ] Adicionar badges de status
  - [ ] Adicionar indicador de balanceamento
- [ ] `components/dashboard/recent-additions.tsx`:
  - [ ] Remover dados hardcoded
  - [ ] Receber dados via props
  - [ ] Implementar estado vazio
  - [ ] Mapear ícones dinamicamente

### ✨ Fase 5: Melhorias UX
- [ ] Adicionar card de resumo bancário
- [ ] Implementar Suspense e Skeletons
- [ ] Adicionar badges de status
- [ ] Adicionar cores para estados (vencido, etc)
- [ ] Adicionar ícones de alerta

### ⚡ Fase 6: Otimizações
- [ ] Configurar `unstable_cache` nas actions
- [ ] Definir tempo de revalidação apropriado
- [ ] Adicionar tags de cache
- [ ] Atualizar actions de CRUD para invalidar cache
- [ ] Testar performance

### 🧪 Fase 7: Testes
- [ ] Testar com banco vazio (todos os cards zerados)
- [ ] Testar com 1 registro de cada tipo
- [ ] Testar com múltiplos registros
- [ ] Testar estados de loading
- [ ] Testar links de navegação
- [ ] Testar responsividade mobile
- [ ] Verificar performance de carregamento

---

## 🚀 Ordem de Execução Recomendada

1. **Dia 1 - Fundação:**
   - Criar `app/actions/dashboard.ts`
   - Implementar action `getBankAccountsSummary()`
   - Implementar action `getMonthlyKPIs()`
   - Testar no console

2. **Dia 2 - Movimentações:**
   - Implementar action `getTodayMovements()`
   - Atualizar tipos em `lib/types.ts`
   - Testar queries SQL

3. **Dia 3 - Contratos e Adições:**
   - Implementar action `getRecentContracts()`
   - Implementar action `getRecentAdditions()`
   - Testar com dados reais

4. **Dia 4 - Integração Frontend:**
   - Atualizar `app/page.tsx` para async
   - Conectar KPIs mensais
   - Conectar resumo bancário
   - Testar visualização

5. **Dia 5 - Componentes:**
   - Atualizar `TodayMovementsCards`
   - Atualizar `ContractTimeline`
   - Atualizar `RecentAdditions`
   - Adicionar Skeletons

6. **Dia 6 - Polimento:**
   - Adicionar badges e indicadores visuais
   - Implementar Suspense
   - Configurar cache
   - Testes finais

---

## ⚠️ Pontos de Atenção

### 1. Dados Nulos/Vazios
**Problema:** Banco pode não ter dados ainda  
**Solução:** Sempre verificar e exibir estado vazio apropriado

```typescript
// Em cada query, garantir valor padrão
const result = await supabase
  .from('accounts_payable')
  .select('remaining_value')
  // ...

const total = result.data?.reduce((sum, item) => sum + (item.remaining_value || 0), 0) || 0
```

### 2. Tipos de Data
**Problema:** Supabase retorna strings ISO para datas  
**Solução:** Converter para Date quando necessário

```typescript
const additions = data.map(item => ({
  ...item,
  date: new Date(item.created_at) // Converter string para Date
}))
```

### 3. Performance
**Problema:** Múltiplas queries podem deixar dashboard lento  
**Solução:** 
- Usar cache apropriado (5 minutos é razoável)
- Considerar paralelizar queries com `Promise.all()`
- Usar Suspense para carregar seções independentemente

```typescript
// Paralelizar queries independentes
const [monthlyKPIs, todayMovements, bankSummary] = await Promise.all([
  getMonthlyKPIs(),
  getTodayMovements(),
  getBankAccountsSummary()
])
```

### 4. RLS Policies
**Problema:** Políticas podem bloquear leitura  
**Solução:** Verificar que todas as tabelas permitem SELECT para usuários autenticados

```sql
-- Exemplo de policy de leitura
CREATE POLICY "Permitir leitura para usuários autenticados"
ON accounts_receivable FOR SELECT
TO authenticated
USING (true);
```

### 5. Formatação de Valores
**Problema:** Supabase pode retornar numeric como string  
**Solução:** Converter com `Number()` ou `parseFloat()`

```typescript
const value = Number(row.remaining_value) || 0
```

---

## 📊 Estrutura de Dados Esperada

### Query: getMonthlyKPIs
```typescript
{
  monthlyPayables: 15000.00,      // R$ a pagar no mês
  monthlyReceivables: 25000.00,   // R$ a receber no mês
  monthlyBalance: 10000.00,       // Saldo (25k - 15k)
  newContractsThisMonth: 3        // Quantidade
}
```

### Query: getTodayMovements
```typescript
{
  todayPayables: 5000.00,
  todayReceivables: 8000.00,
  todayPayablesCount: 5,
  todayReceivablesCount: 8,
  todayPayablesList: [
    {
      id: "uuid",
      code: "CP-250001",
      description: "Fornecedor XYZ - Materiais",
      value: 2500.00,
      vinculo: "Fornecedores",
      centro_custo: "Obras",
      dueDate: "2026-01-11"
    },
    // ... mais 4
  ],
  todayReceivablesList: [
    {
      id: "uuid",
      code: "CR-240001",
      description: "Parcela 1/10 - Contrato CT-0001",
      value: 5000.00,
      counterparty: "João Silva",
      dueDate: "2026-01-11"
    },
    // ... mais 7
  ]
}
```

### Query: getRecentContracts
```typescript
[
  {
    id: "uuid",
    code: "CT-0001",
    contractDate: "2026-01-05",
    status: "ativo",
    sideATotal: 500000.00,
    sideBTotal: 500000.00,
    balance: 0,
    parties: {
      sideA: [
        { name: "João Silva", document: "123.456.789-00" }
      ],
      sideB: [
        { name: "Construtora ABC", document: "12.345.678/0001-00" }
      ]
    },
    updatedAt: "2026-01-11T10:30:00Z"
  },
  // ... mais 4
]
```

### Query: getRecentAdditions
```typescript
[
  {
    id: "uuid",
    code: "IMV-0001",
    type: "imovel",
    name: "Casa Residencial - Rua das Flores, 123",
    value: 450000.00,
    date: new Date("2026-01-10")
  },
  {
    id: "uuid",
    code: "VEI-0001",
    type: "veiculo",
    name: "Honda Civic 2022 - ABC-1234",
    value: 85000.00,
    date: new Date("2026-01-09")
  },
  // ... mais 3
]
```

### Query: getBankAccountsSummary
```typescript
{
  totalAccounts: 2,
  totalBalance: 222830.66
}
```

---

## 🎨 Mockups de Referência

### Seção: Resumo Bancário
```
┌─────────────────────────────────────────────────┐
│ 💰 Saldo Total                           [Wallet Icon] │
│ R$ 222.830,66                                    │
│ 2 contas ativas                                  │
└─────────────────────────────────────────────────┘
```

### Seção: Visão Mensal (4 cards lado a lado)
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 📉 Pagar  │ │ 📈 Receber│ │ 💵 Saldo │ │ 📄 Novos │
│ R$ 15.0k │ │ R$ 25.0k │ │ R$ 10.0k │ │    3     │
│ no mês   │ │ no mês   │ │ no mês   │ │ contratos│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Seção: Movimentações de Hoje (2 colunas)
```
┌─────────────────────────┐ ┌─────────────────────────┐
│ Contas a Pagar Hoje     │ │ Contas a Receber Hoje   │
│ R$ 5.000,00             │ │ R$ 8.000,00             │
│ 5 lançamentos           │ │ 8 lançamentos           │
│                         │ │                         │
│ ┌─────────────────────┐ │ │ ┌─────────────────────┐ │
│ │ CP-250001           │ │ │ │ CR-240001           │ │
│ │ Fornecedor - Obras  │ │ │ │ João Silva          │ │
│ │ R$ 2.500,00         │ │ │ │ R$ 5.000,00         │ │
│ └─────────────────────┘ │ │ └─────────────────────┘ │
│ ... mais 4              │ │ ... mais 7              │
│ [Ver todos →]           │ │ [Ver todos →]           │
└─────────────────────────┘ └─────────────────────────┘
```

---

## 🔍 Queries SQL Completas

### Query 1: Monthly KPIs

```sql
-- Contas a Pagar no Mês
WITH monthly_payables AS (
  SELECT COALESCE(SUM(remaining_value), 0) as total
  FROM accounts_payable
  WHERE EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status IN ('em_aberto', 'vencido', 'parcialmente_pago')
),
-- Contas a Receber no Mês
monthly_receivables AS (
  SELECT COALESCE(SUM(remaining_value), 0) as total
  FROM accounts_receivable
  WHERE EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status IN ('em_aberto', 'vencido', 'parcialmente_pago')
),
-- Novos Contratos no Mês
new_contracts AS (
  SELECT COUNT(*) as total
  FROM contracts
  WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT 
  mp.total as monthly_payables,
  mr.total as monthly_receivables,
  (mr.total - mp.total) as monthly_balance,
  nc.total as new_contracts_this_month
FROM monthly_payables mp, monthly_receivables mr, new_contracts nc;
```

### Query 2: Today Movements (Payables)

```sql
SELECT 
  id,
  code,
  description,
  remaining_value as value,
  vinculo,
  centro_custo,
  due_date
FROM accounts_payable
WHERE due_date = CURRENT_DATE
  AND status IN ('em_aberto', 'vencido')
ORDER BY remaining_value DESC
LIMIT 5;
```

### Query 3: Today Movements (Receivables)

```sql
SELECT 
  id,
  code,
  description,
  remaining_value as value,
  counterparty,
  due_date
FROM accounts_receivable
WHERE due_date = CURRENT_DATE
  AND status IN ('em_aberto', 'vencido')
ORDER BY remaining_value DESC
LIMIT 5;
```

### Query 4: Recent Contracts

```sql
SELECT 
  id,
  code,
  contract_date,
  status,
  side_a_total,
  side_b_total,
  balance,
  created_at,
  updated_at
FROM contracts
ORDER BY updated_at DESC
LIMIT 5;
```

### Query 5: Contract Parties

```sql
SELECT 
  id,
  side,
  party_name,
  party_document
FROM contract_parties
WHERE contract_id = $1
ORDER BY side, created_at;
```

### Query 6: Recent Additions (Combined)

```sql
-- Imóveis
(
  SELECT 
    id,
    code,
    identification as name,
    sale_value as value,
    created_at,
    'imovel' as type
  FROM properties
  ORDER BY created_at DESC
  LIMIT 5
)
UNION ALL
-- Veículos
(
  SELECT 
    id,
    code,
    CONCAT(brand, ' ', model, ' - ', plate) as name,
    reference_value as value,
    created_at,
    'veiculo' as type
  FROM vehicles
  ORDER BY created_at DESC
  LIMIT 5
)
UNION ALL
-- Créditos
(
  SELECT 
    id,
    code,
    CONCAT('Crédito - ', origin) as name,
    current_balance as value,
    created_at,
    'credito' as type
  FROM credits
  ORDER BY created_at DESC
  LIMIT 5
)
UNION ALL
-- Empreendimentos
(
  SELECT 
    id,
    code,
    name,
    reference_value as value,
    created_at,
    'empreendimento' as type
  FROM developments
  ORDER BY created_at DESC
  LIMIT 5
)
ORDER BY created_at DESC
LIMIT 5;
```

### Query 7: Bank Summary

```sql
SELECT 
  COUNT(*) as total_accounts,
  COALESCE(SUM(balance), 0) as total_balance
FROM bank_accounts
WHERE status = 'ativo';
```

---

## 📚 Recursos Adicionais

### Documentação Relevante
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

### Testes Recomendados

1. **Teste com Banco Vazio:**
   - Verificar que não há erros
   - Cards mostram R$ 0,00 ou 0
   - Mensagens de "Nenhum registro" aparecem

2. **Teste com 1 Registro:**
   - Verificar formatação correta
   - Links funcionando
   - Dados exibidos corretamente

3. **Teste com Múltiplos Registros:**
   - Verificar que top 5 aparecem
   - Ordenação correta
   - Performance aceitável

4. **Teste de Performance:**
   - Dashboard deve carregar em < 2 segundos
   - Skeletons devem aparecer imediatamente
   - Cache funcionando (2ª visita mais rápida)

---

## ✅ Conclusão

Este roteiro fornece um caminho completo e detalhado para transformar a página inicial de um sistema com dados mockados para um dashboard funcional conectado ao Supabase. 

**Próximos passos:**
1. Começar pela Fase 1 (Server Actions)
2. Testar cada query individualmente
3. Seguir para integração frontend
4. Adicionar melhorias visuais
5. Otimizar performance

**Estimativa de tempo:** 4-6 dias de desenvolvimento

**Complexidade:** Média
- Backend: Simples (queries SQL diretas)
- Frontend: Média (async/await, Suspense, tipos)
- Integrações: Simples (server actions bem definidos)

---

**Dúvidas ou problemas durante a implementação?**
- Verificar logs do servidor Next.js
- Testar queries SQL diretamente no Supabase
- Confirmar RLS policies
- Verificar tipos TypeScript

**BOA SORTE! 🚀**
