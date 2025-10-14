"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Camera, Key, LogOut, Save } from "lucide-react"
import { useState } from "react"

export default function MinhaContaPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "João Silva",
    email: "joao.silva@empresa.com.br",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const userInfo = {
    name: "João Silva",
    email: "joao.silva@empresa.com.br",
    role: "Administrador",
    lastLogin: "2024-01-15T10:30:00",
    createdAt: "2023-06-15T08:00:00",
    avatar: "/placeholder.svg?height=80&width=80",
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = () => {
    console.log("Salvando perfil:", formData)
    setIsEditing(false)
    // Mock save operation
  }

  const handleChangePassword = () => {
    console.log("Alterando senha")
    // Mock password change
  }

  const handleUploadAvatar = () => {
    console.log("Upload de avatar")
    // Mock avatar upload
  }

  const handleLogout = () => {
    console.log("Fazendo logout")
    // Mock logout
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Configurações", href: "/configuracoes" }, { label: "Minha Conta" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Minha Conta</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações de conta</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={userInfo.avatar || "/placeholder.svg"} alt={userInfo.name} />
                      <AvatarFallback className="text-lg">
                        {userInfo.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-transparent"
                      onClick={handleUploadAvatar}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="font-serif">{userInfo.name}</CardTitle>
                <CardDescription>{userInfo.email}</CardDescription>
                <div className="flex justify-center">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {userInfo.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Último acesso:</span>
                    <span>{new Date(userInfo.lastLogin).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Membro desde:</span>
                    <span>{new Date(userInfo.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription>Atualize suas informações básicas de perfil</CardDescription>
                  </div>
                  <Button variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancelar" : "Editar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword}>
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>Informações sobre a segurança da sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Autenticação de Dois Fatores</div>
                      <div className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança à sua conta
                      </div>
                    </div>
                    <Badge variant="outline">Desabilitado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Sessões Ativas</div>
                      <div className="text-sm text-muted-foreground">Gerencie dispositivos conectados à sua conta</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Sessões
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
