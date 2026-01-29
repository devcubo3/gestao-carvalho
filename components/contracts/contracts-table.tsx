"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency, formatDate, formatInputDate } from "@/lib/utils"
import { Plus, Eye, FileText, MoreVertical, Trash2 } from "lucide-react"
import type { Contract } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DeleteContractDialog } from "./delete-contract-dialog"

interface ContractsTableProps {
  contracts: Contract[]
  isAdmin?: boolean
}

export function ContractsTable({ contracts, isAdmin = false }: ContractsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<{ id: string; code: string } | null>(null)

  const handleDeleteClick = (contract: Contract) => {
    setSelectedContract({ id: contract.id, code: contract.code })
    setDeleteDialogOpen(true)
  }
  const columns: TableColumn<any>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-32",
      render: (contract) => (
        isAdmin ? (
          <Link href={`/contratos/${contract.id}`} className="font-medium text-primary hover:underline">
            {contract.code}
          </Link>
        ) : (
          <span className="font-medium">{contract.code}</span>
        )
      ),
    },
    {
      key: "contract_date",
      label: "Data",
      width: "w-28",
      render: (contract) => formatInputDate(contract.contract_date),
    },
    {
      key: "parties",
      label: "Partes",
      width: "flex-1",
      sortable: false,
      render: (contract) => {
        const partiesA = contract.parties?.filter((p: any) => p.side === 'A') || []
        const partiesB = contract.parties?.filter((p: any) => p.side === 'B') || []
        
        return (
          <div className="space-y-1 text-sm">
            {partiesA.length > 0 && (
              <div>
                <span className="text-muted-foreground">A: </span>
                <span>{partiesA.map((p: any) => p.party_name).join(', ')}</span>
              </div>
            )}
            {partiesB.length > 0 && (
              <div>
                <span className="text-muted-foreground">B: </span>
                <span>{partiesB.map((p: any) => p.party_name).join(', ')}</span>
              </div>
            )}
            {partiesA.length === 0 && partiesB.length === 0 && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        )
      },
    },
    {
      key: "balance",
      label: "Valor",
      width: "w-40",
      align: "right",
      render: (contract) => (
        <span className="font-medium">
          {formatCurrency(Math.max(contract.side_a_total || 0, contract.side_b_total || 0))}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-16",
      sortable: false,
      render: (contract) => (
        isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/contratos/${contract.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(contract)}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Contrato
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
  ]

  return (
    <>
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
      />

      {selectedContract && (
        <DeleteContractDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          contractId={selectedContract.id}
          contractCode={selectedContract.code}
        />
      )}
    </>
  )
}
