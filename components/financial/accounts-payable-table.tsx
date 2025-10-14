"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { AccountFormDialog } from "./account-form-dialog"
import { PayDialog } from "./pay-dialog"
import { PartialPayDialog } from "./partial-pay-dialog"
import { EditAccountDialog } from "./edit-account-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils"
import { Plus, MoreHorizontal, DollarSign, Edit, Trash2, CreditCard, Percent } from "lucide-react"
import type { AccountPayable } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface AccountsPayableTableProps {
  accounts: AccountPayable[]
}

export function AccountsPayableTable({ accounts }: AccountsPayableTableProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [showPartialPayDialog, setShowPartialPayDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null)

  const handleAction = (action: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return

    setSelectedAccount(account)

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
  }

  const handlePay = (data: { paymentDate: string; paymentMethod: string; creditCard?: string }) => {
    console.log("Paying account:", selectedAccount?.id, data)
    // Mock - in real app would update database
  }

  const handlePartialPay = (data: {
    paidAmount: number
    paymentDate: string
    paymentMethod: string
    creditCard?: string
  }) => {
    console.log("Partial pay account:", selectedAccount?.id, data)
    // Mock - in real app would update database
  }

  const handleEdit = (data: any) => {
    console.log("Editing account:", selectedAccount?.id, data)
    // Mock - in real app would update database
  }

  const handleDelete = () => {
    console.log("Deleting account:", selectedAccount?.id)
    // Mock - in real app would delete from database
  }

  const columns: TableColumn<AccountPayable>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-24",
      render: (account) => <span className="font-mono text-sm">{account.code}</span>,
    },
    {
      key: "dueDate",
      label: "Vencimento",
      width: "w-32",
      render: (account) => (
        <div className="flex items-center gap-2">
          <span
            className={isOverdue(account.dueDate) && account.status === "em_aberto" ? "text-red-600 font-medium" : ""}
          >
            {formatDate(account.dueDate)}
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
      key: "centroCusto",
      label: "Centro de Custo",
      width: "w-32",
      render: (account) => (
        <Badge variant="secondary" className="text-xs">
          {account.centroCusto}
        </Badge>
      ),
    },
    {
      key: "dataRegistro",
      label: "Data de Registro",
      width: "w-32",
      render: (account) => formatDate(account.dataRegistro),
    },
    {
      key: "description",
      label: "Descrição",
      width: "min-w-[200px]",
      render: (account) => <span className="font-medium">{account.description}</span>,
    },
    {
      key: "value",
      label: "Valor",
      width: "w-32",
      align: "right",
      render: (account) => <span className="font-medium">{formatCurrency(account.value)}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (account) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction("pay", account.id)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Pagar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("partial-pay", account.id)}>
              <Percent className="mr-2 h-4 w-4" />
              Pagamento Parcial
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("edit", account.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("delete", account.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <DataTable
        title="Contas a Pagar"
        data={accounts}
        columns={columns}
        searchFields={["description", "counterparty", "code"]}
        searchPlaceholder="Buscar por descrição, código..."
        emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma conta encontrada"
        headerAction={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        }
        summary={
          <div className="text-sm text-muted-foreground">
            Total em aberto:{" "}
            {formatCurrency(accounts.filter((a) => a.status === "em_aberto").reduce((sum, a) => sum + a.value, 0))}
          </div>
        }
      />

      <AccountFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Nova Conta a Pagar"
        description="Adicione uma nova conta a pagar ao sistema."
        onSubmit={handlePay} // Changed from handleAddAccount to handlePay
      />

      <PayDialog open={showPayDialog} onOpenChange={setShowPayDialog} account={selectedAccount} onSubmit={handlePay} />

      <PartialPayDialog
        open={showPartialPayDialog}
        onOpenChange={setShowPartialPayDialog}
        account={selectedAccount}
        onSubmit={handlePartialPay}
      />

      <EditAccountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        account={selectedAccount}
        onSubmit={handleEdit}
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        account={selectedAccount}
        onConfirm={handleDelete}
      />
    </div>
  )
}
