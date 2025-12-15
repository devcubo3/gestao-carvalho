"use client"

import React, { useEffect, useState } from "react"
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, MapPin } from "lucide-react"
import { PropertyCreateModal } from "./property-create-modal"
import { EditPropertyDialog } from "./edit-property-dialog"
import { DeletePropertyDialog } from "./delete-property-dialog"
import { deleteProperty, updateProperty } from "@/app/actions/properties"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Property } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface PropertiesTableProps {
  properties: Property[]
}

export function PropertiesTable({ properties }: PropertiesTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

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
        
        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [])

  const handleAction = async (action: string, propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    if (!property) return

    if (action === "edit") {
      setSelectedProperty(property)
      setIsEditModalOpen(true)
    } else if (action === "delete") {
      setSelectedProperty(property)
      setIsDeleteModalOpen(true)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedProperty) return
    
    setSubmitting(true)
    const result = await updateProperty(selectedProperty.id, data)
    
    if (result.success) {
      toast({ title: "Imóvel atualizado com sucesso!" })
      setIsEditModalOpen(false)
      setSelectedProperty(null)
      router.refresh()
    } else {
      toast({ 
        title: "Erro ao atualizar imóvel", 
        description: result.error,
        variant: "destructive" 
      })
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!selectedProperty) return
    
    setSubmitting(true)
    const result = await deleteProperty(selectedProperty.id)
    
    if (result.success) {
      toast({ title: "Imóvel excluído com sucesso!" })
      setIsDeleteModalOpen(false)
      setSelectedProperty(null)
      router.refresh()
    } else {
      toast({ 
        title: "Erro ao excluir imóvel", 
        description: result.error,
        variant: "destructive" 
      })
    }
    setSubmitting(false)
  }

  const canEdit = userRole === "admin" || userRole === "editor"
  const canDelete = userRole === "admin"

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
      key: "code",
      label: "Código",
      width: "w-24",
      render: (property) => <span className="font-medium">{property.code}</span>,
    },
    {
      key: "type",
      label: "Tipo",
      width: "w-32",
      render: (property) => <Badge variant="outline">{getTypeLabel(property.type)}</Badge>,
    },
    {
      key: "classe",
      label: "Classe",
      width: "w-36",
      render: (property) => property.classe ? <Badge variant="secondary">{getClasseLabel(property.classe)}</Badge> : <span className="text-muted-foreground text-sm">-</span>,
    },
    {
      key: "subclasse",
      label: "Subclasse",
      width: "w-32",
      render: (property) => property.subclasse ? <Badge variant="outline">{getSubclasseLabel(property.subclasse)}</Badge> : <span className="text-muted-foreground text-sm">-</span>,
    },
    {
      key: "identification",
      label: "Nome Usual",
      width: "min-w-[150px]",
      render: (property) => <span className="font-medium">{property.identification}</span>,
    },
    {
      key: "street",
      label: "Endereço",
      width: "min-w-[200px]",
      sortable: false,
      render: (property) => (
        <div className="truncate text-sm">
          {property.street}, {property.number}
        </div>
      ),
    },
    {
      key: "city",
      label: "Cidade",
      width: "w-40",
      render: (property) => (
        <span className="text-sm">{property.city}</span>
      ),
    },
    {
      key: "area",
      label: "Área (m²)",
      width: "w-28",
      align: "right",
      render: (property) => property.area.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    },
    {
      key: "registry",
      label: "Matrícula",
      width: "w-28",
      render: (property) => <span className="font-mono text-sm">{property.registry}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[100px]",
      sortable: false,
      render: (property) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleAction("edit", property.id)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleAction("delete", property.id)}
              className="text-destructive hover:text-destructive"
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
        title="Cadastro de Imóveis"
        data={properties}
        columns={columns}
        searchFields={["identification", "code", "street", "registry"]}
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

      <EditPropertyDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        property={selectedProperty}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DeletePropertyDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        property={selectedProperty}
        onConfirm={handleDelete}
        submitting={submitting}
      />
    </>
  )
}
