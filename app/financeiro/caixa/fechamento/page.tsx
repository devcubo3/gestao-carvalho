"use client"
import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { mockCashTransactions } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Mock data for open cash days
const mockOpenCashDays = [
  { date: "2024-03-15", label: "15/03" },
  { date: "2024-03-16", label: "16/03" },
  { date: "2024-03-17", label: "17/03" },
  { date: "2024-03-18", label: "18/03" },
  { date: "2024-03-19", label: "19/03" },
]

interface CashClosingValues {
  sicoobGeraldo: string
  sicoobGRA: string
  sicoobCarvalho: string
  caixa: string
}

export default function CashClosingPage() {
  const router = useRouter()
  const [openDays, setOpenDays] = useState(mockOpenCashDays)
  const [activeTab, setActiveTab] = useState(mockOpenCashDays[0]?.date || "")
  const [closingValues, setClosingValues] = useState<Record<string, CashClosingValues>>({})

  // Get transactions for a specific date
  const getTransactionsForDate = (date: string) => {
    return mockCashTransactions.filter((transaction) => formatDate(transaction.date) === formatDate(new Date(date)))
  }

  // Calculate totals for a specific date
  const calculateTotals = (date: string) => {
    const transactions = getTransactionsForDate(date)
    const entradas = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)
    const saidas = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)
    const saldo = entradas - saidas

    return { entradas, saidas, saldo }
  }

  // Handle input changes for closing values
  const handleClosingValueChange = (date: string, field: keyof CashClosingValues, value: string) => {
    setClosingValues((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value,
      },
    }))
  }

  // Handle cash closing
  const handleCloseCash = (date: string) => {
    const values = closingValues[date]
    if (!values) return

    const totalInformed =
      Number.parseFloat(values.sicoobGeraldo || "0") +
      Number.parseFloat(values.sicoobGRA || "0") +
      Number.parseFloat(values.sicoobCarvalho || "0") +
      Number.parseFloat(values.caixa || "0")

    const { saldo } = calculateTotals(date)

    if (Math.abs(totalInformed - saldo) < 0.01) {
      // Values match, close the cash
      const updatedDays = openDays.filter((day) => day.date !== date)
      setOpenDays(updatedDays)

      // Set active tab to the first remaining day
      if (updatedDays.length > 0) {
        setActiveTab(updatedDays[0].date)
      }

      // Remove closing values for this date
      const updatedValues = { ...closingValues }
      delete updatedValues[date]
      setClosingValues(updatedValues)

      alert("Caixa fechado com sucesso!")
    } else {
      alert(`Os valores não conferem. Diferença: ${formatCurrency(Math.abs(totalInformed - saldo))}`)
    }
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
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <TabsList className="flex-1 justify-start">
              {openDays.map((day) => (
                <TabsTrigger key={day.date} value={day.date} className="px-4">
                  {day.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {openDays.map((day) => {
            const transactions = getTransactionsForDate(day.date)
            const totals = calculateTotals(day.date)
            const values = closingValues[day.date] || {
              sicoobGeraldo: "",
              sicoobGRA: "",
              sicoobCarvalho: "",
              caixa: "",
            }

            return (
              <TabsContent key={day.date} value={day.date} className="space-y-6">
                {/* Transactions Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Movimentações do Dia - {formatDate(new Date(day.date))}</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "entrada" ? "default" : "destructive"}>
                                {transaction.type === "entrada" ? "Entrada" : "Saída"}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.vinculo}</TableCell>
                            <TableCell>{transaction.forma}</TableCell>
                            <TableCell>{transaction.centroCusto}</TableCell>
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
                      <div className="space-y-2">
                        <Label htmlFor={`sicoob-geraldo-${day.date}`}>Sicoob Geraldo</Label>
                        <Input
                          id={`sicoob-geraldo-${day.date}`}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={values.sicoobGeraldo}
                          onChange={(e) => handleClosingValueChange(day.date, "sicoobGeraldo", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`sicoob-gra-${day.date}`}>Sicoob GRA</Label>
                        <Input
                          id={`sicoob-gra-${day.date}`}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={values.sicoobGRA}
                          onChange={(e) => handleClosingValueChange(day.date, "sicoobGRA", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`sicoob-carvalho-${day.date}`}>Sicoob Carvalho</Label>
                        <Input
                          id={`sicoob-carvalho-${day.date}`}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={values.sicoobCarvalho}
                          onChange={(e) => handleClosingValueChange(day.date, "sicoobCarvalho", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`caixa-${day.date}`}>Caixa (dinheiro em mãos)</Label>
                        <Input
                          id={`caixa-${day.date}`}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={values.caixa}
                          onChange={(e) => handleClosingValueChange(day.date, "caixa", e.target.value)}
                        />
                      </div>
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
                              Number.parseFloat(values.sicoobGeraldo || "0") +
                                Number.parseFloat(values.sicoobGRA || "0") +
                                Number.parseFloat(values.sicoobCarvalho || "0") +
                                Number.parseFloat(values.caixa || "0"),
                            )}
                          </span>
                        </p>
                      </div>
                      <Button onClick={() => handleCloseCash(day.date)}>Fechar Caixa</Button>
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
