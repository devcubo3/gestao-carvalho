"use client"
import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getCashTransactions, getBankAccounts, createCashClosing, getOpenCashDays } from "@/app/actions/cash"
import type { CashTransaction, BankAccount } from "@/lib/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function CashClosingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [openDays, setOpenDays] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactionsByDate, setTransactionsByDate] = useState<Record<string, CashTransaction[]>>({})
  const [closingValues, setClosingValues] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    const [openDaysResult, accountsResult] = await Promise.all([
      getOpenCashDays(),
      getBankAccounts(),
    ])

    if (openDaysResult.success && openDaysResult.data) {
      const days = openDaysResult.data as string[]
      setOpenDays(days)
      if (days.length > 0) {
        setActiveTab(days[0])
        // Carregar transações para todos os dias
        for (const day of days) {
          const transactionsResult = await getCashTransactions({ 
            dateFrom: day, 
            dateTo: day 
          })
          if (transactionsResult.success) {
            setTransactionsByDate(prev => ({
              ...prev,
              [day]: transactionsResult.data || []
            }))
          }
        }
      }
    }

    if (accountsResult.success) {
      setAccounts(accountsResult.data || [])
    }

    setIsLoading(false)
  }

  const getTransactionsForDate = (date: string) => {
    return transactionsByDate[date] || []
  }

  // Calculate totals for a specific date
  const calculateTotals = (date: string) => {
    const transactions = getTransactionsForDate(date)
    const entradas = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + Number(t.value), 0)
    const saidas = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + Number(t.value), 0)
    const saldo = entradas - saidas

    return { entradas, saidas, saldo }
  }

  // Handle input changes for closing values
  const handleClosingValueChange = (date: string, accountId: string, value: string) => {
    setClosingValues((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [accountId]: value,
      },
    }))
  }

  // Handle cash closing
  const handleCloseCash = async (date: string) => {
    const values = closingValues[date]
    if (!values || Object.keys(values).length === 0) {
      toast({
        title: "Erro",
        description: "Informe os saldos de todas as contas",
        variant: "destructive",
      })
      return
    }

    // Verificar se todos os campos foram preenchidos
    const missingAccounts = accounts.filter(acc => !values[acc.id] || values[acc.id] === "")
    if (missingAccounts.length > 0) {
      toast({
        title: "Erro",
        description: "Informe os saldos de todas as contas",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Preparar dados para o fechamento
    const bankAccountsData: Record<string, { informed_balance: number }> = {}
    accounts.forEach(account => {
      bankAccountsData[account.id] = {
        informed_balance: Number(values[account.id] || 0)
      }
    })

    const result = await createCashClosing({
      closing_date: date,
      bank_accounts_data: bankAccountsData,
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Caixa fechado com sucesso",
      })

      // Remover o dia da lista e atualizar a aba ativa
      const updatedDays = openDays.filter((day) => day !== date)
      setOpenDays(updatedDays)

      if (updatedDays.length > 0) {
        setActiveTab(updatedDays[0])
      }

      // Remover valores do fechamento
      const updatedValues = { ...closingValues }
      delete updatedValues[date]
      setClosingValues(updatedValues)
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao fechar caixa",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <MainLayout
        breadcrumbs={[
          { label: "Financeiro" },
          { label: "Caixa", href: "/financeiro/caixa" },
          { label: "Fechamento de Caixa" },
        ]}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/caixa")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fechamento de Caixa</h1>
              <p className="text-muted-foreground">Fechamento diário das movimentações de caixa</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (openDays.length === 0) {
    return (
      <MainLayout
        breadcrumbs={[
          { label: "Financeiro" },
          { label: "Caixa", href: "/financeiro/caixa" },
          { label: "Fechamento de Caixa" },
        ]}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/caixa")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fechamento de Caixa</h1>
              <p className="text-muted-foreground">Fechamento diário das movimentações de caixa</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground">Não há caixas em aberto para fechamento</h3>
                <p className="text-sm text-muted-foreground mt-2">Todos os caixas foram fechados com sucesso</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Financeiro" },
        { label: "Caixa", href: "/financeiro/caixa" },
        { label: "Fechamento de Caixa" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/caixa")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fechamento de Caixa</h1>
            <p className="text-muted-foreground">Fechamento diário das movimentações de caixa</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center gap-2">
            <TabsList className="flex-1 justify-start">
              {openDays.map((day) => (
                <TabsTrigger key={day} value={day} className="px-4">
                  {format(new Date(day), "dd/MM", { locale: ptBR })}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {openDays.map((day) => {
            const transactions = getTransactionsForDate(day)
            const totals = calculateTotals(day)
            const values = closingValues[day] || {}

            return (
              <TabsContent key={day} value={day} className="space-y-6">
                {/* Transactions Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Movimentações do Dia - {format(new Date(day), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Vínculo</TableHead>
                            <TableHead>Forma</TableHead>
                            <TableHead>Centro de Custo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === "entrada" ? "default" : "destructive"}>
                                  {transaction.type === "entrada" ? "Entrada" : "Saída"}
                                </Badge>
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.vinculo}</TableCell>
                              <TableCell>{transaction.forma}</TableCell>
                              <TableCell>{transaction.centro_custo}</TableCell>
                              <TableCell className="text-right font-medium">
                                <span className={transaction.type === "entrada" ? "text-green-600" : "text-red-600"}>
                                  {transaction.type === "entrada" ? "+" : "-"}
                                  {formatCurrency(transaction.value)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhuma movimentação registrada neste dia</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.entradas)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Total de Saídas</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.saidas)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Saldo do Dia</p>
                        <p className={`text-2xl font-bold ${totals.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(totals.saldo)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Closing Values */}
                <Card>
                  <CardHeader>
                    <CardTitle>Valores Finais das Contas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accounts.map((account) => (
                        <div key={account.id} className="space-y-2">
                          <Label htmlFor={`account-${account.id}-${day}`}>{account.name}</Label>
                          <Input
                            id={`account-${account.id}-${day}`}
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={values[account.id] || ''}
                            onChange={(e) => handleClosingValueChange(day, account.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Saldo esperado: <span className="font-medium">{formatCurrency(totals.saldo)}</span>
                        </p>
                        <p>
                          Total informado:{" "}
                          <span className="font-medium">
                            {formatCurrency(
                              accounts.reduce((sum, account) => {
                                return sum + Number.parseFloat(values[account.id] || "0")
                              }, 0)
                            )}
                          </span>
                        </p>
                      </div>
                      <Button onClick={() => handleCloseCash(day)} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fechando...
                          </>
                        ) : (
                          "Fechar Caixa"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </MainLayout>
  )
}
