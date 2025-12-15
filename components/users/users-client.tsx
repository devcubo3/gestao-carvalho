"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Shield, Eye, Settings, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { CreateUserModal } from "./create-user-modal"
import { EditUserModal } from "./edit-user-modal"
import { DeleteUserModal } from "./delete-user-modal"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  lastLogin: string
  createdAt: string
}

interface UsersClientProps {
  users: User[]
  isAdmin: boolean
  currentUserId: string
}

export function UsersClient({ users, isAdmin, currentUserId }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { toast } = useToast()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "editor":
        return <Settings className="h-4 w-4" />
      case "visualizador":
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "editor":
        return "Editor"
      case "visualizador":
        return "Visualizador"
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "default"
      case "editor":
        return "secondary"
      case "visualizador":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRoleLabel(user.role).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditUser = (userId: string) => {
    if (!isAdmin) return
    
    // Impedir edição do próprio perfil
    if (userId === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Para editar seu perfil, acesse a página 'Minha Conta'",
        variant: "destructive",
      })
      return
    }
    
    const user = users.find((u) => u.id === userId)
    if (user) {
      setEditingUser(user)
      setIsEditModalOpen(true)
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (!isAdmin) return
    
    // Impedir exclusão do próprio perfil
    if (userId === currentUserId) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir seu próprio usuário",
        variant: "destructive",
      })
      return
    }
    
    const user = users.find((u) => u.id === userId)
    if (user) {
      setDeletingUser(user)
      setIsDeleteModalOpen(true)
    }
  }

  const handleDeleteSuccess = () => {
    // A página será revalidada automaticamente pela action
    window.location.reload()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <MainLayout
      breadcrumbs={[{ label: "Configurações" }, { label: "Usuários" }]}
      hideSearch={true}
      hideQuickActions={true}
      hideNotifications={true}
      hideUserMenu={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Usuários</h1>
            <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
          </div>
          <CreateUserModal isAdmin={isAdmin} />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Editores</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "editor").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizadores</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "visualizador").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Buscar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou função..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Lista de Usuários</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Gerencie permissões e status dos usuários do sistema"
                : "Visualize os usuários do sistema"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatar ? (
                            <AvatarImage
                              src={user.avatar}
                              alt={user.name}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="text-lg">👤</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? `${new Date(user.lastLogin).toLocaleDateString("pt-BR")} às ${new Date(user.lastLogin).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Nunca"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                            disabled={user.id === currentUserId}
                            title={user.id === currentUserId ? "Para editar seu perfil, acesse 'Minha Conta'" : "Editar usuário"}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUserId}
                            className="text-destructive hover:text-destructive"
                            title={user.id === currentUserId ? "Você não pode excluir seu próprio usuário" : "Excluir usuário"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Descrição das Funções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Administrador</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acesso total ao sistema, incluindo gerenciamento de usuários e configurações.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Editor</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pode cadastrar e editar dados, mas não gerenciar usuários ou configurações do sistema.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Visualizador</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acesso somente leitura a todos os dados e relatórios do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição */}
      <EditUserModal
        user={editingUser}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Modal de Exclusão */}
      <DeleteUserModal
        user={deletingUser}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onSuccess={handleDeleteSuccess}
      />
    </MainLayout>
  )
}
