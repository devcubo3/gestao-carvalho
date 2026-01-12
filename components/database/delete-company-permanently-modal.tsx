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
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react"
import { deleteCompanyPermanently } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"

interface DeleteCompanyPermanentlyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess: () => void
}

export function DeleteCompanyPermanentlyModal({
  open,
  onOpenChange,
  company,
  onSuccess,
}: DeleteCompanyPermanentlyModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationChecked, setConfirmationChecked] = useState(false)

  const handleDelete = async () => {
    if (!company || !confirmationChecked) return

    setIsDeleting(true)

    const result = await deleteCompanyPermanently(company.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa excluída permanentemente",
      })
      onOpenChange(false)
      setConfirmationChecked(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir empresa",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) setConfirmationChecked(false)
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
              <ShieldAlert className="h-6 w-6 text-destructive-foreground" />
            </div>
            <DialogTitle className="text-xl">Excluir Permanentemente</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            <span className="font-semibold text-destructive">ATENÇÃO: Esta ação é irreversível!</span>
            <br />
            A exclusão permanente removerá todos os dados desta empresa do sistema.
          </DialogDescription>
        </DialogHeader>

        {company && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
              <div>
                <span className="text-sm font-medium">Nome Fantasia:</span>{" "}
                <span className="text-sm">{company.trade_name}</span>
              </div>
              {company.cnpj && (
                <div>
                  <span className="text-sm font-medium">CNPJ:</span>{" "}
                  <span className="text-sm font-mono">{company.cnpj}</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium">% GRA:</span>{" "}
                <span className="text-sm">{company.gra_percentage.toFixed(2).replace('.', ',')}%</span>
              </div>
            </div>

            <div className="rounded-lg border-2 border-destructive/20 bg-muted p-4 space-y-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Problemas que podem ocorrer ao excluir:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Contratos vinculados a esta empresa poderão apresentar erros</li>
                    <li>Contas a pagar/receber vinculadas poderão ficar inconsistentes</li>
                    <li>Histórico de transações financeiras será perdido</li>
                    <li>Relatórios poderão apresentar dados incompletos</li>
                    <li>Referências em documentos ficarão quebradas</li>
                    <li>Não será possível recuperar os dados após a exclusão</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-background">
              <Checkbox
                id="confirm-delete"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                Eu entendo que esta ação é <span className="font-semibold">irreversível</span> e que
                pode causar <span className="font-semibold">problemas graves</span> no sistema.
                Confirmo que desejo excluir permanentemente este cadastro.
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setConfirmationChecked(false)
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !confirmationChecked}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Excluir Permanentemente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
