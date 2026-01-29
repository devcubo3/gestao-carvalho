"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { AccountFormDialog } from "./account-form-dialog"
import { ReceiveDialog } from "./receive-dialog"
import { PartialReceiveDialog } from "./partial-receive-dialog"
import { EditAccountDialog } from "./edit-account-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils"
import { Plus, Edit, Receipt, Trash2 } from "lucide-react"
import type { AccountReceivable } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"
import { 
  createAccountReceivable, 
  updateAccountReceivable, 
  deleteAccountReceivable,
  createReceivablePayment,
  getUserPermissions 
} from "@/app/actions/receivables"
import { useToast } from "@/hooks/use-toast"

interface AccountsReceivableTableProps {
  accounts: AccountReceivable[]
  loading?: boolean
  onSuccess?: () => void
}

export function AccountsReceivableTable({ accounts, loading = false, onSuccess }: AccountsReceivableTableProps) {
  const { toast } = useToast()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showPartialReceiveDialog, setShowPartialReceiveDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null)
  const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false })
  const [submitting, setSubmitting] = useState(false)

  // Carregar permissões do usuário
  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setPermissions({
        canEdit: result.data.canEdit,
        canDelete: result.data.canDelete,
      })
    }
  }

  const handleAction = (action: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return

    // Fechar todos os dialogs primeiro
    setShowReceiveDialog(false)
    setShowPartialReceiveDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)

    // Definir a conta selecionada
    setSelectedAccount(account)

    // Abrir o dialog específico após um pequeno delay para garantir que o anterior foi fechado
    setTimeout(() => {
      switch (action) {
        case "receive":
          setShowReceiveDialog(true)
          break
        case "partial-receive":
          setShowPartialReceiveDialog(true)
          break
        case "edit":
          setShowEditDialog(true)
          break
        case "delete":
          setShowDeleteDialog(true)
          break
      }
    }, 50)
  }

  const handleReceive = async (data: { receiveDate: string; paymentMethod: string; bankAccountId: string }) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await createReceivablePayment({
      account_receivable_id: selectedAccount.id,
      payment_date: data.receiveDate,
      payment_value: selectedAccount.remaining_value,
      payment_method: data.paymentMethod,
      bank_account_id: data.bankAccountId,
    })
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Recebimento registrado",
        description: `Conta ${selectedAccount.code} quitada com sucesso`,
      })
      setShowReceiveDialog(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro ao registrar recebimento",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handlePartialReceive = async (data: { receivedAmount: number; receiveDate: string; paymentMethod: string; bankAccountId: string }) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await createReceivablePayment({
      account_receivable_id: selectedAccount.id,
      payment_date: data.receiveDate,
      payment_value: data.receivedAmount,
      payment_method: data.paymentMethod,
      bank_account_id: data.bankAccountId,
    })
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Recebimento parcial registrado",
        description: `${formatCurrency(data.receivedAmount)} recebido da conta ${selectedAccount.code}`,
      })
      setShowPartialReceiveDialog(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro ao registrar recebimento",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await updateAccountReceivable(selectedAccount.id, data)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Conta atualizada",
        description: "As informações foram salvas com sucesso",
      })
      setShowEditDialog(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro ao atualizar conta",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await deleteAccountReceivable(selectedAccount.id)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "✅ Conta excluída permanentemente",
        description: `Conta ${selectedAccount.code} foi removida permanentemente do sistema`,
      })
      setShowDeleteDialog(false)
      setSelectedAccount(null)
      onSuccess?.()
    } else {
      toast({
        title: "❌ Erro ao excluir conta",
        description: result.error || "Ocorreu um erro inesperado ao excluir a conta",
        variant: "destructive",
      })
    }
  }

  const handleAddAccount = async (data: any) => {
    console.log('📝 Dados recebidos no handleAddAccount:', data)
    setSubmitting(true)
    
    // Transformar os dados do formulário para o formato esperado pela action
    const accountData = {
      description: data.description,
      counterparty: data.counterparty,
      original_value: (data.installment_total || 1) * (data.installment_value || 0),
      due_date: data.due_date,
      vinculo: data.vinculo,
      centro_custo: data.centro_custo,
      installment_current: 1,
      installment_total: data.installment_total || 1,
      notes: null,
      contract_id: null,
      person_id: null,
      company_id: null,
    }
    
    console.log('📦 Dados transformados para envio:', accountData)
    const result = await createAccountReceivable(accountData)
    console.log('📊 Resultado da criação:', result)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Conta criada",
        description: "Nova conta a receber adicionada com sucesso",
      })
      setShowAddDialog(false)
      onSuccess?.()
    } else {
      console.error('❌ Erro ao criar conta:', result.error, result.fieldErrors)
      toast({
        title: "Erro ao criar conta",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const columns: TableColumn<AccountReceivable>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-24",
      render: (account) => <span className="font-mono text-sm">{account.code}</span>,
    },
    {
      key: "due_date",
      label: "Vencimento",
      width: "w-32",
      render: (account) => (
        <div className="flex items-center gap-2">
          <span
            className={isOverdue(account.due_date) && account.status === "em_aberto" ? "text-red-600 font-medium" : ""}
          >
            {formatDate(account.due_date)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "w-32",
      render: (account) => {
        const statusColors = {
          em_aberto: "bg-blue-100 text-blue-800",
          vencido: "bg-red-100 text-red-800",
          parcialmente_pago: "bg-yellow-100 text-yellow-800",
          quitado: "bg-green-100 text-green-800",
          cancelado: "bg-gray-100 text-gray-800",
        }
        const statusLabels = {
          em_aberto: "Em Aberto",
          vencido: "Vencido",
          parcialmente_pago: "Parcial",
          quitado: "Quitado",
          cancelado: "Cancelado",
        }
        return (
          <Badge variant="outline" className={`text-xs ${statusColors[account.status]}`}>
            {statusLabels[account.status]}
          </Badge>
        )
      },
    },
    {
      key: "vinculo",
      label: "Vínculo",
      width: "w-32",
      render: (account) => (
        <Badge variant="outline" className="text-xs">
          {account.vinculo}
        </Badge>
      ),
    },
    {
      key: "centro_custo",
      label: "Centro de Custo",
      width: "w-32",
      render: (account) => (
        <Badge variant="secondary" className="text-xs">
          {account.centro_custo}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Descrição",
      width: "min-w-[200px]",
      render: (account) => <span className="font-medium">{account.description}</span>,
    },
    {
      key: "remaining_value",
      label: "Valor Restante",
      width: "w-32",
      align: "right",
      render: (account) => <span className="font-medium">{formatCurrency(account.remaining_value)}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[100px]",
      sortable: false,
      render: (account) => {
        return (
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("edit", account.id)}
                className="h-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {permissions.canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("delete", account.id)}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <DataTable
        title="Contas a Receber"
        data={accounts}
        columns={columns}
        searchFields={["description", "counterparty", "code"]}
        searchPlaceholder="Buscar por descrição, código..."
        emptyIcon={<Receipt className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma conta encontrada"
        loading={loading}
        headerAction={
          permissions.canEdit && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          )
        }
        summary={
          <div className="text-sm text-muted-foreground">
            Total em aberto:{" "}
            {formatCurrency(
              accounts
                .filter((a) => a.status === "em_aberto" || a.status === "vencido" || a.status === "parcialmente_pago")
                .reduce((sum, a) => sum + a.remaining_value, 0)
            )}
          </div>
        }
      />

      <AccountFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Nova Conta a Receber"
        description="Adicione uma nova conta a receber ao sistema."
        onSubmit={handleAddAccount}
        submitting={submitting}
      />

      <ReceiveDialog
        open={showReceiveDialog}
        onOpenChange={setShowReceiveDialog}
        account={selectedAccount}
        onSubmit={handleReceive}
        submitting={submitting}
      />

      <PartialReceiveDialog
        open={showPartialReceiveDialog}
        onOpenChange={setShowPartialReceiveDialog}
        account={selectedAccount}
        onSubmit={handlePartialReceive}
        submitting={submitting}
      />

      <EditAccountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        account={selectedAccount}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        account={selectedAccount}
        onConfirm={handleDelete}
        submitting={submitting}
      />
    </div>
  )
}
