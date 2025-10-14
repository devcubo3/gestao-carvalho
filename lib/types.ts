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
  code: string // IMV-0001 format
  identification: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  type: "casa" | "apartamento" | "terreno" | "comercial"
  area: number // m²
  registry: string // matrícula/registro
  referenceValue: number
  status: AssetStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Vehicle {
  id: string
  code: string // VEI-0001 format
  type: "carro" | "moto" | "caminhao" | "barco"
  brand: string
  model: string
  year: number
  plate: string
  chassis: string
  referenceValue: number
  status: AssetStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Credit {
  id: string
  code: string // CRD-0001 format
  creditor: string
  debtor: string
  origin: string
  nominalValue: number
  saldoGRA: number // Adicionando campo saldoGRA para saldo atual da carta de crédito
  interestRate?: string
  startDate: Date
  dueDate: Date
  status: AssetStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Development {
  id: string
  code: string // EMP-0001 format
  name: string
  type: "predio" | "loteamento" | "chacaramento"
  location: string
  participationPercentage: number
  units?: string[]
  referenceValue: number
  status: AssetStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Financial Types
export type TransactionType = "entrada" | "saida"
export type AccountStatus = "em_aberto" | "vencido" | "quitado"

export interface CashTransaction {
  id: string
  date: Date
  type: TransactionType
  description: string
  vinculo: string // categoria associada à movimentação
  forma: "Caixa" | "Permuta" // indica se foi via Caixa ou Permuta
  centroCusto: string // categoria financeira associada
  value: number
  createdAt: Date
}

export interface AccountReceivable {
  id: string
  code: string // Código gerado automaticamente
  contractId?: string
  description: string
  counterparty: string
  value: number
  dueDate: Date
  status: AccountStatus
  installment?: {
    current: number
    total: number
  }
  vinculo: string // Categoria/vínculo
  centroCusto: string // Centro de custo
  dataRegistro: Date // Data de registro no sistema
  createdAt: Date
  updatedAt: Date
}

export interface AccountPayable {
  id: string
  code: string // Código gerado automaticamente
  contractId?: string
  description: string
  counterparty: string
  value: number
  dueDate: Date
  status: AccountStatus
  installment?: {
    current: number
    total: number
  }
  vinculo: string // Categoria/vínculo
  centroCusto: string // Centro de custo
  dataRegistro: Date // Data de registro no sistema
  createdAt: Date
  updatedAt: Date
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
  balance: number
  code?: string // Optional bank code
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
