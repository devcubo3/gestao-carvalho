"use client"

import { useState, useMemo, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Minus, Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { AccountPayable } from "@/lib/types"
import { getAccountsPayable, createBatchPayablePayments } from "@/app/actions/payables"
import { getBankAccounts, type BankAccount } from "@/app/actions/bank-accounts"
import { mockVinculos } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function BatchPayPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [availableAccounts, setAvailableAccounts] = useState<AccountPayable[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVinculo, setSelectedVinculo] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<AccountPayable[]>([])
  const [payDate, setPayDate] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadAccounts()
    loadBankAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const result = await getAccountsPayable({ status: 'em_aberto' })
      if (result.success) {
        setAvailableAccounts(result.data || [])
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao carregar contas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar contas:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBankAccounts = async () => {
    try {
      const result = await getBankAccounts()
      if (result.success) {
        setBankAccounts(result.data || [])
      } else {
        toast({
          title: "Aviso",
          description: result.error || "Erro ao carregar contas bancárias",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar contas bancárias:", error)
    }
  }

  // Filter available accounts based on search and vinculo
  const filteredAccounts = useMemo(() => {
    return availableAccounts
      .filter((account) => !selectedAccounts.find((selected) => selected.id === account.id))
      .filter((account) => {
        if (selectedVinculo !== "all" && account.vinculo !== selectedVinculo) return false
        if (searchTerm && !account.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
      })
  }, [availableAccounts, selectedAccounts, selectedVinculo, searchTerm])

  // Calculate total value
  const totalValue = useMemo(() => {
    return selectedAccounts.reduce((sum, account) => sum + account.remaining_value, 0)
  }, [selectedAccounts])

  const addAccount = (account: AccountPayable) => {
    setSelectedAccounts((prev) => [...prev, account])
  }

  const removeAccount = (accountId: string) => {
    setSelectedAccounts((prev) => prev.filter((account) => account.id !== accountId))
  }

  const handleConfirm = async () => {
    if (!bankAccountId || !payDate || selectedAccounts.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      const payments = selectedAccounts.map(account => ({
        account_payable_id: account.id,
        payment_value: account.remaining_value,
      }))

      const result = await createBatchPayablePayments(payments, {
        payment_date: payDate,
        payment_method: 'Transferência bancária',
        bank_account_id: bankAccountId,
      })

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `${payments.length} pagamento(s) processado(s) com sucesso`,
        })
        router.push("/financeiro/contas-pagar")
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao processar pagamentos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao processar lote:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar pagamentos",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    router.push("/financeiro/contas-pagar")
  }

  return (
    <MainLayout
      breadcrumbs={[
        { label: "Financeiro" },
        { label: "Contas a Pagar", href: "/financeiro/contas-pagar" },
        { label: "Pagamento em Lote" },
      ]}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro/contas-pagar")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Pagamento em Lote</h1>
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
                  <SelectItem value="all">Todos os vínculos</SelectItem>
                  {mockVinculos.map((vinculo) => (
                    <SelectItem key={vinculo} value={vinculo}>
                      {vinculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código, descrição, contraparte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Tabela de Contas Disponíveis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contas Disponíveis ({filteredAccounts.length})</h3>
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
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-sm">{account.code}</TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>{account.counterparty}</TableCell>
                    <TableCell>{formatCurrency(account.remaining_value)}</TableCell>
                    <TableCell>{formatDate(account.due_date)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => addAccount(account)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {loading ? "Carregando..." : "Nenhuma conta disponível"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Seção 3: Tabela de Contas Selecionadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contas Selecionadas ({selectedAccounts.length})</h3>
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
                    <TableCell>{formatCurrency(account.remaining_value)}</TableCell>
                    <TableCell>{formatDate(account.due_date)}</TableCell>
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
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="payDate">Data de pagamento</Label>
              <Input
                id="payDate"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="bankAccountId">Conta bancária</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.length === 0 ? (
                    <SelectItem value="_no_accounts" disabled>
                      Nenhuma conta disponível
                    </SelectItem>
                  ) : (
                    bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                        {account.code && ` - ${account.code}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor total</Label>
              <div className="p-3 border rounded-lg bg-background min-w-[200px]">
                <span className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações do rodapé */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedAccounts.length === 0 || !payDate || !bankAccountId || processing}
          >
            {processing ? "Processando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
