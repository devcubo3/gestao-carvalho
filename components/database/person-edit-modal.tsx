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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    birth_date: "",
    nationality: "",
    marital_status: "",
    profession: "",
    rg: "",
    rg_issuer: "",
    rg_issue_date: "",
    notes: "",
  })

  useEffect(() => {
    if (person && open) {
      setFormData({
        full_name: person.full_name || "",
        cpf: person.cpf || "",
        email: person.email || "",
        phone: person.phone || "",
        mobile_phone: person.mobile_phone || "",
        street: person.street || "",
        number: person.number || "",
        complement: person.complement || "",
        neighborhood: person.neighborhood || "",
        city: person.city || "",
        state: person.state || "",
        zip_code: person.zip_code || "",
        birth_date: person.birth_date || "",
        nationality: person.nationality || "",
        marital_status: person.marital_status || "",
        profession: person.profession || "",
        rg: person.rg || "",
        rg_issuer: person.rg_issuer || "",
        rg_issue_date: person.rg_issue_date || "",
        notes: person.notes || "",
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
        ...formData,
        marital_status: formData.marital_status as any,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pessoa</DialogTitle>
          <DialogDescription>
            Atualize os dados da pessoa física no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Dados Pessoais</h3>
            
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Brasileiro"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marital_status">Estado Civil</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="Profissão"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Documentos</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="00.000.000-0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg_issuer">Órgão Emissor</Label>
                <Input
                  id="rg_issuer"
                  value={formData.rg_issuer}
                  onChange={(e) => setFormData({ ...formData, rg_issuer: e.target.value })}
                  placeholder="SSP"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg_issue_date">Data de Emissão</Label>
                <Input
                  id="rg_issue_date"
                  type="date"
                  value={formData.rg_issue_date}
                  onChange={(e) => setFormData({ ...formData, rg_issue_date: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Contato</h3>
            
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
          </div>

          {/* Endereço */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Rua, Avenida..."
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="000"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto, Bloco..."
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Bairro"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="00000-000"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Observações</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
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
