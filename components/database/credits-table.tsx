"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { Plus, Edit, Trash2, CreditCard, Eye, MoreHorizontal } from "lucide-react"
import { CreditCreateModal } from "./credit-create-modal"
import { EditCreditDialog } from "./edit-credit-dialog"
import { DeleteCreditDialog } from "./delete-credit-dialog"
import { updateCredit, deleteCredit } from "@/app/actions/credits"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Credit } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface CreditsTableProps {
  credits: Credit[]
}

export function CreditsTable({ credits }: CreditsTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const canEdit = userRole === "admin" || userRole === "editor"
  const canDelete = userRole === "admin"

  const handleAction = (action: string, credit: Credit) => {
    if (action === "view") {
      router.push(`/banco-dados/creditos/${credit.id}`)
    } else if (action === "edit") {
      setSelectedCredit(credit)
      setIsEditModalOpen(true)
    } else if (action === "delete") {
      setSelectedCredit(credit)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedCredit) return
    
    setSubmitting(true)
    const result = await updateCredit(selectedCredit.id, data)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Crédito atualizado com sucesso.",
      })
      setIsEditModalOpen(false)
      setSelectedCredit(null)
      router.refresh()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao atualizar crédito.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCredit) return
    
    setSubmitting(true)
    const result = await deleteCredit(selectedCredit.id)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Crédito excluído com sucesso.",
      })
      setIsDeleteDialogOpen(false)
      setSelectedCredit(null)
      router.refresh()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir crédito.",
        variant: "destructive",
      })
    }
  }

  const columns: TableColumn<Credit>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-32",
      render: (credit) => <span className="font-medium">{credit.code}</span>,
    },
    {
      key: "creditor_name",
      label: "Cedente",
      width: "w-48",
      render: (credit) => <span className="font-medium">{credit.creditor_name || '-'}</span>,
    },
    {
      key: "origin",
      label: "Descrição",
      width: "flex-1 min-w-[250px]",
      render: (credit) => (
        <span className="truncate block" title={credit.origin}>
          {credit.origin}
        </span>
      ),
    },
    {
      key: "nominal_value",
      label: "Valor",
      width: "w-40",
      align: "center",
      render: (credit) => <span className="font-medium tabular-nums">{formatCurrency(credit.nominal_value)}</span>,
    },
    {
      key: "current_balance",
      label: "Saldo Atual",
      width: "w-40",
      align: "center",
      render: (credit) => <span className="font-medium tabular-nums">{formatCurrency(credit.current_balance)}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (credit) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("view", credit)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={() => handleAction("edit", credit)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem 
                onClick={() => handleAction("delete", credit)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            )}
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
        searchFields={["code", "creditor_name", "origin"]}
        searchPlaceholder="Buscar por código, cedente ou descrição..."
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
            Valor total: {formatCurrency(credits.reduce((sum, c) => sum + (c.nominal_value || 0), 0))}
          </div>
        }
      />

      <CreditCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          router.refresh()
        }}
      />

      <EditCreditDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        credit={selectedCredit}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DeleteCreditDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        credit={selectedCredit}
        onConfirm={handleDelete}
        submitting={submitting}
      />
    </>
  )
}
