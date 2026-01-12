"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Edit, Trash2, Building, Loader2, RotateCcw } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"
import type { Company } from "@/lib/types"
import { getCompanies } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import { CompanyEditModal } from "./company-edit-modal"
import { DeleteCompanyModal } from "./delete-company-modal"
import { DeleteCompanyPermanentlyModal } from "./delete-company-permanently-modal"
import { ReactivateCompanyModal } from "./reactivate-company-modal"

interface CompaniesTableProps {
  canEdit: boolean
  canDelete: boolean
  showInactive?: boolean
}

export function CompaniesTable({ canEdit, canDelete, showInactive = false }: CompaniesTableProps) {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingPermanentlyCompany, setDeletingPermanentlyCompany] = useState<Company | null>(null)
  const [isDeletePermanentlyModalOpen, setIsDeletePermanentlyModalOpen] = useState(false)
  const [reactivatingCompany, setReactivatingCompany] = useState<Company | null>(null)
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false)

  const loadCompanies = async () => {
    setIsLoading(true)
    const result = await getCompanies(undefined, showInactive)
    
    if (result.success && result.data) {
      setCompanies(result.data)
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao carregar empresas",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadCompanies()
  }, [showInactive])

  const handleEdit = (company: Company) => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar empresas",
        variant: "destructive",
      })
      return
    }
    setEditingCompany(company)
    setIsEditModalOpen(true)
  }

  const handleDelete = (company: Company) => {
    if (!canDelete) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir empresas",
        variant: "destructive",
      })
      return
    }
    setDeletingCompany(company)
    setIsDeleteModalOpen(true)
  }

  const handleDeletePermanently = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canDelete) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir empresas",
        variant: "destructive",
      })
      return
    }
    setDeletingPermanentlyCompany(company)
    setIsDeletePermanentlyModalOpen(true)
  }

  const handleReactivate = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para reativar empresas",
        variant: "destructive",
      })
      return
    }
    setReactivatingCompany(company)
    setIsReactivateModalOpen(true)
  }

  const handleSuccess = () => {
    loadCompanies()
  }

  const columns: TableColumn<Company>[] = [
    {
      key: "trade_name",
      label: "Nome Fantasia",
      width: "min-w-[300px]",
      render: (company) => <span className="font-medium">{company.trade_name}</span>,
    },
    {
      key: "cnpj",
      label: "CNPJ",
      width: "w-48",
      render: (company) => <span className="font-mono">{company.cnpj}</span>,
    },
    {
      key: "gra_percentage",
      label: "% GRA",
      width: "w-32",
      render: (company) => <span className="font-mono text-sm">{company.gra_percentage.toFixed(2).replace('.', ',')}%</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[100px]",
      sortable: false,
      render: (company) => {
        const isInactive = company.status === 'inativo'
        
        if (isInactive) {
          // Empresa inativa: mostrar botões de Reativar e Excluir Permanentemente
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleReactivate(company, e)}
                disabled={!canEdit}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title={canEdit ? "Reativar empresa" : "Sem permissão para reativar"}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeletePermanently(company, e)}
                disabled={!canDelete}
                className="text-destructive hover:text-destructive"
                title={canDelete ? "Excluir empresa permanentemente" : "Sem permissão para excluir"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        }
        
        // Empresa ativa: mostrar botões de Editar e Desativar
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(company)}
              disabled={!canEdit}
              title={canEdit ? "Editar empresa" : "Sem permissão para editar"}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(company)}
              disabled={!canDelete}
              className="text-destructive hover:text-destructive"
              title={canDelete ? "Desativar empresa" : "Sem permissão para desativar"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        title="Cadastro de Empresas"
        data={companies}
        columns={columns}
        searchFields={["trade_name", "cnpj"]}
        searchPlaceholder="Buscar por nome fantasia ou CNPJ..."
        emptyIcon={<Building className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma empresa encontrada"
      />

      <CompanyEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        company={editingCompany}
        onSuccess={handleSuccess}
      />

      <DeleteCompanyModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        company={deletingCompany}
        onSuccess={handleSuccess}
      />

      <DeleteCompanyPermanentlyModal
        open={isDeletePermanentlyModalOpen}
        onOpenChange={setIsDeletePermanentlyModalOpen}
        company={deletingPermanentlyCompany}
        onSuccess={handleSuccess}
      />

      <ReactivateCompanyModal
        open={isReactivateModalOpen}
        onOpenChange={setIsReactivateModalOpen}
        company={reactivatingCompany}
        onSuccess={handleSuccess}
      />
    </>
  )
}
