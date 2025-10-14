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
import { Plus, MoreHorizontal, Eye, Edit, Copy, Archive, Car } from "lucide-react"
import { VehicleCreateModal } from "./vehicle-create-modal"
import type { Vehicle } from "@/lib/types"
import type { TableColumn } from "@/hooks/use-table"

interface VehiclesTableProps {
  vehicles: Vehicle[]
}

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  const handleAction = (action: string, vehicleId: string) => {
    console.log(`${action} vehicle ${vehicleId}`)
  }

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
      width: "w-[70px]",
      sortable: false,
      render: (vehicle) => (
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
            <DropdownMenuItem onClick={() => handleAction("view", vehicle.id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("edit", vehicle.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate", vehicle.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction("archive", vehicle.id)} className="text-destructive">
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
          console.log("Vehicle created successfully")
        }}
      />
    </>
  )
}
