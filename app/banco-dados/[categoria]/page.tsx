"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building2, Car, Tag, Link, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function CategoriaPage() {
  const params = useParams()
  const router = useRouter()
  const categoria = params.categoria as string

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [editingItem, setEditingItem] = useState<{ id: number; name: string } | null>(null)

  // Mock data based on category
  const getCategoryData = (cat: string) => {
    switch (cat) {
      case "vinculo":
        return {
          name: "Vínculo",
          description: "Tipos de vínculo entre partes",
          icon: Link,
          items: [{ id: 1, name: "Particular", createdAt: "2024-01-15" }],
        }
      case "tipo-imovel":
        return {
          name: "Tipo de Imóvel",
          description: "Categorias de imóveis disponíveis",
          icon: Building2,
          items: [
            { id: 1, name: "Apartamento", createdAt: "2024-01-15" },
            { id: 2, name: "Casa", createdAt: "2024-01-15" },
            { id: 3, name: "Kitnet", createdAt: "2024-01-15" },
            { id: 4, name: "Loja", createdAt: "2024-01-15" },
            { id: 5, name: "Lote", createdAt: "2024-01-15" },
            { id: 6, name: "Prédio", createdAt: "2024-01-15" },
            { id: 7, name: "Sala", createdAt: "2024-01-15" },
            { id: 8, name: "Terreno", createdAt: "2024-01-15" },
          ],
        }
      case "tipo-veiculo":
        return {
          name: "Tipo de Veículo",
          description: "Categorias de veículos disponíveis",
          icon: Car,
          items: [
            { id: 1, name: "Carro", createdAt: "2024-01-15" },
            { id: 2, name: "Moto", createdAt: "2024-01-15" },
            { id: 3, name: "Outros", createdAt: "2024-01-15" },
          ],
        }
      case "outros":
        return {
          name: "Outros",
          description: "Outras categorias e classificações",
          icon: Tag,
          items: [
            { id: 1, name: "Acerto ou Permuta", createdAt: "2024-01-15" },
            { id: 2, name: "ADM", createdAt: "2024-01-15" },
            { id: 3, name: "Carteira", createdAt: "2024-01-15" },
            { id: 4, name: "Consórcio", createdAt: "2024-01-15" },
            { id: 5, name: "Cacau", createdAt: "2024-01-15" },
            { id: 6, name: "Brindes", createdAt: "2024-01-15" },
            { id: 7, name: "BNDES", createdAt: "2024-01-15" },
            { id: 8, name: "Tradição", createdAt: "2024-01-15" },
            { id: 9, name: "Avião", createdAt: "2024-01-15" },
            { id: 10, name: "Arquitetura", createdAt: "2024-01-15" },
            { id: 11, name: "Maçonaria", createdAt: "2024-01-15" },
            { id: 12, name: "Obra Carvalho", createdAt: "2024-01-15" },
            { id: 13, name: "Loteamentos", createdAt: "2024-01-15" },
            { id: 14, name: "Particular Geraldo", createdAt: "2024-01-15" },
            { id: 15, name: "Adiantamento Comissões", createdAt: "2024-01-15" },
            { id: 16, name: "Aniversário 2025", createdAt: "2024-01-15" },
            { id: 17, name: "Alexandra", createdAt: "2024-01-15" },
            { id: 18, name: "Cartão de Crédito", createdAt: "2024-01-15" },
            { id: 19, name: "Casa Morada do Lago 1D", createdAt: "2024-01-15" },
            { id: 20, name: "Celular", createdAt: "2024-01-15" },
            { id: 21, name: "Custo Bancário", createdAt: "2024-01-15" },
            { id: 22, name: "Charlin Motorista", createdAt: "2024-01-15" },
            { id: 23, name: "Doações Presentes", createdAt: "2024-01-15" },
          ],
        }
      default:
        return {
          name: "Categoria",
          description: "Categoria não encontrada",
          icon: Tag,
          items: [],
        }
    }
  }

  const categoryData = getCategoryData(categoria)
  const IconComponent = categoryData.icon

  const filteredItems = categoryData.items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleCreateItem = () => {
    if (newItemName.trim()) {
      console.log(`Criando item: ${newItemName}`)
      setNewItemName("")
      setIsCreateDialogOpen(false)
    }
  }

  const handleEditItem = (item: { id: number; name: string }) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleUpdateItem = () => {
    if (editingItem && editingItem.name.trim()) {
      console.log(`Atualizando item: ${editingItem.name}`)
      setEditingItem(null)
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteItem = (itemId: number) => {
    console.log(`Excluindo item: ${itemId}`)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados", href: "/banco-dados" }, { label: categoryData.name }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/banco-dados")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-serif text-foreground">{categoryData.name}</h1>
                <p className="text-muted-foreground">{categoryData.description}</p>
              </div>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Item</DialogTitle>
                <DialogDescription>Adicione um novo item à categoria {categoryData.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Nome do Item</Label>
                  <Input
                    id="itemName"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Digite o nome do item"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateItem}>Criar Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryData.items.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Filtrados</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hoje</div>
              <p className="text-xs text-muted-foreground">15:30</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Buscar Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Lista de Itens</CardTitle>
            <CardDescription>Gerencie os itens desta categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditItem(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
              <DialogDescription>Altere as informações do item</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editItemName">Nome do Item</Label>
                <Input
                  id="editItemName"
                  value={editingItem?.name || ""}
                  onChange={(e) => setEditingItem(editingItem ? { ...editingItem, name: e.target.value } : null)}
                  placeholder="Digite o nome do item"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateItem}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
