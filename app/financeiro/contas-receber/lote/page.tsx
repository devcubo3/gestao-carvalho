"use client"

import { useState, useMemo, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Minus, Search, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { AccountReceivable, BankAccount } from "@/lib/types"
import { mockVinculos } from "@/lib/mock-data"
import { getAccountsReceivable, createBatchReceivablePayments } from "@/app/actions/receivables"
import { getBankAccounts } from "@/app/actions/cash"
import { format } from "date-fns"

export default function BatchReceivePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedVinculo, setSelectedVinculo] = useState<string>("Todos os vínculos")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<AccountReceivable[]>([])
  const [receiveDate, setReceiveDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [bankAccountId, setBankAccountId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar dados ao montar
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    
    const [accountsResult, bankAccountsResult] = await Promise.all([
      getAccountsReceivable({ status: 'em_aberto' }),
      getBankAccounts(),
    ])

    if (accountsResult.success) {
      setAccounts(accountsResult.data || [])
    } else {
      toast({
        title: "Erro",
        description: accountsResult.error,
        variant: "destructive",
      })
    }

    if (bankAccountsResult.success) {
      const activeAccounts = (bankAccountsResult.data || []).filter(
        (acc: BankAccount) => acc.status === 'ativo'
      )
      setBankAccounts(activeAccounts)
      if (activeAccounts.length > 0) {
        setBankAccountId(activeAccounts[0].id)
      }
    }

    setIsLoading(false)
  }

  // Filter available accounts
  const availableAccounts = useMemo(() => {
    return accounts
      .filter((account) => !selectedAccounts.find((selected) => selected.id === account.id))
      .filter((account) => {
        if (selectedVinculo !== "Todos os vínculos" && account.vinculo !== selectedVinculo) return false
        if (searchTerm && !account.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
      })
  }, [accounts, selectedAccounts, selectedVinculo, searchTerm])

  // Calculate total value
  const totalValue = useMemo(() => {
    return selectedAccounts.reduce((sum, account) => sum + account.remaining_value, 0)
  }, [selectedAccounts])

  const addAccount = (account: AccountReceivable) => {
    setSelectedAccounts((prev) => [...prev, account])
  }

  const removeAccount = (accountId: string) => {
    setSelectedAccounts((prev) => prev.filter((account) => account.id !== accountId))
  }

  const handleConfirm = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione ao menos uma conta para receber",
        variant: "destructive",
      })
      return
    }

    if (!bankAccountId) {
      toast({
        title: "Erro",
        description: "Selecione uma conta bancária",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const payments = selectedAccounts.map((account) => ({
      account_receivable_id: account.id,
      payment_value: account.remaining_value,
    }))

    const result = await createBatchReceivablePayments(payments, {
      payment_date: receiveDate,
      payment_method: paymentMethod,
      bank_account_id: bankAccountId,
      notes: `Recebimento em lote de ${selectedAccounts.length} conta(s)`,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: `${result.data.processed} recebimento(s) processado(s) com sucesso`,
      })
      router.push("/financeiro/contas-receber")
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/financeiro/contas-receber")
  }

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={[{ label: "Financeiro" }, { label: "Contas a Receber" }, { label: "Recebimento em Lote" }]}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Financeiro" },
        { label: "Contas a Receber", href: "/financeiro/contas-receber" },
        { label: "Recebimento em Lote" },
      ]}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/contas-receber")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Recebimento em Lote</h1>
        </div>

        {/* Seção 1: Filtros */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo</Label>
              <Select value={selectedVinculo} onValueChange={setSelectedVinculo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos os vínculos">Todos os vínculos</SelectItem>
                  {mockVinculos.map((vinculo) => (
                    <SelectItem key={vinculo} value={vinculo}>
                      {vinculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Buscar conta</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Filtrar pela descrição"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Tabela de Contas Disponíveis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contas Disponíveis</h3>
          <div className="border rounded-lg" style={{ maxHeight: "240px", overflowY: "auto" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-sm">{account.code}</TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>{account.counterparty}</TableCell>
                    <TableCell>R$ {account.remaining_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{new Date(account.due_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => addAccount(account)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {availableAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma conta disponível
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Seção 3: Tabela de Contas Selecionadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contas Selecionadas</h3>
          <div className="border rounded-lg" style={{ maxHeight: "240px", overflowY: "auto" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-sm">{account.code}</TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>{account.counterparty}</TableCell>
                    <TableCell>R$ {account.remaining_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{new Date(account.due_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => removeAccount(account.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma conta selecionada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Seção 4: Dados para o Lote */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados para o Lote</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="receiveDate">Data de recebimento</Label>
              <Input
                id="receiveDate"
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Conta bancária</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor total</Label>
              <div className="p-3 border rounded-lg bg-muted">
                <span className="text-2xl font-bold text-foreground">
                  R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações do rodapé */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedAccounts.length === 0 || !receiveDate || !bankAccountId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Recebimento'
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
