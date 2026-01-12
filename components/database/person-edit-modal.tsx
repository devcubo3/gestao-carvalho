"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { updatePerson, type UpdatePersonFormData } from "@/app/actions/people"
import type { Person } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface PersonEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person | null
  onSuccess?: () => void
}

export function PersonEditModal({ open, onOpenChange, person, onSuccess }: PersonEditModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cpfError, setCpfError] = useState<string>("")
  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    email: "",
    phone: "",
    mobile_phone: "",
  })

  useEffect(() => {
    if (person && open) {
      setFormData({
        full_name: person.full_name || "",
        cpf: person.cpf || "",
        email: person.email || "",
        phone: person.phone || "",
        mobile_phone: person.mobile_phone || "",
      })
      setCpfError("")
    }
  }, [person, open])

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '')
    
    if (cleanCPF.length !== 11) {
      return false
    }
    
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false
    }
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    let digit1 = remainder >= 10 ? 0 : remainder
    
    if (digit1 !== parseInt(cleanCPF.charAt(9))) {
      return false
    }
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    let digit2 = remainder >= 10 ? 0 : remainder
    
    if (digit2 !== parseInt(cleanCPF.charAt(10))) {
      return false
    }
    
    return true
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    
    return numbers.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setFormData({ ...formData, cpf: formatted })
    
    if (formatted.length === 14) {
      if (!validateCPF(formatted)) {
        setCpfError("CPF inválido")
      } else {
        setCpfError("")
      }
    } else {
      setCpfError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!person) return
    
    setIsLoading(true)

    try {
      const updateData: UpdatePersonFormData = {
        id: person.id,
        full_name: formData.full_name,
        cpf: formData.cpf,
        email: formData.email || null,
        phone: formData.phone || null,
        mobile_phone: formData.mobile_phone || null,
      }

      const result = await updatePerson(updateData)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Pessoa atualizada com sucesso!",
        })
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar pessoa",
          variant: "destructive",
        })

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors.length > 0) {
              toast({
                title: `Erro no campo ${field}`,
                description: errors[0],
                variant: "destructive",
              })
            }
          })
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar pessoa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!person) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Pessoa</DialogTitle>
          <DialogDescription>
            Atualize os dados da pessoa física no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Digite o nome completo"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => handleCPFChange(e.target.value)}
              placeholder="000.000.000-00"
              required
              disabled={isLoading}
              maxLength={14}
              className={cpfError ? "border-red-500" : ""}
            />
            {cpfError && (
              <p className="text-sm text-red-500">{cpfError}</p>
            )}
            {formData.cpf.length === 14 && !cpfError && (
              <p className="text-sm text-green-600">✓ CPF válido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 0000-0000"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Celular</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={isLoading}
              />
            </div>
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
            <Button type="submit" disabled={isLoading || !!cpfError}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
