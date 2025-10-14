import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Brazilian Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Format date in Brazilian format (DD/MM/YYYY)
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Data inválida"
    }

    return new Intl.DateTimeFormat("pt-BR").format(dateObj)
  } catch (error) {
    return "Data inválida"
  }
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

// Format CPF/CNPJ
export function formatDocument(document: string): string {
  const cleanDoc = document.replace(/\D/g, "")

  if (cleanDoc.length === 11) {
    // CPF format: 000.000.000-00
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  } else if (cleanDoc.length === 14) {
    // CNPJ format: 00.000.000/0000-00
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  return document
}

// Check if date is today
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// Check if date is this week
export function isThisWeek(date: Date): boolean {
  const today = new Date()
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))

  return date >= weekStart && date <= weekEnd
}

// Check if date is overdue
export function isOverdue(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// Get status color for accounts only
export function getAccountStatusColor(status: string): string {
  switch (status) {
    case "disponivel":
    case "quitado":
      return "text-green-800 bg-green-100 border-green-200"
    case "em_aberto":
      return "text-yellow-800 bg-yellow-100 border-yellow-200"
    case "vencido":
      return "text-red-800 bg-red-100 border-red-200"
    case "comprometido":
      return "text-blue-800 bg-blue-100 border-blue-200"
    case "vendido":
      return "text-purple-800 bg-purple-100 border-purple-200"
    default:
      return "text-gray-800 bg-gray-100 border-gray-200"
  }
}

// Get status label in Portuguese for accounts only
export function getAccountStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    disponivel: "Disponível",
    comprometido: "Comprometido",
    vendido: "Vendido",
    em_aberto: "Em Aberto",
    vencido: "Vencido",
    quitado: "Quitado",
  }

  return labels[status] || status
}
