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
import { AlertTriangle } from "lucide-react"
import { deleteContract } from "@/app/actions/contracts"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface DeleteContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  contractCode: string
}

export function DeleteContractDialog({
  open,
  onOpenChange,
  contractId,
  contractCode,
}: DeleteContractDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteContract(contractId)
      
      if (result.success) {
        toast({
          title: "Contrato excluído!",
          description: result.message,
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Erro ao excluir contrato",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir contrato",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            Você está prestes a excluir o contrato{" "}
            <span className="font-semibold text-foreground">"{contractCode}"</span>.
            <br />
            <br />
            <strong className="text-red-600">ATENÇÃO:</strong> Esta ação irá{" "}
            <strong>excluir permanentemente</strong>:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>O contrato e todas as suas informações</li>
              <li>Todas as transações de caixa vinculadas</li>
              <li>Todas as contas a receber vinculadas</li>
              <li>Todas as contas a pagar vinculadas</li>
              <li>Partes, itens e condições de pagamento</li>
            </ul>
            <br />
            <strong className="text-red-600">
              Esta operação não pode ser desfeita!
            </strong>
            <br />
            <br />
            Os saldos das contas bancárias serão revertidos automaticamente.
            <br />
            <br />
            Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Excluindo..." : "Sim, Excluir Permanentemente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
