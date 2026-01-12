"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { AccountFormDialog } from "./account-form-dialog"
import { PayDialog } from "./pay-dialog"
import { PartialPayDialog } from "./partial-pay-dialog"
import { EditPayableDialog } from "./edit-payable-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils"
import { Plus, Edit, Trash2, CreditCard } from "lucide-react"
import type { AccountPayable } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"
import { 
  createAccountPayable, 
  updateAccountPayable, 
  deleteAccountPayable,
  createPayablePayment,
  getUserPermissions 
} from "@/app/actions/payables"
import { useToast } from "@/hooks/use-toast"

interface AccountsPayableTableProps {
  accounts: AccountPayable[]
  loading?: boolean
  onRefresh?: () => void
}

export function AccountsPayableTable({ accounts, loading, onRefresh }: AccountsPayableTableProps) {
  const { toast } = useToast()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [showPartialPayDialog, setShowPartialPayDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null)
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
    setShowPayDialog(false)
    setShowPartialPayDialog(false)
    setShowEditDialog(false)
    setShowDeleteDialog(false)

    // Definir a conta selecionada
    setSelectedAccount(account)

    // Abrir o dialog específico após um pequeno delay para garantir que o anterior foi fechado
    setTimeout(() => {
      switch (action) {
        case "pay":
          setShowPayDialog(true)
          break
        case "partial-pay":
          setShowPartialPayDialog(true)
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

  const handleAddAccount = async (data: any) => {
    setSubmitting(true)
    const result = await createAccountPayable(data)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Conta criada",
        description: "Nova conta a pagar adicionada com sucesso",
      })
      setShowAddDialog(false)
      onRefresh?.()
    } else {
      toast({
        title: "Erro ao criar conta",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handlePay = async (data: { paymentDate: string; paymentMethod: string; bankAccountId: string }) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await createPayablePayment({
      account_payable_id: selectedAccount.id,
      payment_date: data.paymentDate,
      payment_value: selectedAccount.remaining_value,
      payment_method: data.paymentMethod,
      bank_account_id: data.bankAccountId,
    })
    setSubmitting(false)
    
    if (result.success) {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso",
      })
      setShowPayDialog(false)
      onRefresh?.()
    } else {
      toast({
        title: "Erro ao registrar pagamento",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handlePartialPay = async (data: {
    paidAmount: number
    paymentDate: string
    paymentMethod: string
    bankAccountId: string
  }) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await createPayablePayment({
      account_payable_id: selectedAccount.id,
      payment_date: data.paymentDate,
      payment_value: data.paidAmount,
      payment_method: data.paymentMethod,
      bank_account_id: data.bankAccountId,
    })
    setSubmitting(false)
    
    if (result.success) {
      toast({
        title: "Pagamento parcial registrado",
        description: "O pagamento foi registrado com sucesso",
      })
      setShowPartialPayDialog(false)
      onRefresh?.()
    } else {
      toast({
        title: "Erro ao registrar pagamento",
        description: result.error || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedAccount) return
    
    setSubmitting(true)
    const result = await updateAccountPayable(selectedAccount.id, data)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Conta atualizada",
        description: "As informações foram salvas com sucesso",
      })
      setShowEditDialog(false)
      onRefresh?.()
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
    const result = await deleteAccountPayable(selectedAccount.id)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "✅ Conta excluída permanentemente",
        description: `Conta ${selectedAccount.code} foi removida permanentemente do sistema`,
      })
      setShowDeleteDialog(false)
      setSelectedAccount(null)
      onRefresh?.()
    } else {
      toast({
        title: "❌ Erro ao excluir conta",
        description: result.error || "Ocorreu um erro inesperado ao excluir a conta",
        variant: "destructive",
      })
    }
  }

  const columns: TableColumn<AccountPayable>[] = [
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
        title="Contas a Pagar"
        data={accounts}
        columns={columns}
        searchFields={["description", "code"]}
        searchPlaceholder="Buscar por descrição, código..."
        emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
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
        title="Nova Conta a Pagar"
        description="Adicione uma nova conta a pagar ao sistema."
        onSubmit={handleAddAccount}
        submitting={submitting}
      />

      <PayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        account={selectedAccount}
        onSubmit={handlePay}
        submitting={submitting}
      />

      <PartialPayDialog
        open={showPartialPayDialog}
        onOpenChange={setShowPartialPayDialog}
        account={selectedAccount}
        onSubmit={handlePartialPay}
        submitting={submitting}
      />

      <EditPayableDialog
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
        relatedAccounts={
          selectedAccount && 'installment_group_id' in selectedAccount && selectedAccount.installment_group_id
            ? accounts.filter(acc => 
                'installment_group_id' in acc && 
                acc.installment_group_id === selectedAccount.installment_group_id
              )
            : []
        }
      />
    </div>
  )
}
