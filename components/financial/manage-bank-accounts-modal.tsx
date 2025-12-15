"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Edit, Trash2, Building2 } from "lucide-react"
import { getBankAccounts, createBankAccount, updateBankAccount, getUserPermissions } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { BankAccount } from "@/lib/types"

interface ManageBankAccountsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ManageBankAccountsModal({
  open,
  onOpenChange,
  onSuccess,
}: ManageBankAccountsModalProps) {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'banco' as 'banco' | 'especie' | 'poupanca' | 'investimento',
    code: '',
    initial_balance: '',
    notes: '',
    status: 'ativo' as 'ativo' | 'inativo',
  })

  useEffect(() => {
    if (open) {
      loadAccounts()
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setIsAdmin(result.data.role === 'admin')
    }
  }

  const loadAccounts = async () => {
    setIsLoading(true)
    const result = await getBankAccounts()
    
    if (result.success) {
      setAccounts(result.data || [])
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const accountData = {
      name: formData.name,
      type: formData.type,
      code: formData.code || undefined,
      initial_balance: Number(formData.initial_balance),
      notes: formData.notes || undefined,
      status: formData.status,
    }

    const result = editingAccount
      ? await updateBankAccount(editingAccount.id, accountData)
      : await createBankAccount(accountData)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: editingAccount
          ? "Conta bancária atualizada com sucesso"
          : "Conta bancária criada com sucesso",
      })
      
      // Reset form
      setFormData({
        name: '',
        type: 'banco',
        code: '',
        initial_balance: '',
        notes: '',
        status: 'ativo',
      })
      setShowForm(false)
      setEditingAccount(null)
      loadAccounts()
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || `Erro ao ${editingAccount ? 'atualizar' : 'criar'} conta bancária`,
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      banco: 'Banco',
      especie: 'Espécie',
      poupanca: 'Poupança',
      investimento: 'Investimento'
    }
    return labels[type] || type
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'banco': return 'default'
      case 'especie': return 'secondary'
      case 'poupanca': return 'outline'
      case 'investimento': return 'outline'
      default: return 'default'
    }
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      code: account.code || '',
      initial_balance: account.initial_balance.toString(),
      notes: account.notes || '',
      status: account.status,
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setFormData({
      name: '',
      type: 'banco',
      code: '',
      initial_balance: '',
      notes: '',
      status: 'ativo',
    })
    setShowForm(false)
    setEditingAccount(null)
  }

  const handleDelete = async (account: BankAccount) => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem excluir contas",
        variant: "destructive",
      })
      return
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a conta "${account.name}"?\n\nAtenção: Esta ação não pode ser desfeita e pode afetar o histórico de transações.`
    )

    if (!confirmed) return

    setIsLoading(true)

    const result = await updateBankAccount(account.id, { status: 'inativo' })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Conta inativada com sucesso",
      })
      loadAccounts()
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao inativar conta",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciar Contas Bancárias
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Contas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Contas Cadastradas</h3>
              {!showForm && (
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conta cadastrada</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Saldo Atual</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(account.type)}>
                            {getTypeLabel(account.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(account.balance)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(account.initial_balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(account)}
                              disabled={showForm}
                              title="Editar conta"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(account)}
                                disabled={showForm || isLoading}
                                className="text-destructive hover:text-destructive"
                                title="Excluir conta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Formulário de Nova/Editar Conta */}
          {showForm && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nome da Conta *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Sicoob - Geraldo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="especie">Espécie</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Saldo Inicial */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="initial_balance">Saldo Inicial *</Label>
                    <Input
                      id="initial_balance"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.initial_balance}
                      onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Este será o saldo inicial da conta para cálculos históricos
                    </p>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Informações adicionais sobre a conta (opcional)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Status (apenas para edição) */}
                  {editingAccount && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Contas inativas não aparecem nas listas de seleção
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : editingAccount ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Atualizar Conta
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Conta
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
