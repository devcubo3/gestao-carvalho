"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { PeopleTable } from "@/components/database/people-table"
import { PersonCreateModal } from "@/components/database/person-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getUserPermissions } from "@/app/actions/people"
import { useToast } from "@/hooks/use-toast"

export default function PessoasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    const result = await getUserPermissions()
    if (result.success && result.data) {
      setCanEdit(result.data.canEdit)
      setCanDelete(result.data.canDelete)
    }
    setIsLoading(false)
  }

  const handleSuccess = () => {
    // Força recarregar a tabela
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateClick = () => {
    if (!canEdit) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar pessoas. Apenas administradores e editores podem realizar esta ação.",
        variant: "destructive",
      })
      return
    }
    setIsCreateModalOpen(true)
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
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro de pessoas físicas do sistema
            </p>
          </div>
          <Button 
            onClick={handleCreateClick}
            disabled={!canEdit || isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Pessoa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pessoas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as pessoas cadastradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeopleTable 
              key={refreshKey} 
              canEdit={canEdit} 
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
      </div>

      <PersonCreateModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  )
}
