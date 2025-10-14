"use client"
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
import { MoreHorizontal, Eye, Edit, Copy, Archive, Users } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"

interface Person {
  id: string
  name: string
  cpf: string
}

const mockPeople: Person[] = [
  {
    id: "1",
    name: "João Silva Santos",
    cpf: "123.456.789-01",
  },
  {
    id: "2",
    name: "Maria Oliveira Costa",
    cpf: "987.654.321-09",
  },
  {
    id: "3",
    name: "Carlos Eduardo Lima",
    cpf: "456.789.123-45",
  },
  {
    id: "4",
    name: "Ana Paula Ferreira",
    cpf: "789.123.456-78",
  },
  {
    id: "5",
    name: "Roberto Almeida Souza",
    cpf: "321.654.987-32",
  },
]

export function PeopleTable() {
  const handleAction = (action: string, personId: string) => {
    console.log(`${action} person ${personId}`)
  }

  const columns: TableColumn<Person>[] = [
    {
      key: "name",
      label: "Nome Completo",
      width: "min-w-[300px]",
      render: (person) => <span className="font-medium">{person.name}</span>,
    },
    {
      key: "cpf",
      label: "CPF",
      width: "w-40",
      render: (person) => <span className="font-mono">{person.cpf}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (person) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleAction("view", person.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", person.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate", person.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("archive", person.id)}>
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DataTable
      title="Cadastro de Pessoas"
      data={mockPeople}
      columns={columns}
      searchFields={["name", "cpf"]}
      searchPlaceholder="Buscar por nome ou CPF..."
      emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
      emptyMessage="Nenhuma pessoa encontrada"
    />
  )
}
