"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { isToday, isThisWeek, isOverdue } from "@/lib/utils"
import { Calendar, Clock, AlertTriangle, CreditCard } from "lucide-react"
import type { AccountPayable } from "@/lib/types"

interface PayablesSummaryCardsProps {
  accounts: AccountPayable[]
}

export function PayablesSummaryCards({ accounts }: PayablesSummaryCardsProps) {
  const openAccounts = accounts.filter((account) => ['em_aberto', 'parcialmente_pago'].includes(account.status))

  const totalOpen = openAccounts.reduce((sum, account) => sum + account.remaining_value, 0)

  const dueToday = openAccounts
    .filter((account) => isToday(account.due_date))
    .reduce((sum, account) => sum + account.remaining_value, 0)

  const dueThisWeek = openAccounts
    .filter((account) => isThisWeek(account.due_date))
    .reduce((sum, account) => sum + account.remaining_value, 0)

  const overdueAccounts = accounts.filter((account) => account.status === 'vencido')
  const overdue = overdueAccounts.reduce((sum, account) => sum + account.remaining_value, 0)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalOpen)}</div>
          <p className="text-xs text-muted-foreground">{openAccounts.length} contas em aberto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vence Hoje</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(dueToday)}</div>
          <p className="text-xs text-muted-foreground">vencimento hoje</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vence Esta Semana</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{formatCurrency(dueThisWeek)}</div>
          <p className="text-xs text-muted-foreground">vencimento até 7 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(overdue)}</div>
          <p className="text-xs text-muted-foreground">contas vencidas</p>
        </CardContent>
      </Card>
    </div>
  )
}
