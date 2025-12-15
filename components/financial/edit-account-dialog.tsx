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
import type { AccountReceivable, Person, Company } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface EditAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountReceivable | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

export function EditAccountDialog({ open, onOpenChange, account, onSubmit, submitting = false }: EditAccountDialogProps) {
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

  const [people, setPeople] = useState<Person[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
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

    if (peopleResult.data) setPeople(peopleResult.data)
    if (companiesResult.data) setCompanies(companiesResult.data)
    setLoadingData(false)
  }

  const handleCounterpartyTypeChange = (type: "person" | "company") => {
    setCounterpartyType(type)
    setFormData(prev => ({
      ...prev,
      counterparty: "",
      person_id: null,
      company_id: null,
    }))
  }

  const handlePersonSelect = (personId: string) => {
    const person = people.find(p => p.id === personId)
    if (person) {
      setFormData(prev => ({
        ...prev,
        person_id: personId,
        company_id: null,
        counterparty: person.full_name,
      }))
    }
  }

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setFormData(prev => ({
        ...prev,
        company_id: companyId,
        person_id: null,
        counterparty: company.trade_name,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que counterparty está preenchido
    if (!formData.counterparty || formData.counterparty.trim() === '') {
      toast({
        title: "Erro",
        description: "Selecione uma pessoa ou empresa para a contraparte",
        variant: "destructive",
      })
      return
    }

    // Preparar dados para envio
    const submitData: any = {
      description: formData.description,
      counterparty: formData.counterparty,
      original_value: formData.original_value,
      due_date: formData.due_date,
      vinculo: formData.vinculo,
      centro_custo: formData.centro_custo,
      person_id: formData.person_id,
      company_id: formData.company_id,
      notes: formData.notes || null,
    }

    // Adicionar parcelamento se informado
    if (formData.installment_total && formData.installment_total > 1) {
      submitData.installment_current = formData.installment_current || 1
      submitData.installment_total = formData.installment_total
    }

    onSubmit(submitData)
  }

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
          <DialogDescription>
            Edite as informações da conta {account.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva a conta a receber..."
              required
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Contraparte (Pagador) *</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={counterpartyType === "person" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCounterpartyTypeChange("person")}
                className="flex-1"
              >
                Pessoa
              </Button>
              <Button
                type="button"
                variant={counterpartyType === "company" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCounterpartyTypeChange("company")}
                className="flex-1"
              >
                Empresa
              </Button>
            </div>

            {counterpartyType === "person" && (
              <Select
                value={formData.person_id || ""}
                onValueChange={handlePersonSelect}
                required
                disabled={loadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione uma pessoa"} />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name} - {person.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {counterpartyType === "company" && (
              <Select
                value={formData.company_id || ""}
                onValueChange={handleCompanySelect}
                required
                disabled={loadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione uma empresa"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.trade_name} - {company.cnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_value">Valor Total (R$) *</Label>
              <Input
                id="original_value"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.original_value || ""}
                onChange={(e) => handleChange("original_value", Number.parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select value={formData.vinculo} onValueChange={(value) => handleChange("vinculo", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar vínculo" />
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

            <div className="space-y-2">
              <Label htmlFor="centro_custo">Centro de Custo *</Label>
              <Select value={formData.centro_custo} onValueChange={(value) => handleChange("centro_custo", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar centro de custo" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="installment_total">Total de Parcelas</Label>
            <Input
              id="installment_total"
              type="number"
              min="1"
              placeholder="Ex: 12 (deixe vazio se não for parcelado)"
              value={formData.installment_total || ""}
              onChange={(e) => handleChange("installment_total", e.target.value ? Number.parseInt(e.target.value) : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais (opcional)"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
            />
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
