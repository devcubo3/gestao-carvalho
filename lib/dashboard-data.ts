import {
  mockContracts,
  mockAccountsReceivable,
  mockAccountsPayable,
  mockCashTransactions,
  mockProperties,
  mockVehicles,
  mockCredits,
  mockDevelopments,
} from "./mock-data"
import { isToday, isThisWeek, isOverdue } from "./utils"
import type { CashSummary, FinancialSummary, KPIs, MonthlyKPIs, TodayMovements, TodayMovementsList } from "./types"

export function getCashSummary(): CashSummary {
  const todayTransactions = mockCashTransactions.filter((transaction) => isToday(transaction.date))

  const todayIncome = todayTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)

  const todayExpenses = todayTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)

  const balance = mockCashTransactions.length > 0 ? mockCashTransactions[mockCashTransactions.length - 1].balance : 0

  return {
    balance,
    todayIncome,
    todayExpenses,
  }
}

export function getFinancialSummary(): FinancialSummary {
  const receivablesToday = mockAccountsReceivable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  const receivablesThisWeek = mockAccountsReceivable
    .filter((account) => isThisWeek(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  const payablesToday = mockAccountsPayable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  const payablesThisWeek = mockAccountsPayable
    .filter((account) => isThisWeek(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  return {
    receivablesToday,
    receivablesThisWeek,
    payablesToday,
    payablesThisWeek,
  }
}

export function getKPIs(): KPIs {
  const activeContracts = mockContracts.length

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const contractsExpiringThisMonth = mockContracts.filter((contract) => {
    if (contract.paymentConditions) {
      const lastPaymentDate = new Date(contract.paymentConditions.firstDueDate)
      lastPaymentDate.setMonth(lastPaymentDate.getMonth() + contract.paymentConditions.installments - 1)
      return lastPaymentDate.getMonth() === currentMonth && lastPaymentDate.getFullYear() === currentYear
    }
    return false
  }).length

  const totalAssetValue = [...mockProperties, ...mockVehicles, ...mockCredits, ...mockDevelopments].reduce(
    (sum, asset) => sum + asset.referenceValue,
    0,
  )

  const overdueAccounts = mockAccountsReceivable.filter(
    (account) => isOverdue(account.dueDate) && account.status === "em_aberto",
  ).length

  const totalAccounts = mockAccountsReceivable.filter((account) => account.status === "em_aberto").length

  const defaultRate = totalAccounts > 0 ? (overdueAccounts / totalAccounts) * 100 : 0

  return {
    activeContracts,
    contractsExpiringThisMonth,
    totalAssetValue,
    defaultRate,
  }
}

export function getMonthlyKPIs(): MonthlyKPIs {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Valor a Pagar no Mês
  const monthlyPayables = mockAccountsPayable
    .filter((account) => {
      const dueDate = new Date(account.dueDate)
      return (
        dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear && account.status === "em_aberto"
      )
    })
    .reduce((sum, account) => sum + account.value, 0)

  // Valor a Receber no Mês
  const monthlyReceivables = mockAccountsReceivable
    .filter((account) => {
      const dueDate = new Date(account.dueDate)
      return (
        dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear && account.status === "em_aberto"
      )
    })
    .reduce((sum, account) => sum + account.value, 0)

  // Saldo Financeiro no Mês
  const monthlyBalance = monthlyReceivables - monthlyPayables

  // Novos Contratos no Mês
  const newContractsThisMonth = mockContracts.filter((contract) => {
    const contractDate = new Date(contract.startDate)
    return contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear
  }).length

  return {
    monthlyPayables,
    monthlyReceivables,
    monthlyBalance,
    newContractsThisMonth,
  }
}

export function getTodayMovements(): TodayMovements {
  const todayPayables = mockAccountsPayable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  const todayReceivables = mockAccountsReceivable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .reduce((sum, account) => sum + account.value, 0)

  const todayPayablesCount = mockAccountsPayable.filter(
    (account) => isToday(account.dueDate) && account.status === "em_aberto",
  ).length

  const todayReceivablesCount = mockAccountsReceivable.filter(
    (account) => isToday(account.dueDate) && account.status === "em_aberto",
  ).length

  return {
    todayPayables,
    todayReceivables,
    todayPayablesCount,
    todayReceivablesCount,
  }
}

export function getTodayMovementsList(): TodayMovementsList {
  const todayPayablesList = mockAccountsPayable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map((account) => ({
      id: account.id,
      description: account.description,
      value: account.value,
      counterparty: account.counterparty,
      dueDate: account.dueDate,
    }))

  const todayReceivablesList = mockAccountsReceivable
    .filter((account) => isToday(account.dueDate) && account.status === "em_aberto")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map((account) => ({
      id: account.id,
      description: account.description,
      value: account.value,
      counterparty: account.counterparty,
      dueDate: account.dueDate,
    }))

  return {
    todayPayablesList,
    todayReceivablesList,
  }
}

export function getUpcomingReceivables() {
  return mockAccountsReceivable
    .filter((account) => account.status === "em_aberto")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map((account) => ({
      id: account.id,
      description: account.description,
      value: account.value,
      counterparty: account.counterparty,
    }))
}

export function getUpcomingPayables() {
  return mockAccountsPayable
    .filter((account) => account.status === "em_aberto")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map((account) => ({
      id: account.id,
      description: account.description,
      value: account.value,
      counterparty: account.counterparty,
    }))
}
