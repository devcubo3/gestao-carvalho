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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { createCompany, validateCNPJ } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"

interface CompanyCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CompanyCreateModal({ open, onOpenChange, onSuccess }: CompanyCreateModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cnpjValidation, setCnpjValidation] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  
  const [formData, setFormData] = useState({
    trade_name: "",
    cnpj: "",
    gra_percentage: "0",
  })

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const handleCNPJChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setFormData({ ...formData, cnpj: formatted })
    
    // Validar CNPJ quando estiver completo
    if (formatted.length === 18) {
      const result = await validateCNPJ(formatted)
      if (result.success && result.data !== undefined) {
        const isValid = result.data
        setCnpjValidation({
          isValid,
          message: isValid ? 'CNPJ válido' : 'CNPJ inválido'
        })
      }
    } else {
      setCnpjValidation({ isValid: null, message: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await createCompany({
      trade_name: formData.trade_name,
      cnpj: formData.cnpj,
      gra_percentage: parseFloat(formData.gra_percentage) || 0,
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Empresa cadastrada com sucesso!",
      })
      setFormData({ trade_name: "", cnpj: "", gra_percentage: "0" })
      setCnpjValidation({ isValid: null, message: '' })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao cadastrar empresa",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleCancel = () => {
    setFormData({ trade_name: "", cnpj: "", gra_percentage: "0" })
    setCnpjValidation({ isValid: null, message: '' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>Cadastre uma nova pessoa jurídica no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="trade_name">
              Nome Fantasia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="trade_name"
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              placeholder="Digite o nome fantasia"
              required
              disabled={isLoading}
            />
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                required
                disabled={isLoading}
                maxLength={18}
                className={
                  cnpjValidation.isValid === true
                    ? 'border-green-500'
                    : cnpjValidation.isValid === false
                    ? 'border-red-500'
                    : ''
                }
              />
              {cnpjValidation.isValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {cnpjValidation.isValid === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              )}
            </div>
            {cnpjValidation.message && (
              <p
                className={`text-sm ${
                  cnpjValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {cnpjValidation.message}
              </p>
            )}
          </div>

          {/* % GRA */}
          <div className="space-y-2">
            <Label htmlFor="gra_percentage">% GRA</Label>
            <div className="relative">
              <Input
                id="gra_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.gra_percentage}
                onChange={(e) => setFormData({ ...formData, gra_percentage: e.target.value })}
                placeholder="0.00"
                disabled={isLoading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Percentual GRA entre 0 e 100</p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || cnpjValidation.isValid === false}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Empresa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
