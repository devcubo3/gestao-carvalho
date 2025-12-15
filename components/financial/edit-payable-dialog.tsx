"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { mockVinculos, mockCentrosCusto } from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import type { AccountPayable } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

type SimplePerson = { id: string; full_name: string; cpf?: string }
type SimpleCompany = { id: string; trade_name: string; cnpj?: string }

interface EditPayableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountPayable | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

export function EditPayableDialog({ open, onOpenChange, account, onSubmit, submitting = false }: EditPayableDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    description: "",
    counterparty: "",
    original_value: 0,
    due_date: "",
    vinculo: "",
    centro_custo: "",
    person_id: null as string | null,
    company_id: null as string | null,
    installment_current: null as number | null,
    installment_total: null as number | null,
    notes: "",
  })

  const [people, setPeople] = useState<SimplePerson[]>([])
  const [companies, setCompanies] = useState<SimpleCompany[]>([])
  const [counterpartyType, setCounterpartyType] = useState<"person" | "company">("person")
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open) {
      loadPeopleAndCompanies()
    }
  }, [open])

  useEffect(() => {
    if (account) {
      // Converter a data para formato yyyy-MM-dd se necessário
      const dateStr = typeof account.due_date === 'string' 
        ? account.due_date.split('T')[0] 
        : new Date(account.due_date).toISOString().split('T')[0]

      // Determinar tipo de contraparte baseado nos IDs
      const isCompany = !!account.company_id
      setCounterpartyType(isCompany ? "company" : "person")

      setFormData({
        description: account.description || "",
        counterparty: account.counterparty || "",
        original_value: account.original_value || 0,
        due_date: dateStr,
        vinculo: account.vinculo || "",
        centro_custo: account.centro_custo || "",
        person_id: account.person_id || null,
        company_id: account.company_id || null,
        installment_current: account.installment_current || null,
        installment_total: account.installment_total || null,
        notes: account.notes || "",
      })
    }
  }, [account])

  const loadPeopleAndCompanies = async () => {
    setLoadingData(true)
    const supabase = createClient()

    const [peopleResult, companiesResult] = await Promise.all([
      supabase.from('people').select('id, full_name, cpf').eq('status', 'ativo').order('full_name'),
      supabase.from('companies').select('id, trade_name, cnpj').eq('status', 'ativo').order('trade_name')
    ])

    if (peopleResult.data) setPeople(peopleResult.data as SimplePerson[])
    if (companiesResult.data) setCompanies(companiesResult.data as SimpleCompany[])
    setLoadingData(false)
  }

  const handleCounterpartyTypeChange = (type: "person" | "company") => {
    setCounterpartyType(type)
    setFormData({
      ...formData,
      person_id: null,
      company_id: null,
      counterparty: "",
    })
  }

  const handlePersonChange = (personId: string) => {
    const person = people.find((p) => p.id === personId)
    if (person) {
      setFormData({
        ...formData,
        person_id: personId,
        company_id: null,
        counterparty: person.full_name,
      })
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (company) {
      setFormData({
        ...formData,
        company_id: companyId,
        person_id: null,
        counterparty: company.trade_name,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    // Validações
    if (!formData.description.trim()) {
      toast({
        title: "Erro de validação",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!formData.counterparty.trim()) {
      toast({
        title: "Erro de validação",
        description: "Contraparte é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (formData.original_value <= 0) {
      toast({
        title: "Erro de validação",
        description: "Valor deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    if (!formData.due_date) {
      toast({
        title: "Erro de validação",
        description: "Data de vencimento é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!formData.vinculo) {
      toast({
        title: "Erro de validação",
        description: "Vínculo é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!formData.centro_custo) {
      toast({
        title: "Erro de validação",
        description: "Centro de custo é obrigatório",
        variant: "destructive",
      })
      return
    }

    // Validar parcelamento se informado
    if (formData.installment_current || formData.installment_total) {
      if (!formData.installment_current || !formData.installment_total) {
        toast({
          title: "Erro de validação",
          description: "Informe parcela atual e total de parcelas",
          variant: "destructive",
        })
        return
      }
      if (formData.installment_current > formData.installment_total) {
        toast({
          title: "Erro de validação",
          description: "Parcela atual não pode ser maior que o total",
          variant: "destructive",
        })
        return
      }
    }

    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
          <DialogDescription>
            Edite as informações da conta a pagar. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento de aluguel"
                required
              />
            </div>

            {/* Tipo de Contraparte */}
            <div className="grid gap-2">
              <Label htmlFor="counterpartyType">Tipo de Contraparte *</Label>
              <Select value={counterpartyType} onValueChange={handleCounterpartyTypeChange}>
                <SelectTrigger id="counterpartyType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Pessoa</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Pessoa ou Empresa */}
            {counterpartyType === "person" ? (
              <div className="grid gap-2">
                <Label htmlFor="person">Pessoa *</Label>
                <Select 
                  value={formData.person_id || undefined} 
                  onValueChange={handlePersonChange}
                  disabled={loadingData}
                >
                  <SelectTrigger id="person">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione uma pessoa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name} {person.cpf && `- ${person.cpf}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select 
                  value={formData.company_id || undefined} 
                  onValueChange={handleCompanyChange}
                  disabled={loadingData}
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione uma empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.trade_name} {company.cnpj && `- ${company.cnpj}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contraparte Manual (somente leitura se selecionado) */}
            <div className="grid gap-2">
              <Label htmlFor="counterparty">Nome da Contraparte *</Label>
              <Input
                id="counterparty"
                value={formData.counterparty}
                onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
                placeholder="Nome de quem vai receber o pagamento"
                required
              />
            </div>

            {/* Valor */}
            <div className="grid gap-2">
              <Label htmlFor="original_value">Valor Original *</Label>
              <Input
                id="original_value"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.original_value}
                onChange={(e) => setFormData({ ...formData, original_value: Number.parseFloat(e.target.value) })}
                required
              />
            </div>

            {/* Data de Vencimento */}
            <div className="grid gap-2">
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            {/* Vínculo */}
            <div className="grid gap-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select value={formData.vinculo} onValueChange={(value) => setFormData({ ...formData, vinculo: value })}>
                <SelectTrigger id="vinculo">
                  <SelectValue placeholder="Selecione o vínculo" />
                </SelectTrigger>
                <SelectContent>
                  {mockVinculos.map((vinculo) => (
                    <SelectItem key={vinculo} value={vinculo}>
                      {vinculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Custo */}
            <div className="grid gap-2">
              <Label htmlFor="centro_custo">Centro de Custo *</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(value) => setFormData({ ...formData, centro_custo: value })}
              >
                <SelectTrigger id="centro_custo">
                  <SelectValue placeholder="Selecione o centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {mockCentrosCusto.map((centro) => (
                    <SelectItem key={centro} value={centro}>
                      {centro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parcelamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="installment_current">Parcela Atual</Label>
                <Input
                  id="installment_current"
                  type="number"
                  min="1"
                  value={formData.installment_current || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installment_current: e.target.value ? Number.parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="installment_total">Total de Parcelas</Label>
                <Input
                  id="installment_total"
                  type="number"
                  min="1"
                  value={formData.installment_total || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installment_total: e.target.value ? Number.parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ex: 12"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
