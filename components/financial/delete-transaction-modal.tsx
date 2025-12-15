"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { deleteCashTransaction } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { CashTransaction } from "@/lib/types"

interface DeleteTransactionModalProps {
  transaction: CashTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteTransactionModal({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!transaction) return

    setIsDeleting(true)

    const result = await deleteCashTransaction(transaction.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso",
      })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir lançamento",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
  }

  if (!transaction) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-foreground font-medium">
              Tem certeza que deseja excluir este lançamento?
            </p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{formatDate(transaction.transaction_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium capitalize">{transaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição:</span>
                <span className="font-medium">{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className={`font-bold ${transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.value)}
                </span>
              </div>
            </div>

            <p className="text-destructive text-xs">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. O saldo da conta será
              recalculado automaticamente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Lançamento"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
