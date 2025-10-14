"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { Plus, MoreHorizontal, Eye, Edit, Trash2, CreditCard } from "lucide-react"
import { CreditCreateModal } from "./credit-create-modal"
import { mockPeople, mockCompanies } from "@/lib/mock-data"
import type { Credit } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"
import { useRouter } from "next/navigation"

interface CreditsTableProps {
  credits: Credit[]
}

export function CreditsTable({ credits }: CreditsTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [creditToDelete, setCreditToDelete] = React.useState<Credit | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")
  const router = useRouter()

  const handleAction = (action: string, creditId: string) => {
    const credit = credits.find((c) => c.id === creditId)
    if (!credit) return

    if (action === "view") {
      router.push(`/banco-dados/creditos/${creditId}`)
    } else if (action === "edit") {
      console.log(`Edit credit ${creditId}`)
    } else if (action === "delete") {
      setCreditToDelete(credit)
      setDeleteDialogOpen(true)
      setDeleteConfirmText("")
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmText === "Excluir" && creditToDelete) {
      console.log(`Delete credit ${creditToDelete.id}`)
      setDeleteDialogOpen(false)
      setCreditToDelete(null)
      setDeleteConfirmText("")
    }
  }

  const getCedenteName = (cedenteId: string) => {
    const person = mockPeople.find((p) => p.id === cedenteId)
    if (person) return person.name

    const company = mockCompanies.find((c) => c.id === cedenteId)
    if (company) return company.name

    return cedenteId // fallback to ID if not found
  }

  const columns: TableColumn<Credit>[] = [
    {
      key: "codigo",
      label: "Código",
      width: "w-28",
      render: (credit) => <span className="font-medium">{credit.codigo || credit.code}</span>,
    },
    {
      key: "cedente",
      label: "Cedente",
      width: "min-w-[180px]",
      render: (credit) => <span className="font-medium">{getCedenteName(credit.cedente || credit.creditor)}</span>,
    },
    {
      key: "descricao",
      label: "Descrição",
      width: "min-w-[200px]",
      render: (credit) => (
        <span className="truncate" title={credit.descricao || credit.origin}>
          {credit.descricao || credit.origin}
        </span>
      ),
    },
    {
      key: "valor",
      label: "Valor",
      width: "w-36",
      align: "right",
      render: (credit) => <span className="font-medium">{formatCurrency(credit.valor || credit.nominalValue)}</span>,
    },
    {
      key: "saldoGRA",
      label: "Saldo GRA",
      width: "w-36",
      align: "right",
      render: (credit) => <span className="font-medium">{formatCurrency(credit.saldoGRA)}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (credit) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction("view", credit.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("edit", credit.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction("delete", credit.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <DataTable
        title="Cadastro de Créditos"
        data={credits}
        columns={columns}
        searchFields={["codigo", "descricao"]}
        searchPlaceholder="Buscar por código ou descrição..."
        emptyIcon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhum crédito encontrado"
        emptyAction={
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Cadastrar primeiro crédito
          </Button>
        }
        headerAction={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Crédito
          </Button>
        }
        summary={
          <div className="text-sm text-muted-foreground">
            Valor total: {formatCurrency(credits.reduce((sum, c) => sum + (c.valor || c.nominalValue || 0), 0))}
          </div>
        }
      />

      <CreditCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          console.log("Credit created successfully")
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a excluir a carta de crédito <strong>{creditToDelete?.code}</strong>.
              </p>
              <p className="text-destructive font-medium">
                Esta ação é irreversível e todos os dados relacionados serão perdidos permanentemente.
              </p>
              <div className="space-y-2">
                <p>
                  Para confirmar, digite <strong>"Excluir"</strong> no campo abaixo:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Digite 'Excluir' para confirmar"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setCreditToDelete(null)
                setDeleteConfirmText("")
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== "Excluir"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
