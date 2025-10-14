"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { CalendarIcon, TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown, ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockBankAccounts, mockCashTransactionsExtended } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

export default function DailyCashPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Filter transactions for selected date
  const dailyTransactions = mockCashTransactionsExtended.filter((transaction) => {
    const transactionDate = new Date(transaction.date)
    return (
      transactionDate.getDate() === selectedDate.getDate() &&
      transactionDate.getMonth() === selectedDate.getMonth() &&
      transactionDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Calculate daily totals
  const dailyIncome = dailyTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)
  const dailyExpenses = dailyTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)
  const dailyBalance = dailyIncome - dailyExpenses

  // Calculate account movements for the day
  const getAccountMovements = (accountId: string) => {
    return dailyTransactions.filter((t) => t.accountId === accountId)
  }

  const getAccountDailyBalance = (accountId: string) => {
    const movements = getAccountMovements(accountId)
    const income = movements.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)
    const expenses = movements.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)
    return income - expenses
  }

  // Separate transactions by type
  const incomeTransactions = dailyTransactions.filter((t) => t.type === "entrada")
  const expenseTransactions = dailyTransactions.filter((t) => t.type === "saida")

  const handlePrint = () => {
    window.print()
  }

  return (
    <MainLayout
      breadcrumbs={[{ label: "Financeiro" }, { label: "Caixa", href: "/financeiro/caixa" }, { label: "Caixa do Dia" }]}
    >
      <div className="space-y-8">
        {/* Header with date selector and print button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/caixa")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Caixa do Dia</h1>
              <p className="text-muted-foreground">Visualização detalhada das movimentações diárias</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>

            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setDatePickerOpen(false)
                    }
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="border-t border-border"></div>

        {/* Section 1: Saldos Iniciais */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Saldos Iniciais</h2>
            <p className="text-muted-foreground">Saldos das contas no início do dia</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockBankAccounts.map((account) => (
              <Card key={account.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{account.name}</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(account.balance)}</div>
                  <p className="text-xs text-muted-foreground mt-1">saldo inicial</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="border-t border-border"></div>

        {/* Section 2: Movimentações do Dia */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Movimentações do Dia</h2>
            <p className="text-muted-foreground">Entradas e saídas registradas no dia selecionado</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Entradas do Dia ({incomeTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {incomeTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{transaction.accountName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{transaction.vinculo}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            +{formatCurrency(transaction.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma entrada registrada neste dia</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="bg-red-50 border-b">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-5 w-5" />
                  Saídas do Dia ({expenseTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {expenseTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{transaction.accountName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{transaction.vinculo}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            -{formatCurrency(transaction.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma saída registrada neste dia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="border-t border-border"></div>

        {/* Section 3: Totais e Resumo Final */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Totais e Resumo Final</h2>
            <p className="text-muted-foreground">Consolidação dos resultados do dia</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Total de Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(dailyIncome)}</div>
                <p className="text-xs text-green-600/70 mt-1">recebimentos do dia</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Total de Saídas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{formatCurrency(dailyExpenses)}</div>
                <p className="text-xs text-red-600/70 mt-1">pagamentos do dia</p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "shadow-sm border-2",
                dailyBalance >= 0 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50",
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle
                  className={cn("text-sm font-medium", dailyBalance >= 0 ? "text-blue-700" : "text-orange-700")}
                >
                  Saldo Final do Dia
                </CardTitle>
                {dailyBalance >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-orange-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold", dailyBalance >= 0 ? "text-blue-600" : "text-orange-600")}>
                  {dailyBalance >= 0 ? "+" : ""}
                  {formatCurrency(dailyBalance)}
                </div>
                <p className={cn("text-xs mt-1", dailyBalance >= 0 ? "text-blue-600/70" : "text-orange-600/70")}>
                  resultado líquido
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Saldos Atualizados por Conta</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockBankAccounts.map((account) => {
                const dailyMovement = getAccountDailyBalance(account.id)
                const finalBalance = account.balance + dailyMovement

                return (
                  <Card key={account.id} className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{account.name}</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{formatCurrency(finalBalance)}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {dailyMovement !== 0 ? (
                          <>
                            {dailyMovement > 0 ? (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={cn(
                                "text-xs font-medium",
                                dailyMovement > 0 ? "text-green-600" : "text-red-600",
                              )}
                            >
                              {dailyMovement > 0 ? "+" : ""}
                              {formatCurrency(dailyMovement)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">sem movimentação</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
