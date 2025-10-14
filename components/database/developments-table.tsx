"use client"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { Plus, MoreHorizontal, Eye, Edit, Copy, Archive, Building2 } from "lucide-react"
import type { Development } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"
import { DevelopmentCreateModal } from "./development-create-modal"

interface DevelopmentsTableProps {
  developments: Development[]
}

export function DevelopmentsTable({ developments }: DevelopmentsTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAction = (action: string, developmentId: string) => {
    console.log(`${action} development ${developmentId}`)
    // Mock actions - in real app would handle actual operations
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
      key: "city",
      label: "Cidade",
      width: "w-40",
      render: (development) => <span>{development.city || development.location}</span>,
    },
    {
      key: "name",
      label: "Nome Usual",
      width: "min-w-[200px]",
      render: (development) => <span className="font-medium">{development.name}</span>,
    },
    {
      key: "description",
      label: "Descrição",
      width: "min-w-[250px]",
      render: (development) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {development.description || development.notes || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (development) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("view", development.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", development.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate", development.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("archive", development.id)} className="text-destructive">
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <DataTable
        title="Cadastro de Empreendimentos"
        data={developments}
        columns={columns}
        searchFields={["name", "code", "city", "description"]}
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

      <DevelopmentCreateModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </>
  )
}
