"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { CompaniesTable } from "@/components/database/companies-table"
import { CompanyCreateModal } from "@/components/database/company-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function EmpresasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de pessoas jurídicas do sistema</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Empresas</CardTitle>
            <CardDescription>Visualize e gerencie todas as empresas cadastradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <CompaniesTable />
          </CardContent>
        </Card>
      </div>

      <CompanyCreateModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </MainLayout>
  )
}
