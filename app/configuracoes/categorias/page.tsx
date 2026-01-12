'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, AlertTriangle, Search, RotateCcw } from 'lucide-react'
import { getAllCategories, deleteCategory, deleteCategoryPermanently, reactivateCategory, getUserPermissions } from '@/app/actions/categories'
import { useToast } from '@/hooks/use-toast'
import { CategoryFormDialog } from '@/components/settings/category-form-dialog'
import type { Category } from '@/lib/types'

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  vinculo: 'Vínculos',
  centro_custo: 'Centros de Custo',
  forma_pagamento: 'Formas de Pagamento',
  imovel_tipo: 'Tipos de Imóvel',
  imovel_classe: 'Classes de Imóvel',
  imovel_subclasse: 'Subclasses de Imóvel',
  veiculo_tipo: 'Tipos de Veículo',
  veiculo_combustivel: 'Tipos de Combustível',
  empreendimento_tipo: 'Tipos de Empreendimento',
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canManageCategories, setCanManageCategories] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [reactivatingCategory, setReactivatingCategory] = useState<Category | null>(null)
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({})
  const [showInactive, setShowInactive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)

    const [categoriesResult, permissionsResult] = await Promise.all([
      getAllCategories(),
      getUserPermissions(),
    ])

    if (categoriesResult.success) {
      setCategories(categoriesResult.data || [])
    }

    if (permissionsResult.success) {
      const role = permissionsResult.data?.role
      setCanManageCategories(role === 'admin' || role === 'editor')
    }

    setIsLoading(false)
  }

  async function handleDeleteConfirm() {
    if (!deletingCategory) return

    const isInactive = !deletingCategory.is_active
    const result = isInactive 
      ? await deleteCategoryPermanently(deletingCategory.id)
      : await deleteCategory(deletingCategory.id)

    if (result.success) {
      toast({
        title: isInactive ? 'Categoria excluída permanentemente!' : 'Categoria desativada!',
        description: isInactive 
          ? 'A categoria foi removida permanentemente do sistema.'
          : 'A categoria foi desativada com sucesso.',
      })
      setDeletingCategory(null)
      loadData()
    } else {
      toast({
        title: isInactive ? 'Erro ao excluir categoria' : 'Erro ao desativar categoria',
        description: result.error,
        variant: 'destructive',
      })
      setDeletingCategory(null)
    }
  }

  async function handleReactivateConfirm() {
    if (!reactivatingCategory) return

    const result = await reactivateCategory(reactivatingCategory.id)

    if (result.success) {
      toast({
        title: 'Categoria reativada!',
        description: `A categoria "${reactivatingCategory.name}" foi reativada com sucesso.`,
      })
      setReactivatingCategory(null)
      loadData()
    } else {
      toast({
        title: 'Erro ao reativar categoria',
        description: result.error,
        variant: 'destructive',
      })
      setReactivatingCategory(null)
    }
  }

  // Agrupar categorias por tipo
  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = []
    }
    acc[category.type].push(category)
    return acc
  }, {} as Record<string, Category[]>)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p>Carregando categorias...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias utilizadas em todo o sistema
            </p>
          </div>
          {canManageCategories && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </div>

        {!canManageCategories && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Apenas administradores e editores podem criar, editar ou deletar categorias.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedCategories).map(([type, cats]) => {
            const searchTerm = searchFilters[type] || ''
            const isShowingInactive = showInactive[type] || false
            const filteredCats = cats
              .filter(cat => isShowingInactive || cat.is_active)
              .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name))
            
            const inactiveCount = cats.filter(c => !c.is_active).length
            
            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle>{CATEGORY_TYPE_LABELS[type] || type}</CardTitle>
                  <CardDescription>
                    {cats.filter(c => c.is_active).length} ativa(s)
                    {inactiveCount > 0 && ` • ${inactiveCount} inativa(s)`}
                  </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar categoria..."
                      value={searchFilters[type] || ''}
                      onChange={(e) => setSearchFilters({ ...searchFilters, [type]: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                  {inactiveCount > 0 && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                      <Switch
                        id={`show-inactive-${type}`}
                        checked={isShowingInactive}
                        onCheckedChange={(checked: boolean) => setShowInactive({ ...showInactive, [type]: checked })}
                      />
                      <Label htmlFor={`show-inactive-${type}`} className="text-sm cursor-pointer">
                        Mostrar inativas ({inactiveCount})
                      </Label>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {filteredCats.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma categoria encontrada
                      </p>
                    ) : (
                      filteredCats.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        category.is_active ? 'bg-muted' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                        {!category.is_active && (
                          <span className="text-xs text-red-500">Inativa</span>
                        )}
                      </div>
                      {canManageCategories && (
                        <div className="flex gap-1">
                          {category.is_active ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingCategory(category)}
                                title="Editar categoria"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingCategory(category)}
                                title="Desativar categoria"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setReactivatingCategory(category)}
                                title="Reativar categoria"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingCategory(category)}
                                title="Excluir permanentemente"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <CategoryFormDialog
        open={createModalOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false)
            setEditingCategory(null)
          }
        }}
        category={editingCategory}
        onSuccess={loadData}
      />

      <AlertDialog open={!!reactivatingCategory} onOpenChange={(open) => !open && setReactivatingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <AlertDialogTitle>Reativar Categoria</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Você está prestes a reativar a categoria{' '}
              <span className="font-semibold text-foreground">"{reactivatingCategory?.name}"</span>.
              <br />
              <br />
              Esta ação irá <strong>tornar a categoria disponível novamente</strong> para uso nos formulários do sistema.
              Todos os registros anteriormente associados a esta categoria permanecerão intactos.
              <br />
              <br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateConfirm}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              Sim, Reativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>
                {deletingCategory?.is_active ? 'Desativar Categoria' : 'Excluir Categoria Permanentemente'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Você está prestes a {deletingCategory?.is_active ? 'desativar' : 'excluir permanentemente'} a categoria{' '}
              <span className="font-semibold text-foreground">"{deletingCategory?.name}"</span>.
              <br />
              <br />
              {deletingCategory?.is_active ? (
                <>
                  Esta ação irá <strong>inativar</strong> a categoria, tornando-a indisponível para uso nos formulários do sistema.
                  A categoria não será excluída permanentemente e poderá ser reativada posteriormente.
                </>
              ) : (
                <>
                  <strong className="text-red-600">ATENÇÃO:</strong> Esta ação irá <strong>excluir permanentemente</strong> a categoria do banco de dados.
                  Esta operação <strong className="text-red-600">não pode ser desfeita</strong>.
                  <br />
                  <br />
                  Apenas categorias inativas podem ser excluídas permanentemente.
                </>
              )}
              <br />
              <br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingCategory?.is_active ? 'Sim, Desativar' : 'Sim, Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
