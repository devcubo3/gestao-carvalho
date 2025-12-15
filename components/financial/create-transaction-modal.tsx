"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { createCashTransaction } from "@/app/actions/cash"
import { useToast } from "@/hooks/use-toast"
import type { BankAccount } from "@/lib/types"

interface CreateTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: BankAccount[]
  onSuccess: () => void
}

export function CreateTransactionModal({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: CreateTransactionModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    bank_account_id: '',
    transaction_date: new Date(),
    type: 'entrada' as 'entrada' | 'saida',
    description: '',
    vinculo: '',
    forma: 'Caixa' as 'Caixa' | 'Permuta',
    centro_custo: '',
    value: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createCashTransaction({
      ...formData,
      value: Number(formData.value),
      transaction_date: formData.transaction_date.toISOString().split('T')[0],
    })

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })
      onOpenChange(false)
      onSuccess()
      // Reset form
      setFormData({
        bank_account_id: '',
        transaction_date: new Date(),
        type: 'entrada',
        description: '',
        vinculo: '',
        forma: 'Caixa',
        centro_custo: '',
        value: '',
        notes: '',
      })
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao registrar movimentação",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Conta */}
            <div className="space-y-2">
              <Label htmlFor="bank_account_id">Conta *</Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.transaction_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.transaction_date, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.transaction_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, transaction_date: date })
                        setDateOpen(false)
                      }
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>

            {/* Vínculo */}
            <div className="space-y-2">
              <Label htmlFor="vinculo">Vínculo *</Label>
              <Select
                value={formData.vinculo}
                onValueChange={(value) => setFormData({ ...formData, vinculo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contratos">Contratos</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Aluguéis">Aluguéis</SelectItem>
                  <SelectItem value="Comissões">Comissões</SelectItem>
                  <SelectItem value="Despesas">Despesas</SelectItem>
                  <SelectItem value="Investimentos">Investimentos</SelectItem>
                  <SelectItem value="Impostos">Impostos</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Forma */}
            <div className="space-y-2">
              <Label htmlFor="forma">Forma *</Label>
              <Select
                value={formData.forma}
                onValueChange={(value: 'Caixa' | 'Permuta') => setFormData({ ...formData, forma: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="Permuta">Permuta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="centro_custo">Centro de Custo *</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(value) => setFormData({ ...formData, centro_custo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Veículos">Veículos</SelectItem>
                  <SelectItem value="Imóveis">Imóveis</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="Obras">Obras</SelectItem>
                  <SelectItem value="Predial">Predial</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Descrição da movimentação"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
