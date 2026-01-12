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
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { reactivatePerson } from "@/app/actions/people"
import { useToast } from "@/hooks/use-toast"
import type { Person } from "@/lib/types"

interface ReactivatePersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onSuccess: () => void
}

export function ReactivatePersonModal({
  open,
  onOpenChange,
  person,
  onSuccess,
}: ReactivatePersonModalProps) {
  const { toast } = useToast()
  const [isReactivating, setIsReactivating] = useState(false)

  const handleReactivate = async () => {
    if (!person) return

    setIsReactivating(true)

    const result = await reactivatePerson(person.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Pessoa reativada com sucesso",
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao reativar pessoa",
        variant: "destructive",
      })
    }

    setIsReactivating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <RotateCcw className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Reativar Pessoa</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Esta ação irá reativar o cadastro desta pessoa. O cadastro voltará a aparecer nas listagens
            e poderá ser utilizado normalmente no sistema.
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

        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4">
          <div className="flex gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">
                Após a reativação:
              </p>
              <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
                <li>O cadastro voltará a aparecer na listagem de pessoas ativas</li>
                <li>Poderá ser vinculado a novos contratos e transações</li>
                <li>Todos os dados anteriores serão preservados</li>
                <li>O cadastro poderá ser editado normalmente</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isReactivating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleReactivate}
            disabled={isReactivating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isReactivating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reativando...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reativar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
