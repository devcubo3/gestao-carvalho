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
import { deletePerson } from "@/app/actions/people"
import { useToast } from "@/hooks/use-toast"
import type { Person } from "@/lib/types"

interface DeletePersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onSuccess: () => void
}

export function DeletePersonModal({
  open,
  onOpenChange,
  person,
  onSuccess,
}: DeletePersonModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!person) return

    setIsDeleting(true)

    const result = await deletePerson(person.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Pessoa desativada com sucesso",
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao desativar pessoa",
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
            <DialogTitle className="text-xl">Desativar Pessoa</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Tem certeza que deseja desativar esta pessoa? O cadastro ficará inativo e não aparecerá nas listagens, mas os dados serão preservados e poderão ser reativados posteriormente.
          </DialogDescription>
        </DialogHeader>

        {person && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-medium">Nome:</span>{" "}
              <span className="text-sm">{person.full_name}</span>
            </div>
            {person.cpf && (
              <div>
                <span className="text-sm font-medium">CPF:</span>{" "}
                <span className="text-sm font-mono">{person.cpf}</span>
              </div>
            )}
            {person.email && (
              <div>
                <span className="text-sm font-medium">Email:</span>{" "}
                <span className="text-sm">{person.email}</span>
              </div>
            )}
          </div>
        )}

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
                Desativando...
              </>
            ) : (
              "Desativar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
