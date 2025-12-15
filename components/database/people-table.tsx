"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Edit, Trash2, Users, Loader2 } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"
import type { Person } from "@/lib/types"
import { getPeople, deletePerson } from "@/app/actions/people"
import { useToast } from "@/hooks/use-toast"
import { PersonEditModal } from "./person-edit-modal"
import { DeletePersonModal } from "./delete-person-modal"

interface PeopleTableProps {
  canEdit: boolean
  canDelete: boolean
}

export function PeopleTable({ canEdit, canDelete }: PeopleTableProps) {
  const { toast } = useToast()
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const loadPeople = async () => {
    setIsLoading(true)
    const result = await getPeople()
    
    if (result.success && result.data) {
      setPeople(result.data)
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao carregar pessoas",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadPeople()
  }, [])

  const handleEdit = (person: Person) => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar pessoas. Apenas administradores e editores podem realizar esta ação.",
        variant: "destructive",
      })
      return
    }
    setEditingPerson(person)
    setIsEditModalOpen(true)
  }

  const handleDelete = (person: Person) => {
    if (!canDelete) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem excluir pessoas.",
        variant: "destructive",
      })
      return
    }
    setDeletingPerson(person)
    setIsDeleteModalOpen(true)
  }

  const handleEditSuccess = () => {
    loadPeople()
  }

  const handleDeleteSuccess = () => {
    loadPeople()
  }

  const columns: TableColumn<Person>[] = [
    {
      key: "full_name",
      label: "Nome Completo",
      width: "min-w-[300px]",
      render: (person) => <span className="font-medium">{person.full_name}</span>,
    },
    {
      key: "cpf",
      label: "CPF",
      width: "w-40",
      render: (person) => <span className="font-mono">{person.cpf}</span>,
    },
    {
      key: "email",
      label: "Email",
      width: "min-w-[200px]",
      render: (person) => person.email || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "mobile_phone",
      label: "Celular",
      width: "w-40",
      render: (person) => person.mobile_phone || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[120px]",
      sortable: false,
      render: (person) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(person)}
            disabled={!canEdit}
            title={canEdit ? "Editar pessoa" : "Você não tem permissão para editar"}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(person)}
            disabled={!canDelete}
            className="text-destructive hover:text-destructive"
            title={canDelete ? "Excluir pessoa" : "Apenas administradores podem excluir"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        title="Cadastro de Pessoas"
        data={people}
        columns={columns}
        searchFields={["full_name", "cpf", "email"]}
        searchPlaceholder="Buscar por nome, CPF ou email..."
        emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhuma pessoa encontrada"
      />
      
      <PersonEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        person={editingPerson}
        onSuccess={handleEditSuccess}
      />
      
      <DeletePersonModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        person={deletingPerson}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
