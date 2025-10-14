"use client"

import React from "react"
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
import { Plus, MoreHorizontal, Eye, Edit, Copy, Archive, MapPin } from "lucide-react"
import { PropertyCreateModal } from "./property-create-modal"
import type { Property } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface PropertiesTableProps {
  properties: Property[]
}

export function PropertiesTable({ properties }: PropertiesTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  const handleAction = (action: string, propertyId: string) => {
    console.log(`${action} property ${propertyId}`)
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residencial: "Residencial",
      comercial: "Comercial",
      industrial: "Industrial",
      rural: "Rural",
      terreno: "Terreno",
    }
    return labels[type] || type
  }

  const getClasseLabel = (classe: string) => {
    const labels: Record<string, string> = {
      casa: "Casa",
      apartamento: "Apartamento",
      sala: "Sala Comercial",
      loja: "Loja",
      galpao: "Galpão",
      "terreno-urbano": "Terreno Urbano",
      "terreno-rural": "Terreno Rural",
    }
    return labels[classe] || classe
  }

  const getSubclasseLabel = (subclasse: string) => {
    const labels: Record<string, string> = {
      padrao: "Padrão",
      "alto-padrao": "Alto Padrão",
      popular: "Popular",
      luxo: "Luxo",
      economico: "Econômico",
    }
    return labels[subclasse] || subclasse
  }

  const getCidadeLabel = (cidade: string) => {
    const labels: Record<string, string> = {
      "sao-paulo": "São Paulo - SP",
      "rio-de-janeiro": "Rio de Janeiro - RJ",
      "belo-horizonte": "Belo Horizonte - MG",
      brasilia: "Brasília - DF",
      salvador: "Salvador - BA",
      fortaleza: "Fortaleza - CE",
      curitiba: "Curitiba - PR",
      recife: "Recife - PE",
    }
    return labels[cidade] || cidade
  }

  const columns: TableColumn<Property>[] = [
    {
      key: "codigo",
      label: "Código",
      width: "w-24",
      render: (property) => <span className="font-medium">{property.codigo || property.code}</span>,
    },
    {
      key: "tipo",
      label: "Tipo",
      width: "w-32",
      render: (property) => <Badge variant="outline">{getTypeLabel(property.tipo || property.type)}</Badge>,
    },
    {
      key: "classe",
      label: "Classe",
      width: "w-36",
      render: (property) => <Badge variant="secondary">{getClasseLabel(property.classe || "casa")}</Badge>,
    },
    {
      key: "subclasse",
      label: "Subclasse",
      width: "w-32",
      render: (property) => <Badge variant="outline">{getSubclasseLabel(property.subclasse || "padrao")}</Badge>,
    },
    {
      key: "nomeUsual",
      label: "Nome Usual",
      width: "min-w-[150px]",
      render: (property) => <span className="font-medium">{property.nomeUsual || property.identification}</span>,
    },
    {
      key: "endereco",
      label: "Endereço",
      width: "min-w-[200px]",
      sortable: false,
      render: (property) => (
        <div className="truncate text-sm">
          {property.endereco || (property.address ? `${property.address.street}, ${property.address.number}` : "N/A")}
        </div>
      ),
    },
    {
      key: "cidade",
      label: "Cidade",
      width: "w-40",
      render: (property) => (
        <span className="text-sm">{getCidadeLabel(property.cidade || property.address?.city || "sao-paulo")}</span>
      ),
    },
    {
      key: "area",
      label: "Área (m²)",
      width: "w-28",
      align: "right",
      render: (property) => (property.area || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    },
    {
      key: "matricula",
      label: "Matrícula",
      width: "w-28",
      render: (property) => <span className="font-mono text-sm">{property.matricula || "N/A"}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[70px]",
      sortable: false,
      render: (property) => (
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
            <DropdownMenuItem onClick={() => handleAction("view", property.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", property.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate", property.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("archive", property.id)} className="text-destructive">
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
        title="Cadastro de Imóveis"
        data={properties}
        columns={columns}
        searchFields={["nomeUsual", "codigo", "endereco", "matricula"]}
        searchPlaceholder="Buscar por nome, código, endereço, matrícula..."
        emptyIcon={<MapPin className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhum imóvel encontrado"
        emptyAction={
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Cadastrar primeiro imóvel
          </Button>
        }
        headerAction={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Imóvel
          </Button>
        }
        summary={<div className="text-sm text-muted-foreground">Total de imóveis: {properties.length}</div>}
      />

      <PropertyCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          console.log("Property created successfully")
        }}
      />
    </>
  )
}
