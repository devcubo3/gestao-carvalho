"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateUser } from "@/app/actions/users"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

interface EditUserModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserModal({ user, open, onOpenChange }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "visualizador" as "admin" | "editor" | "visualizador",
    newPassword: "",
    confirmPassword: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  // Atualizar formData quando o usuário mudar
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name,
        email: user.email,
        role: user.role as "admin" | "editor" | "visualizador",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validações no frontend
    if (!formData.email || !formData.fullName) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar senha se fornecida
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        })
        return
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter no mínimo 6 caracteres",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)

    try {
      const result = await updateUser({
        userId: user.id,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        newPassword: formData.newPassword || undefined,
      })

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message || "Usuário atualizado com sucesso!",
        })
        onOpenChange(false)
        // Limpar senha após sucesso
        setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }))
        router.refresh()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário {user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Nome Completo */}
            <div className="grid gap-2">
              <Label htmlFor="edit-fullName">Nome Completo</Label>
              <Input
                id="edit-fullName"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "editor" | "visualizador") =>
                  setFormData({ ...formData, role: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visualizador">Visualizador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {formData.role === "admin" && "Acesso total ao sistema"}
                {formData.role === "editor" && "Pode cadastrar e editar dados"}
                {formData.role === "visualizador" && "Apenas visualização"}
              </p>
            </div>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Alterar senha (opcional)
                </span>
              </div>
            </div>

            {/* Nova Senha */}
            <div className="grid gap-2">
              <Label htmlFor="edit-newPassword">Nova Senha</Label>
              <Input
                id="edit-newPassword"
                type="password"
                placeholder="Deixe em branco para manter a atual"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {/* Confirmar Nova Senha */}
            {formData.newPassword && (
              <div className="grid gap-2">
                <Label htmlFor="edit-confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="edit-confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
