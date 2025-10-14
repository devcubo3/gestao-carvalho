"use client"

import { useState, useMemo } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Minus, Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { AccountPayable } from "@/lib/types"
import { mockAccountsPayable, mockVinculos } from "@/lib/mock-data"

export default function BatchPayPage() {
  const router = useRouter()
  const [selectedVinculo, setSelectedVinculo] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<AccountPayable[]>([])
  const [payDate, setPayDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [useCreditCard, setUseCreditCard] = useState(false)
  const [creditCard, setCreditCard] = useState("")

  // Filter available accounts
  const availableAccounts = useMemo(() => {
    return mockAccountsPayable
      .filter((account) => account.status === "em_aberto")
      .filter((account) => !selectedAccounts.find((selected) => selected.id === account.id))
      .filter((account) => {
        if (selectedVinculo !== "all" && account.vinculo !== selectedVinculo) return false
        if (searchTerm && !account.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
      })
  }, [selectedAccounts, selectedVinculo, searchTerm])

  // Calculate total value
  const totalValue = useMemo(() => {
    return selectedAccounts.reduce((sum, account) => sum + account.value, 0)
  }, [selectedAccounts])

  const addAccount = (account: AccountPayable) => {
    setSelectedAccounts((prev) => [...prev, account])
  }

  const removeAccount = (accountId: string) => {
    setSelectedAccounts((prev) => prev.filter((account) => account.id !== accountId))
  }

  const handleConfirm = () => {
    console.log("Batch pay:", {
      accounts: selectedAccounts,
      payDate,
      paymentMethod,
      useCreditCard,
      creditCard: useCreditCard ? creditCard : null,
      totalValue,
    })
    router.push("/financeiro/contas-pagar")
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
                    <TableCell>R$ {account.value.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{account.dueDate.toLocaleDateString("pt-BR")}</TableCell>
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
                    <TableCell>R$ {account.value.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{account.dueDate.toLocaleDateString("pt-BR")}</TableCell>
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
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conta-corrente">Conta Corrente - Banco do Brasil</SelectItem>
                  <SelectItem value="poupanca">Poupança - Caixa Econômica</SelectItem>
                  <SelectItem value="conta-digital">Conta Digital - Nubank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor total</Label>
              <div className="p-3 border rounded-lg bg-background min-w-[200px]">
                <span className="text-2xl font-bold text-foreground">R$ {totalValue.toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useCreditCard"
                checked={useCreditCard}
                onCheckedChange={(checked) => {
                  setUseCreditCard(checked as boolean)
                  if (!checked) setCreditCard("")
                }}
              />
              <Label htmlFor="useCreditCard">Utilizar cartão de crédito</Label>
            </div>

            {useCreditCard && (
              <div className="space-y-2 max-w-md">
                <Label htmlFor="creditCard">Cartão de crédito</Label>
                <Select value={creditCard} onValueChange={setCreditCard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa-1234">Visa **** 1234</SelectItem>
                    <SelectItem value="master-5678">Mastercard **** 5678</SelectItem>
                    <SelectItem value="elo-9012">Elo **** 9012</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Ações do rodapé */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedAccounts.length === 0 || !payDate || !paymentMethod || (useCreditCard && !creditCard)}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
