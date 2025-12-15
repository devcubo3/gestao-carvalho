"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { deleteUser } from "@/app/actions/users"
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

interface DeleteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
}

export function DeleteUserModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)

    const result = await deleteUser(user.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir usuário",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Excluir Usuário</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Tem certeza que deseja excluir permanentemente este usuário?{" "}
            <span className="font-semibold text-destructive">
              Esta ação não pode ser desfeita.
            </span>
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-medium">Nome:</span>{" "}
              <span className="text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>{" "}
              <span className="text-sm">{user.email}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Função:</span>{" "}
              <span className="text-sm">{getRoleLabel(user.role)}</span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Atenção:</strong> Ao excluir este usuário, os seguintes dados serão removidos permanentemente:
          </p>
          <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Conta de autenticação</li>
            <li>Perfil do usuário</li>
            <li>Histórico de acessos</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Permanentemente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
