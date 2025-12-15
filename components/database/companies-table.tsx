"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Edit, Trash2, Building, Loader2 } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"
import type { Company } from "@/lib/types"
import { getCompanies } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import { CompanyEditModal } from "./company-edit-modal"
import { DeleteCompanyModal } from "./delete-company-modal"

interface CompaniesTableProps {
  canEdit: boolean
  canDelete: boolean
}

export function CompaniesTable({ canEdit, canDelete }: CompaniesTableProps) {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const loadCompanies = async () => {
    setIsLoading(true)
    const result = await getCompanies()
    
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
  }, [])

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
      render: (company) => (
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
            title={canDelete ? "Excluir empresa permanentemente" : "Sem permissão para excluir"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
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
    </>
  )
}
