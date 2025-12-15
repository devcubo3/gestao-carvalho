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
import { createClient } from "@/lib/supabase/client"
import type { Credit } from "@/lib/types"

interface EditCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit: Credit | null
  onSubmit: (data: any) => void
  submitting?: boolean
}

export function EditCreditDialog({ 
  open, 
  onOpenChange, 
  credit, 
  onSubmit, 
  submitting = false 
}: EditCreditDialogProps) {
  const [formData, setFormData] = useState({
    creditor_id: "",
    creditor_type: "" as 'pessoa' | 'empresa' | '',
    origin: "",
    nominal_value: "",
    start_date: "",
    due_date: "",
    notes: "",
  })
  const [people, setPeople] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      fetchPeopleAndCompanies()
    }
  }, [open])

  useEffect(() => {
    if (credit) {
      setFormData({
        creditor_id: credit.creditor_id || "",
        creditor_type: credit.creditor_type || "",
        origin: credit.origin || "",
        nominal_value: credit.nominal_value?.toString() || "",
        start_date: credit.start_date || "",
        due_date: credit.due_date || "",
        notes: credit.notes || "",
      })
    }
  }, [credit])

  const fetchPeopleAndCompanies = async () => {
    const supabase = createClient()
    
    const [peopleResult, companiesResult] = await Promise.all([
      supabase.from("people").select("id, full_name").eq("status", "ativo").order("full_name"),
      supabase.from("companies").select("id, trade_name").eq("status", "ativo").order("trade_name"),
    ])

    if (peopleResult.data) setPeople(peopleResult.data)
    if (companiesResult.data) setCompanies(companiesResult.data)
  }

  const creditorOptions = [
    ...people.map((p) => ({ value: p.id, label: p.full_name, type: "pessoa" as const })),
    ...companies.map((c) => ({ value: c.id, label: c.trade_name, type: "empresa" as const })),
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const dataToSubmit = {
      creditor_id: formData.creditor_id,
      creditor_type: formData.creditor_type as 'pessoa' | 'empresa',
      origin: formData.origin,
      nominal_value: parseFloat(formData.nominal_value),
      start_date: formData.start_date,
      due_date: formData.due_date || undefined,
      notes: formData.notes || undefined,
    }

    onSubmit(dataToSubmit)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreditorChange = (value: string) => {
    const option = creditorOptions.find((opt) => opt.value === value)
    setFormData((prev) => ({
      ...prev,
      creditor_id: value,
      creditor_type: option?.type || "",
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Crédito</DialogTitle>
          <DialogDescription>Atualize as informações da carta de crédito.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input value={credit?.code || ""} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creditor">Cedente *</Label>
              <Select value={formData.creditor_id} onValueChange={handleCreditorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cedente" />
                </SelectTrigger>
                <SelectContent>
                  {creditorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({option.type === 'pessoa' ? 'Pessoa' : 'Empresa'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="origin">Descrição/Origem *</Label>
              <Textarea
                id="origin"
                placeholder="Ex: Empréstimo para capital de giro..."
                value={formData.origin}
                onChange={(e) => handleInputChange("origin", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nominal_value">Valor (R$) *</Label>
              <Input
                id="nominal_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="50000.00"
                value={formData.nominal_value}
                onChange={(e) => handleInputChange("nominal_value", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a carta de crédito"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
