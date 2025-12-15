// User and Permission Types
export type UserRole = "admin" | "gestor" | "visualizador"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// =====================================================
// Person Types
// =====================================================

export interface Person {
  id: string
  full_name: string
  cpf: string
  email?: string | null
  phone?: string | null
  mobile_phone?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  birth_date?: string | null
  nationality?: string | null
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | null
  profession?: string | null
  rg?: string | null
  rg_issuer?: string | null
  rg_issue_date?: string | null
  notes?: string | null
  status: 'ativo' | 'inativo' | 'arquivado'
  created_by?: string
  created_at: string
  updated_at: string
}

// =====================================================
// Company Types
// =====================================================

export interface Company {
  id: string
  trade_name: string
  cnpj: string
  gra_percentage: number
  status: 'ativo' | 'inativo' | 'arquivado'
  created_by: string | null
  created_at: string
  updated_at: string
}

// Contract Types
export interface ContractParty {
  id: string
  name: string
  type: "pessoa" | "empresa"
  document: string // CPF or CNPJ
  email?: string
  phone?: string
}

export interface ContractItem {
  id: string
  type: "imovel" | "veiculo" | "credito" | "empreendimento" | "dinheiro"
  itemId?: string // Reference to asset ID
  description: string
  value: number
  participants: {
    partyId: string
    percentage: number
  }[]
}

export interface ContractSide {
  name: string
  parties: ContractParty[]
  items: ContractItem[]
  totalValue: number
}

export interface PaymentCondition {
  installments: number
  firstDueDate: Date
  frequency: "mensal" | "unico"
  paymentMethod: string
}

export interface Contract {
  id: string
  code: string // CT-0001 format
  date: Date
  sideA: ContractSide
  sideB: ContractSide
  paymentConditions?: PaymentCondition
  balance: number // Should be 0 for active contracts
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  history: ContractHistoryEntry[]
}

export interface ContractHistoryEntry {
  id: string
  action: string
  description: string
  author: string
  date: Date
}

// Asset Types
export type AssetStatus = "disponivel" | "comprometido" | "vendido"

export interface Property {
  id: string
  code: string
  identification: string
  
  // Classificação
  type: 'casa' | 'apartamento' | 'terreno' | 'comercial'
  classe: string | null
  subclasse: string | null
  
  // Endereço
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  
  // Características
  area: number
  registry: string
  reference_value: number
  
  // Status
  status: 'disponivel' | 'comprometido' | 'vendido'
  notes: string | null
  
  // Auditoria
  created_by: string | null
  created_at: string
  updated_at: string
}

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

export interface Development {
  id: string
  code: string // EMP-0001 format
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

// Financial Types
export type TransactionType = "entrada" | "saida"
export type AccountStatus = "em_aberto" | "vencido" | "quitado"

export interface CashTransaction {
  id: string
  bank_account_id: string
  bank_account?: {
    id: string
    name: string
    type: string
  }
  transaction_date: string | Date
  type: TransactionType
  description: string
  vinculo: string // categoria associada à movimentação
  forma: "Caixa" | "Permuta" // indica se foi via Caixa ou Permuta
  centro_custo: string // categoria financeira associada
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

export interface AccountReceivable {
  id: string
  code: string // Código gerado automaticamente (CR-YYNN)
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
  vinculo: string // Categoria/vínculo
  centro_custo: string // Centro de custo
  installment_current?: number | null
  installment_total?: number | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at: string
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

export interface AccountPayable {
  id: string
  code: string // Código gerado automaticamente (CP-AANNNN)
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
  vinculo: string // Categoria/vínculo
  centro_custo: string // Centro de custo
  installment_current?: number | null
  installment_total?: number | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at: string
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

// Dashboard Types
export interface CashSummary {
  balance: number
  todayIncome: number
  todayExpenses: number
}

export interface FinancialSummary {
  receivablesToday: number
  receivablesThisWeek: number
  payablesToday: number
  payablesThisWeek: number
}

export interface KPIs {
  activeContracts: number
  contractsExpiringThisMonth: number
  totalAssetValue: number
  defaultRate: number
}

// Report Types
export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  contractIds?: string[]
  assetTypes?: string[]
  parties?: string[]
}

export interface CashFlowReport {
  period: {
    start: Date
    end: Date
  }
  predicted: {
    income: number
    expenses: number
  }
  actual: {
    income: number
    expenses: number
  }
  variance: {
    income: number
    expenses: number
  }
}

export interface AccountFilter {
  codigo?: string
  vencimentoInicial?: Date
  vencimentoFinal?: Date
  vinculo?: string
  centroCusto?: string
  descricao?: string
  valorInicial?: number
  valorFinal?: number
}

export interface BankAccount {
  id: string
  name: string
  type: "banco" | "especie" | "poupanca" | "investimento"
  code?: string // Optional bank code
  balance: number
  initial_balance: number
  status: 'ativo' | 'inativo'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DailyMovement {
  id: string
  date: Date
  accountId: string
  accountName: string
  type: TransactionType
  description: string
  value: number
  vinculo: string
  centroCusto: string
}

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

// =====================================================
// Contract Types
// =====================================================

export type ContractStatus = 'rascunho' | 'ativo' | 'concluido' | 'cancelado'
export type ContractSide = 'A' | 'B'
export type ContractPartyType = 'pessoa' | 'empresa'
export type ContractItemType = 'imovel' | 'veiculo' | 'credito' | 'empreendimento' | 'dinheiro'
export type PaymentDirection = 'entrada' | 'saida'
export type PaymentType = 'unico' | 'parcelado'
export type PaymentFrequency = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'

export interface Contract {
  id: string
  code: string // CT-0001
  contract_date: string // YYYY-MM-DD
  side_a_total: number
  side_b_total: number
  balance: number // Generated: side_a_total - side_b_total
  status: ContractStatus
  notes?: string | null
  attachment_urls?: string[] | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface ContractParty {
  id: string
  contract_id: string
  side: ContractSide
  party_type: ContractPartyType
  party_id: string
  party_name: string
  party_document: string
  gra_percentage: number // 0-100
  created_at: string
}

export interface ContractItem {
  id: string
  contract_id: string
  side: ContractSide
  item_type: ContractItemType
  item_id?: string | null // null for 'dinheiro'
  description: string
  item_value: number
  notes?: string | null
  created_at: string
}

export interface ContractItemParticipant {
  id: string
  contract_item_id: string
  party_id: string // FK to contract_parties
  percentage: number // 1-100
  created_at: string
}

export interface ContractPaymentCondition {
  id: string
  contract_id: string
  condition_value: number
  direction: PaymentDirection
  payment_type: PaymentType
  installments: number // default 1
  frequency?: PaymentFrequency | null
  start_date: string // YYYY-MM-DD
  payment_method?: string | null
  notes?: string | null
  created_at: string
}

// =====================================================
// Contract Form Data Types (for UI state management)
// =====================================================

export interface ContractFormParty {
  id?: string
  side: ContractSide
  party_type: ContractPartyType
  party_id: string
  party_name: string
  party_document: string
  gra_percentage: number
}

export interface ContractFormItem {
  id?: string
  side: ContractSide
  item_type: ContractItemType
  item_id?: string | null
  description: string
  item_value: number
  notes?: string | null
  participants: ContractFormItemParticipant[]
}

export interface ContractFormItemParticipant {
  id?: string
  party_id: string
  party_name: string
  percentage: number
}

export interface ContractFormPaymentCondition {
  id?: string
  condition_value: number
  direction: PaymentDirection
  payment_type: PaymentType
  installments: number
  frequency?: PaymentFrequency | null
  start_date: string
  payment_method?: string | null
  notes?: string | null
}

export interface ContractFormData {
  id?: string
  code?: string
  contract_date: string
  parties: ContractFormParty[]
  items: ContractFormItem[]
  payment_conditions: ContractFormPaymentCondition[]
  notes?: string
  attachment_urls?: string[]
  status?: ContractStatus
}

// Tipo completo para exibição (com dados expandidos)
export interface ContractWithDetails extends Contract {
  parties: ContractParty[]
  items: (ContractItem & {
    participants: (ContractItemParticipant & {
      party_name: string
    })[]
  })[]
  payment_conditions: ContractPaymentCondition[]
}
