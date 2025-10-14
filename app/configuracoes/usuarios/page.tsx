"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Users, Plus, Search, MoreHorizontal, Shield, Eye, Settings } from "lucide-react"
import { useState } from "react"

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const users = [
    {
      id: 1,
      name: "João Silva",
      email: "joao.silva@empresa.com.br",
      role: "Administrador",
      status: "Ativo",
      lastLogin: "2024-01-15T10:30:00",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@empresa.com.br",
      role: "Gestor",
      status: "Ativo",
      lastLogin: "2024-01-15T09:15:00",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      email: "pedro.oliveira@empresa.com.br",
      role: "Visualizador",
      status: "Ativo",
      lastLogin: "2024-01-14T16:45:00",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: 4,
      name: "Ana Costa",
      email: "ana.costa@empresa.com.br",
      role: "Gestor",
      status: "Inativo",
      lastLogin: "2024-01-10T14:20:00",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Administrador":
        return <Shield className="h-4 w-4" />
      case "Gestor":
        return <Settings className="h-4 w-4" />
      case "Visualizador":
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Administrador":
        return "default"
      case "Gestor":
        return "secondary"
      case "Visualizador":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditUser = (userId: number) => {
    console.log(`Editando usuário ${userId}`)
  }

  const handleDeleteUser = (userId: number) => {
    console.log(`Excluindo usuário ${userId}`)
  }

  const handleToggleStatus = (userId: number) => {
    console.log(`Alterando status do usuário ${userId}`)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Configurações", href: "/configuracoes" }, { label: "Usuários" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Usuários</h1>
            <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
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
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "Administrador").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "Gestor").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.status === "Ativo").length}</div>
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
            <CardDescription>Gerencie permissões e status dos usuários do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
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
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Ativo" ? "default" : "secondary"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastLogin).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(user.lastLogin).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleEditUser(user.id)}>Editar usuário</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                            {user.status === "Ativo" ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                            Excluir usuário
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
                  <span className="font-medium">Gestor</span>
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
    </MainLayout>
  )
}
