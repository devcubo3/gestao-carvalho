"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { CompaniesTable } from "@/components/database/companies-table"
import { CompanyCreateModal } from "@/components/database/company-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import { getUserPermissions } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"

export default function EmpresasPage() {
  const { toast } = useToast()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    setIsLoadingPermissions(true)
    const result = await getUserPermissions()
    
    if (result.success && result.data) {
      setCanEdit(result.data.canEdit)
      setCanDelete(result.data.canDelete)
    }
    setIsLoadingPermissions(false)
  }

  const handleCreateClick = () => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar empresas. Apenas administradores e editores podem realizar esta ação.",
        variant: "destructive",
      })
      return
    }
    setIsCreateModalOpen(true)
  }

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <MainLayout
      hideSearch={true}
      hideQuickActions={true}
      hideNotifications={true}
      hideUserMenu={true}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de pessoas jurídicas do sistema</p>
          </div>
          <Button 
            onClick={handleCreateClick}
            disabled={isLoadingPermissions || !canEdit}
            title={canEdit ? "Criar nova empresa" : "Sem permissão para criar empresas"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>Lista de Empresas</CardTitle>
                <CardDescription>Visualize e gerencie todas as empresas cadastradas no sistema</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label 
                  htmlFor="show-inactive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mostrar Inativos
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isLoadingPermissions && (
              <CompaniesTable 
                key={refreshKey} 
                canEdit={canEdit} 
                canDelete={canDelete} 
                showInactive={showInactive}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <CompanyCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
