"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Eye, FileText } from "lucide-react"
import type { Contract } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface ContractsTableProps {
  contracts: Contract[]
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const columns: TableColumn<Contract>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-32",
      render: (contract) => <span className="font-medium">{contract.code}</span>,
    },
    {
      key: "date",
      label: "Data",
      width: "w-28",
      render: (contract) => formatDate(contract.date),
    },
    {
      key: "sideA",
      label: "Parte GRA",
      width: "min-w-[150px]",
      sortable: false,
      render: (contract) => <div className="text-sm truncate">{contract.sideA.parties[0]?.name || "-"}</div>,
    },
    {
      key: "sideB",
      label: "Parte Outros",
      width: "min-w-[150px]",
      sortable: false,
      render: (contract) => <div className="text-sm truncate">{contract.sideB.parties[0]?.name || "-"}</div>,
    },
    {
      key: "value",
      label: "Valor",
      width: "w-36",
      align: "right",
      render: (contract) => (
        <span className="font-medium">
          {contract.sideA.totalValue > 0 ? formatCurrency(contract.sideA.totalValue) : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (contract) => (
        <Button variant="ghost" className="h-8 w-8 p-0" asChild>
          <Link href={`/contratos/${contract.id}`}>
            <span className="sr-only">Ver contrato</span>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      title="Lista de Contratos"
      data={contracts}
      columns={columns}
      emptyIcon={<FileText className="h-8 w-8 text-muted-foreground" />}
      emptyMessage="Nenhum contrato encontrado"
      emptyAction={
        <Button size="sm" asChild>
          <Link href="/contratos/novo">Criar primeiro contrato</Link>
        </Button>
      }
      headerAction={
        <Button asChild>
          <Link href="/contratos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Link>
        </Button>
      }
      summary={
        <div className="text-sm text-muted-foreground">
          Valor total: {formatCurrency(contracts.reduce((sum, c) => sum + c.sideA.totalValue, 0))}
        </div>
      }
    />
  )
}
