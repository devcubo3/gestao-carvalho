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
import { MoreHorizontal, Eye, Edit, Copy, Archive, Building } from "lucide-react"
import type { TableColumn } from "@/hooks/use-table"

interface Company {
  id: string
  name: string
  cnpj: string
  graPercentage: number
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    cnpj: "12.345.678/0001-90",
    graPercentage: 15.5,
  },
  {
    id: "2",
    name: "Construtora ABC S.A.",
    cnpj: "98.765.432/0001-10",
    graPercentage: 25.0,
  },
  {
    id: "3",
    name: "Logística Express ME",
    cnpj: "45.678.901/0001-23",
    graPercentage: 8.75,
  },
  {
    id: "4",
    name: "Consultoria Financeira Ltda",
    cnpj: "78.901.234/0001-56",
    graPercentage: 12.3,
  },
  {
    id: "5",
    name: "Indústria Metalúrgica Sul",
    cnpj: "32.165.498/0001-87",
    graPercentage: 30.0,
  },
]

export function CompaniesTable() {
  const handleAction = (action: string, companyId: string) => {
    console.log(`${action} company ${companyId}`)
  }

  const columns: TableColumn<Company>[] = [
    {
      key: "name",
      label: "Nome Fantasia",
      width: "min-w-[300px]",
      render: (company) => <span className="font-medium">{company.name}</span>,
    },
    {
      key: "cnpj",
      label: "CNPJ",
      width: "w-48",
      render: (company) => <span className="font-mono">{company.cnpj}</span>,
    },
    {
      key: "graPercentage",
      label: "% GRA",
      width: "w-32",
      render: (company) => <span className="font-mono text-sm">{company.graPercentage.toFixed(2)}%</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (company) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleAction("view", company.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", company.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate", company.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("archive", company.id)}>
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
      title="Cadastro de Empresas"
      data={mockCompanies}
      columns={columns}
      searchFields={["name", "cnpj"]}
      searchPlaceholder="Buscar por nome fantasia ou CNPJ..."
      emptyIcon={<Building className="h-8 w-8 text-muted-foreground" />}
      emptyMessage="Nenhuma empresa encontrada"
    />
  )
}
