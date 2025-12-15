"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2 } from "lucide-react"
import { DeleteTransactionModal } from "./delete-transaction-modal"
import { getUserPermissions } from "@/app/actions/cash"
import type { CashTransaction } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface CashTransactionsTableProps {
  transactions: CashTransaction[]
  onCreateClick?: () => void
  onTransactionDeleted?: () => void
}

export function CashTransactionsTable({ 
  transactions, 
  onCreateClick,
  onTransactionDeleted 
}: CashTransactionsTableProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<CashTransaction | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success) {
      setIsAdmin(result.data?.role === 'admin')
    }
  }

  const handleDeleteClick = (transaction: CashTransaction) => {
    setTransactionToDelete(transaction)
    setShowDeleteModal(true)
  }

  const handleDeleteSuccess = () => {
    setTransactionToDelete(null)
    onTransactionDeleted?.()
  }
  const columns: TableColumn<CashTransaction>[] = [
    {
      key: "transaction_date",
      label: "Data",
      width: "w-28",
      render: (transaction) => formatDate(transaction.transaction_date),
    },
    {
      key: "type",
      label: "Tipo",
      width: "w-32",
      render: (transaction) => (
        <Badge
          variant="secondary"
          className={transaction.type === "entrada" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}
        >
          {transaction.type === "entrada" ? (
            <TrendingUp className="mr-1 h-3 w-3" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3" />
          )}
          {transaction.type === "entrada" ? "Entrada" : "Saída"}
        </Badge>
      ),
    },
    {
      key: "vinculo",
      label: "Vínculo",
      width: "w-32",
      render: (transaction) => <Badge variant="outline">{transaction.vinculo}</Badge>,
    },
    {
      key: "forma",
      label: "Forma",
      width: "w-28",
      render: (transaction) => (
        <Badge variant={transaction.forma === "Caixa" ? "default" : "secondary"}>{transaction.forma}</Badge>
      ),
    },
    {
      key: "centro_custo",
      label: "Centro de Custo",
      width: "w-36",
      render: (transaction) => <Badge variant="outline">{transaction.centro_custo}</Badge>,
    },
    {
      key: "description",
      label: "Descrição",
      width: "min-w-[200px]",
      render: (transaction) => <span className="font-medium">{transaction.description}</span>,
    },
    {
      key: "value",
      label: "Valor",
      width: "w-32",
      align: "right",
      render: (transaction) => (
        <span className={`font-medium ${transaction.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
          {transaction.type === "entrada" ? "+" : "-"}
          {formatCurrency(transaction.value)}
        </span>
      ),
    },
    ...(isAdmin ? [{
      key: "actions" as keyof CashTransaction,
      label: "Ações",
      width: "w-20",
      align: "center" as const,
      render: (transaction: CashTransaction) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteClick(transaction)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Excluir lançamento"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    }] : []),
  ]

  return (
    <>
      <DataTable
        title="Movimentações de Caixa"
        data={transactions}
        columns={columns}
        emptyIcon={<Wallet className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma movimentação encontrada"
        headerAction={
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        }
      />

      <DeleteTransactionModal
        transaction={transactionToDelete}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
