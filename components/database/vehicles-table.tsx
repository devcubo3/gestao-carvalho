"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit, Trash2, Car } from "lucide-react"
import { VehicleCreateModal } from "./vehicle-create-modal"
import { EditVehicleDialog } from "./edit-vehicle-dialog"
import { DeleteVehicleDialog } from "./delete-vehicle-dialog"
import { deleteVehicle, updateVehicle } from "@/app/actions/vehicles"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Vehicle } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface VehiclesTableProps {
  vehicles: Vehicle[]
}

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(data?.role || null)
      }
    }
    fetchUserRole()
  }, [])

  const handleAction = (action: string, vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    if (action === "edit") {
      setIsEditModalOpen(true)
    } else if (action === "delete") {
      setIsDeleteModalOpen(true)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedVehicle) return
    
    setSubmitting(true)
    try {
      const result = await updateVehicle(selectedVehicle.id, data)
      
      if (result.success) {
        toast({
          title: "Veículo atualizado",
          description: "As informações do veículo foram atualizadas com sucesso.",
        })
        setIsEditModalOpen(false)
        setSelectedVehicle(null)
        router.refresh()
      } else {
        toast({
          title: "Erro ao atualizar",
          description: result.error || "Ocorreu um erro ao atualizar o veículo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVehicle) return
    
    setSubmitting(true)
    try {
      const result = await deleteVehicle(selectedVehicle.id)
      
      if (result.success) {
        toast({
          title: "Veículo excluído",
          description: "O veículo foi excluído permanentemente.",
        })
        setIsDeleteModalOpen(false)
        setSelectedVehicle(null)
        router.refresh()
      } else {
        toast({
          title: "Erro ao excluir",
          description: result.error || "Ocorreu um erro ao excluir o veículo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canEdit = userRole === "admin" || userRole === "editor"
  const canDelete = userRole === "admin"

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      carro: "Carro",
      moto: "Moto",
      caminhao: "Caminhão",
      barco: "Barco",
      onibus: "Ônibus",
      van: "Van",
    }
    return labels[type] || type
  }

  const columns: TableColumn<Vehicle>[] = [
    {
      key: "type",
      label: "Tipo",
      width: "w-28",
      render: (vehicle) => <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>,
    },
    {
      key: "code",
      label: "Código",
      width: "w-24",
      render: (vehicle) => <span className="font-medium">{vehicle.code}</span>,
    },
    {
      key: "brand",
      label: "Marca/Modelo",
      width: "min-w-[200px]",
      render: (vehicle) => (
        <span className="font-medium">
          {vehicle.brand} {vehicle.model}
        </span>
      ),
    },
    {
      key: "color",
      label: "Cor",
      width: "w-24",
      render: (vehicle) => <span>{vehicle.color || "N/A"}</span>,
    },
    {
      key: "plate",
      label: "Placa",
      width: "w-28",
      render: (vehicle) => <span className="font-mono">{vehicle.plate}</span>,
    },
    {
      key: "year",
      label: "Ano",
      width: "w-20",
      align: "center",
    },
    {
      key: "actions",
      label: "Ações",
      width: "w-[100px]",
      sortable: false,
      render: (vehicle) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleAction("edit", vehicle)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleAction("delete", vehicle)}
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
        title="Cadastro de Veículos"
        data={vehicles}
        columns={columns}
        searchFields={["brand", "model", "plate", "code", "color"]}
        searchPlaceholder="Buscar por marca, modelo, placa, código, cor..."
        emptyIcon={<Car className="h-8 w-8 text-muted-foreground" />}
        emptyMessage="Nenhum veículo encontrado"
        emptyAction={
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Cadastrar primeiro veículo
          </Button>
        }
        headerAction={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Veículo
          </Button>
        }
      />

      <VehicleCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          toast({
            title: "Veículo cadastrado",
            description: "O veículo foi cadastrado com sucesso.",
          })
          setIsCreateModalOpen(false)
          router.refresh()
        }}
      />

      <EditVehicleDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        vehicle={selectedVehicle}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <DeleteVehicleDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        vehicle={selectedVehicle}
        onConfirm={handleDelete}
        submitting={submitting}
      />
    </>
  )
}
