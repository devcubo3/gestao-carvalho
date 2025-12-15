"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { Plus, Eye, Edit, Trash2, Building2 } from "lucide-react"
import { DevelopmentCreateModal } from "./development-create-modal"
import { EditDevelopmentDialog } from "./edit-development-dialog"
import { DeleteDevelopmentDialog } from "./delete-development-dialog"
import { updateDevelopment, deleteDevelopment } from "@/app/actions/developments"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Development } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface DevelopmentsTableProps {
  developments: Development[]
}

export function DevelopmentsTable({ developments }: DevelopmentsTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDevelopment, setSelectedDevelopment] = useState<Development | null>(null)
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

  const handleAction = (action: string, development: Development) => {
    if (action === "view") {
      router.push(`/banco-dados/empreendimentos/${development.id}`)
    } else if (action === "edit") {
      setSelectedDevelopment(development)
      setIsEditModalOpen(true)
    } else if (action === "delete") {
      setSelectedDevelopment(development)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedDevelopment) return
    
    setSubmitting(true)
    const result = await updateDevelopment({
      id: selectedDevelopment.id,
      ...data,
    })
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empreendimento atualizado com sucesso.",
      })
      setIsEditModalOpen(false)
      setSelectedDevelopment(null)
      router.refresh()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao atualizar empreendimento.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedDevelopment) return
    
    setSubmitting(true)
    const result = await deleteDevelopment(selectedDevelopment.id)
    setSubmitting(false)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empreendimento excluído com sucesso.",
      })
      setIsDeleteDialogOpen(false)
      setSelectedDevelopment(null)
      router.refresh()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir empreendimento.",
        variant: "destructive",
      })
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      predio: "Prédio",
      loteamento: "Loteamento",
      chacaramento: "Chacaramento",
      condominio: "Condomínio",
      comercial: "Comercial",
    }
    return labels[type] || type
  }

  const columns: TableColumn<Development>[] = [
    {
      key: "code",
      label: "Código",
      width: "w-32",
      render: (development) => <span className="font-medium">{development.code}</span>,
    },
    {
      key: "type",
      label: "Tipo",
      width: "w-36",
      render: (development) => <Badge variant="outline">{getTypeLabel(development.type)}</Badge>,
    },
    {
      key: "name",
      label: "Nome Usual",
      width: "flex-1 min-w-[200px]",
      render: (development) => <span className="font-medium">{development.name}</span>,
    },
    {
      key: "city",
      label: "Cidade",
      width: "w-40",
      render: (development) => <span>{development.city}</span>,
    },
    {
      key: "state",
      label: "Estado",
      width: "w-24",
      align: "center",
      render: (development) => <span>{development.state}</span>,
    },
    {
      key: "total_units",
      label: "Unidades",
      width: "w-32",
      align: "center",
      render: (development) => (
        <span className="tabular-nums">{development.total_units || "-"}</span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-28",
      sortable: false,
      render: (development) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("view", development)}
            className="h-8 w-8 p-0"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("edit", development)}
              className="h-8 w-8 p-0"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("delete", development)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        title="Cadastro de Empreendimentos"
        data={developments}
        columns={columns}
        searchFields={["name", "code", "city", "state"]}
        searchPlaceholder="Buscar por nome, código, cidade..."
        emptyIcon={<Building2 className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhum empreendimento encontrado"
        emptyAction={
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Cadastrar primeiro empreendimento
          </Button>
        }
        headerAction={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Empreendimento
          </Button>
        }
      />

      <DevelopmentCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => router.refresh()}
      />

      <EditDevelopmentDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        development={selectedDevelopment}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DeleteDevelopmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        development={selectedDevelopment}
        onConfirm={handleDelete}
        submitting={submitting}
      />
    </>
  )
}
