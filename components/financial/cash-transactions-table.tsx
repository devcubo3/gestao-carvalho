"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type { CashTransaction } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface CashTransactionsTableProps {
  transactions: CashTransaction[]
}

export function CashTransactionsTable({ transactions }: CashTransactionsTableProps) {
  const columns: TableColumn<CashTransaction>[] = [
    {
      key: "date",
      label: "Data",
      width: "w-28",
      render: (transaction) => formatDate(transaction.date),
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
      key: "centroCusto",
      label: "Centro de Custo",
      width: "w-36",
      render: (transaction) => <Badge variant="outline">{transaction.centroCusto}</Badge>,
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
  ]

  return (
    <DataTable
      title="Movimentações de Caixa"
      data={transactions}
      columns={columns}
      emptyIcon={<Wallet className="h-8 w-8 text-muted-foreground" />}
      emptyMessage="Nenhuma movimentação encontrada"
      headerAction={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      }
    />
  )
}
