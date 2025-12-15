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
import { deleteCompany } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"

interface DeleteCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess: () => void
}

export function DeleteCompanyModal({
  open,
  onOpenChange,
  company,
  onSuccess,
}: DeleteCompanyModalProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!company) return

    setIsDeleting(true)

    const result = await deleteCompany(company.id)

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa desativada com sucesso",
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao desativar empresa",
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
            <DialogTitle className="text-xl">Desativar Empresa</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Tem certeza que deseja desativar esta empresa? O cadastro ficará inativo e não aparecerá nas listagens, mas os dados serão preservados e poderão ser reativados posteriormente.
          </DialogDescription>
        </DialogHeader>

        {company && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div>
              <span className="text-sm font-medium">Nome Fantasia:</span>{" "}
              <span className="text-sm">{company.trade_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium">CNPJ:</span>{" "}
              <span className="text-sm font-mono">{company.cnpj}</span>
            </div>
            <div>
              <span className="text-sm font-medium">% GRA:</span>{" "}
              <span className="text-sm">{company.gra_percentage.toFixed(2).replace('.', ',')}%</span>
            </div>
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
