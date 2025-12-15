"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { isToday, isThisWeek, isOverdue } from "@/lib/utils"
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import type { AccountReceivable } from "@/lib/types"

interface ReceivablesSummaryCardsProps {
  accounts: AccountReceivable[]
  loading?: boolean
}

export function ReceivablesSummaryCards({ accounts, loading = false }: ReceivablesSummaryCardsProps) {
  // Incluir contas em aberto, vencidas e parcialmente pagas
  const openAccounts = accounts.filter((account) => 
    account.status === "em_aberto" || 
    account.status === "vencido" ||
    account.status === "parcialmente_pago"
  )

  const totalOpen = openAccounts.reduce((sum, account) => sum + account.remaining_value, 0)

  const dueToday = openAccounts
    .filter((account) => isToday(account.due_date))
    .reduce((sum, account) => sum + account.remaining_value, 0)

  const dueThisWeek = openAccounts
    .filter((account) => isThisWeek(account.due_date))
    .reduce((sum, account) => sum + account.remaining_value, 0)

  const overdue = accounts
    .filter((account) => account.status === "vencido")
    .reduce((sum, account) => sum + account.remaining_value, 0)

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
