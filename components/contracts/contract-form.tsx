"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { createContract, getNextContractCode } from "@/app/actions/contracts"
import type { ContractSide, ContractPartyType, ContractItemType, ContractFormParty, ContractFormItem } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  ChevronDown,
  X,
  Users,
  Package,
  User,
  Building,
  Car,
  CreditCard,
  MapPin,
  MoreVertical,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Contract } from "@/lib/types"
import { IncludeItemModal } from "./include-item-modal"
import { CreateItemModal } from "./create-item-modal"
import { SearchCompanyModal } from "./search-company-modal"
import { SearchPersonModal } from "./search-person-modal"
import { SearchItemModal } from "./search-item-modal"
import { SelectItemTypeModal } from "./select-item-type-modal"
import { PersonCreateModal } from "@/components/database/person-create-modal"
import { CompanyCreateModal } from "@/components/database/company-create-modal"

interface PaymentCondition {
  id: string
  value: number
  type: "Único" | "Parcelado"
  frequency: "Semanal" | "Mensal" | "Trimestral" | "Semestral" | "Anual"
  startDate: string
  endDate: string
  installments?: number
  installmentValue?: number
  direction: "Entrada" | "Saída"
}

export function ContractForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = React.useState(false)
  
  const [contractData, setContractData] = React.useState<Partial<Contract>>({
    code: "Carregando...",
    date: new Date(),
    sideA: {
      name: "Lado A – GRA e Outros",
      parties: [],
      items: [],
      totalValue: 0,
    },
    sideB: {
      name: "Lado B – Terceiros",
      parties: [],
      items: [],
      totalValue: 0,
    },
    balance: 0,
    notes: "",
  })

  // Buscar o próximo código ao montar o componente
  React.useEffect(() => {
    const loadNextCode = async () => {
      const nextCode = await getNextContractCode()
      setContractData(prev => ({
        ...prev,
        code: nextCode
      }))
    }
    loadNextCode()
  }, [])

  const [graPercentage, setGraPercentage] = React.useState<string>("")
  const [allParties, setAllParties] = React.useState<any[]>([])

  const [paymentConditions, setPaymentConditions] = React.useState<PaymentCondition[]>([])

  const [currentStep, setCurrentStep] = React.useState(1)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])

  const [createPersonModalOpen, setCreatePersonModalOpen] = React.useState(false)
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = React.useState(false)
  const [addPartyModalOpen, setAddPartyModalOpen] = React.useState(false)
  const [addItemModalOpen, setAddItemModalOpen] = React.useState(false)
  const [selectedSide, setSelectedSide] = React.useState<"A" | "B">("A")

  const [selectItemTypeModalOpen, setSelectItemTypeModalOpen] = React.useState(false)
  const [includeItemModalOpen, setIncludeItemModalOpen] = React.useState(false)
  const [createItemModalOpen, setCreateItemModalOpen] = React.useState(false)
  const [selectedItemType, setSelectedItemType] = React.useState<string>("")

  const [searchPersonModalOpen, setSearchPersonModalOpen] = React.useState(false)
  const [searchCompanyModalOpen, setSearchCompanyModalOpen] = React.useState(false)

  const [searchItemModalOpen, setSearchItemModalOpen] = React.useState(false)

  const steps = [
    { id: 1, title: "Metadados", description: "Informações básicas do contrato" },
    { id: 2, title: "Partes", description: "Definir as partes interessadas" },
    { id: 3, title: "Itens", description: "Adicionar itens e valores" },
    { id: 4, title: "Pagamento", description: "Condições de pagamento" },
    { id: 5, title: "Resumo", description: "Validação e finalização" },
  ]

  React.useEffect(() => {
    const sideAParties = contractData.sideA?.parties || []
    // GRA percentage removed - parties don't have percentage property
    setGraPercentage("0.00")

    // Atualizar lista de todas as partes
    const sideBParties = contractData.sideB?.parties || []
    setAllParties([...sideAParties, ...sideBParties])
  }, [contractData.sideA?.parties, contractData.sideB?.parties])

  const calculateBalance = React.useCallback(() => {
    const sideATotal = contractData.sideA?.totalValue || 0
    const sideBTotal = contractData.sideB?.totalValue || 0
    const balance = sideATotal - sideBTotal

    setContractData((prev) => ({
      ...prev,
      balance,
    }))

    return balance
  }, [contractData.sideA?.totalValue, contractData.sideB?.totalValue])

  const validateContract = React.useCallback(() => {
    const errors: string[] = []

    if (!contractData.date) {
      errors.push("Data do contrato é obrigatória")
    }

    if (!allParties.length) {
      errors.push("Deve ter pelo menos uma parte")
    }

    // Calcular diferença entre valor dos itens que saem e total de pagamentos
    const saidaItens = contractData.sideB?.totalValue || 0
    const totalPagamentos = paymentConditions.reduce((sum, condition) => sum + condition.value, 0)
    const diferenca = saidaItens - totalPagamentos

    if (Math.abs(diferenca) > 0.01) {
      errors.push("Contrato deve estar balanceado (diferença = R$ 0,00)")
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [contractData, allParties, paymentConditions])

  const createFinancialMovements = async (contractId: string, contractCode: string) => {
    const supabase = createClient()
    
    // Buscar primeira conta bancária ativa para usar nas transações
    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('status', 'ativo')
      .limit(1)
      .single()

    if (!bankAccount) {
      throw new Error('Nenhuma conta bancária ativa encontrada')
    }

    const bankAccountId = bankAccount.id

    for (const condition of paymentConditions) {
      const isEntrada = condition.direction === 'Entrada'
      const isUnico = condition.type === 'Único'

      if (isEntrada && isUnico) {
        // Entrada + Único -> Criar transação no caixa
        await supabase.from('cash_transactions').insert({
          code: contractCode,
          bank_account_id: bankAccountId,
          transaction_date: condition.startDate,
          type: 'entrada',
          description: `Entrada referente ao contrato ${contractCode}`,
          vinculo: 'Contratos',
          forma: 'Caixa',
          centro_custo: 'Contratos',
          value: condition.value,
          balance_after: 0, // Será atualizado por trigger
          contract_id: contractId,
          status: 'efetivado',
        })
      } else if (isEntrada && !isUnico) {
        // Entrada + Parcelado -> Criar conta a receber
        const installments = condition.installments || 1
        const installmentValue = condition.installmentValue || condition.value

        for (let i = 1; i <= installments; i++) {
          const dueDate = new Date(condition.startDate)
          
          // Calcular data de vencimento baseado na frequência
          switch (condition.frequency) {
            case 'Semanal':
              dueDate.setDate(dueDate.getDate() + (i - 1) * 7)
              break
            case 'Mensal':
              dueDate.setMonth(dueDate.getMonth() + (i - 1))
              break
            case 'Trimestral':
              dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3)
              break
            case 'Semestral':
              dueDate.setMonth(dueDate.getMonth() + (i - 1) * 6)
              break
            case 'Anual':
              dueDate.setFullYear(dueDate.getFullYear() + (i - 1))
              break
          }

          await supabase.from('accounts_receivable').insert({
            code: `${contractCode}-${i}/${installments}`,
            contract_id: contractId,
            description: `Parcela ${i}/${installments} do contrato ${contractCode}`,
            counterparty: 'Contrato',
            original_value: installmentValue,
            remaining_value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            vinculo: 'Contratos',
            centro_custo: 'Contratos',
            installment_current: i,
            installment_total: installments,
            status: 'em_aberto',
          })
        }
      } else if (!isEntrada && isUnico) {
        // Saída + Único -> Criar transação no caixa
        await supabase.from('cash_transactions').insert({
          code: contractCode,
          bank_account_id: bankAccountId,
          transaction_date: condition.startDate,
          type: 'saida',
          description: `Saída referente ao contrato ${contractCode}`,
          vinculo: 'Contratos',
          forma: 'Caixa',
          centro_custo: 'Contratos',
          value: condition.value,
          balance_after: 0, // Será atualizado por trigger
          contract_id: contractId,
          status: 'efetivado',
        })
      } else if (!isEntrada && !isUnico) {
        // Saída + Parcelado -> Criar conta a pagar
        const installments = condition.installments || 1
        const installmentValue = condition.installmentValue || condition.value

        for (let i = 1; i <= installments; i++) {
          const dueDate = new Date(condition.startDate)
          
          // Calcular data de vencimento baseado na frequência
          switch (condition.frequency) {
            case 'Semanal':
              dueDate.setDate(dueDate.getDate() + (i - 1) * 7)
              break
            case 'Mensal':
              dueDate.setMonth(dueDate.getMonth() + (i - 1))
              break
            case 'Trimestral':
              dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3)
              break
            case 'Semestral':
              dueDate.setMonth(dueDate.getMonth() + (i - 1) * 6)
              break
            case 'Anual':
              dueDate.setFullYear(dueDate.getFullYear() + (i - 1))
              break
          }

          await supabase.from('accounts_payable').insert({
            code: `${contractCode}-${i}/${installments}`,
            contract_id: contractId,
            description: `Parcela ${i}/${installments} do contrato ${contractCode}`,
            counterparty: 'Contrato',
            original_value: installmentValue,
            remaining_value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            vinculo: 'Contratos',
            centro_custo: 'Contratos',
            installment_current: i,
            installment_total: installments,
            status: 'em_aberto',
          })
        }
      }
    }
  }

  const handleSave = async (activate = false) => {
    if (activate && !validateContract()) {
      return
    }

    setSubmitting(true)
    
    try {
      // Transform parties from both sides to flat array with side field
      const parties: ContractFormParty[] = [
        ...(contractData.sideA?.parties || []).map(p => ({
          party_type: p.type as ContractPartyType,
          party_id: p.id,
          party_name: p.name,
          party_document: p.document,
          side: 'A' as unknown as ContractSide,
          gra_percentage: 0,
        })),
        ...(contractData.sideB?.parties || []).map(p => ({
          party_type: p.type as ContractPartyType,
          party_id: p.id,
          party_name: p.name,
          party_document: p.document,
          side: 'B' as unknown as ContractSide,
          gra_percentage: 0,
        })),
      ]

      // Transform items from both sides to flat array with side field
      const items: ContractFormItem[] = [
        ...(contractData.sideA?.items || []).map(item => ({
          item_type: item.type as ContractItemType,
          item_id: item.itemId || null,
          description: item.description || item.type,
          item_value: item.value || 0,
          side: 'A' as unknown as ContractSide,
          participants: [],
        })),
        ...(contractData.sideB?.items || []).map(item => ({
          item_type: item.type as ContractItemType,
          item_id: item.itemId || null,
          description: item.description || item.type,
          item_value: item.value || 0,
          side: 'B' as unknown as ContractSide,
          participants: [],
        })),
      ]

      // Transform payment conditions
      const payment_conditions = paymentConditions.map(pc => ({
        condition_value: pc.value,
        direction: pc.direction === 'Entrada' ? 'entrada' as const : 'saida' as const,
        payment_type: pc.type === 'Único' ? 'unico' as const : 'parcelado' as const,
        installments: pc.type === 'Único' ? 1 : (pc.installments || 1),
        frequency: pc.type === 'Único' ? null : pc.frequency.toLowerCase() as 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual',
        start_date: pc.startDate,
        payment_method: 'Transferência',
        notes: null,
      }))

      const result = await createContract({
        contract_date: contractData.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        status: activate ? 'ativo' : 'rascunho',
        notes: contractData.notes || undefined,
        parties,
        items,
        payment_conditions,
      })

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar contrato')
      }

      // Se o contrato foi ativado, criar as movimentações financeiras
      if (activate && result.contract?.id) {
        await createFinancialMovements(result.contract.id, contractData.code || 'CT-0000')
      }

      toast({
        title: "Contrato salvo com sucesso",
        description: activate ? "O contrato foi ativado e as movimentações financeiras foram criadas" : "O contrato foi salvo como rascunho",
      })

      router.push('/contratos')
    } catch (error) {
      console.error('Error saving contract:', error)
      toast({
        title: "Erro ao salvar contrato",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddParty = () => {
    setAddPartyModalOpen(true)
  }

  const handlePartyAdded = (party: any) => {
    setContractData((prev) => {
      const sideKey = selectedSide === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || {
        name: selectedSide === "A" ? "Lado A – GRA e Outros" : "Lado B – Terceiros",
        parties: [],
        items: [],
        totalValue: 0,
      }

      return {
        ...prev,
        [sideKey]: {
          ...currentSide,
          parties: [...currentSide.parties, party],
        },
      }
    })
  }

  const handleSelectParty = (party: any) => {
    const partyData = {
      ...party,
      id: Date.now().toString(),
      percentage: 0,
    }

    setContractData((prev) => {
      const sideKey = selectedSide === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || {
        name: selectedSide === "A" ? "Lado A – GRA e Outros" : "Lado B – Terceiros",
        parties: [],
        items: [],
        totalValue: 0,
      }

      return {
        ...prev,
        [sideKey]: {
          ...currentSide,
          parties: [...currentSide.parties, partyData],
        },
      }
    })
  }

  const handleRemoveParty = (partyId: string, side: "A" | "B") => {
    setContractData((prev) => {
      const sideKey = side === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || {
        name: side === "A" ? "Lado A – GRA e Outros" : "Lado B – Terceiros",
        parties: [],
        items: [],
        totalValue: 0,
      }

      return {
        ...prev,
        [sideKey]: {
          ...currentSide,
          parties: currentSide.parties.filter((party) => party.id !== partyId),
        },
      }
    })
  }

  const handleAddItem = (side: "A" | "B") => {
    setSelectedSide(side)
    setAddItemModalOpen(true)
  }

  const handleItemAdded = (item: any) => {
    const newItem = { ...item, id: Date.now().toString() }
    setContractData((prev) => {
      const sideKey = selectedSide === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || { name: `Lado ${selectedSide}`, parties: [], items: [], totalValue: 0 }
      const updatedItems = [...currentSide.items, newItem]
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.value || 0), 0)

      return {
        ...prev,
        [sideKey]: {
          ...currentSide,
          items: updatedItems,
          totalValue: newTotal,
        },
      }
    })
  }

  const handleRemoveItem = (side: "A" | "B", itemId: string) => {
    setContractData((prev) => {
      const sideKey = side === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || { name: `Lado ${side}`, parties: [], items: [], totalValue: 0 }
      const updatedItems = currentSide.items.filter((item) => item.id !== itemId)
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.value || 0), 0)

      return {
        ...prev,
        [sideKey]: {
          ...currentSide,
          items: updatedItems,
          totalValue: newTotal,
        },
      }
    })
  }

  const addPaymentCondition = (direction: "Entrada" | "Saída") => {
    const newCondition: PaymentCondition = {
      id: Date.now().toString(),
      value: 0,
      type: "Único",
      frequency: "Mensal",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      installments: 1,
      installmentValue: 0,
      direction,
    }
    setPaymentConditions((prev) => [...prev, newCondition])
  }

  const calculateInstallments = (startDate: string, endDate: string, frequency: string): number => {
    if (!startDate || !endDate) return 1
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end <= start) return 1
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    switch (frequency) {
      case "Semanal":
        return Math.ceil(diffDays / 7)
      case "Mensal":
        return Math.ceil(diffDays / 30)
      case "Trimestral":
        return Math.ceil(diffDays / 90)
      case "Semestral":
        return Math.ceil(diffDays / 180)
      case "Anual":
        return Math.ceil(diffDays / 365)
      default:
        return 1
    }
  }

  const updatePaymentWithCalculations = (id: string, updates: Partial<PaymentCondition>) => {
    setPaymentConditions((prev) =>
      prev.map((condition) => {
        if (condition.id !== id) return condition
        
        const updated = { ...condition, ...updates }
        
        if (updated.type === "Parcelado" && updated.startDate && updated.endDate && updated.value > 0) {
          const installments = calculateInstallments(updated.startDate, updated.endDate, updated.frequency)
          updated.installments = installments
          updated.installmentValue = updated.value / installments
        } else {
          updated.installments = 1
          updated.installmentValue = updated.value
        }
        
        return updated
      })
    )
  }

  const updatePaymentCondition = (id: string, updates: Partial<PaymentCondition>) => {
    updatePaymentWithCalculations(id, updates)
  }

  const removePaymentCondition = (id: string) => {
    setPaymentConditions((prev) => prev.filter((condition) => condition.id !== id))
  }

  const getTotalPaymentValue = () => {
    return paymentConditions.reduce((sum, condition) => sum + condition.value, 0)
  }

  const getTotalPaymentEntrada = () => {
    return paymentConditions
      .filter((condition) => condition.direction === "Entrada")
      .reduce((sum, condition) => sum + condition.value, 0)
  }

  const getTotalPaymentSaida = () => {
    return paymentConditions
      .filter((condition) => condition.direction === "Saída")
      .reduce((sum, condition) => sum + condition.value, 0)
  }

  const getPaymentBalanceDifference = () => {
    // Diferença = Valor dos itens que saem - Total de pagamentos
    const saidaItens = contractData.sideB?.totalValue || 0
    const totalPagamentos = getTotalPaymentValue()
    return saidaItens - totalPagamentos
  }

  const getPaymentBalance = () => {
    const contractTotal = Math.abs(contractData.balance || 0)
    return contractTotal - getTotalPaymentValue()
  }

  React.useEffect(() => {
    calculateBalance()
  }, [calculateBalance])

  const renderMetadataStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Metadados do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" value={contractData.code} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Gerado automaticamente</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data do Contrato</Label>
            <Input
              id="date"
              type="date"
              value={contractData.date ? contractData.date.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setContractData((prev) => ({
                  ...prev,
                  date: new Date(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Observações adicionais sobre o contrato..."
            value={contractData.notes}
            onChange={(e) => setContractData((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderPartiesStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Participação GRA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="gra-percentage">GRA% - Participação da GRA no negócio</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gra-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={graPercentage}
                onChange={(e) => setGraPercentage(e.target.value)}
                placeholder="0.00"
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lado A - Partes
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Parte
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Buscar Existente</div>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("A")
                      setSearchPersonModalOpen(true)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Buscar Pessoa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("A")
                      setSearchCompanyModalOpen(true)
                    }}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Buscar Empresa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Criar Novo</div>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("A")
                      setCreatePersonModalOpen(true)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Nova Pessoa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("A")
                      setCreateCompanyModalOpen(true)
                    }}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractData.sideA?.parties && contractData.sideA.parties.length > 0 ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  {contractData.sideA.parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              party.type === "pessoa"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {party.type === "pessoa" ? (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Pessoa
                              </>
                            ) : (
                              <>
                                <Building className="h-3 w-3 mr-1" />
                                Empresa
                              </>
                            )}
                          </Badge>
                          <span className="text-sm font-medium">{party.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{party.document}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{party.email || 'Sem email'}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveParty(party.id, "A")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-medium">
                  Total: {contractData.sideA.parties.length} parte(s)
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma parte no Lado A</p>
                <p className="text-sm">Clique em "Nova Parte" para adicionar</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lado B - Partes
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Parte
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Buscar Existente</div>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("B")
                      setSearchPersonModalOpen(true)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Buscar Pessoa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("B")
                      setSearchCompanyModalOpen(true)
                    }}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Buscar Empresa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Criar Novo</div>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("B")
                      setCreatePersonModalOpen(true)
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Nova Pessoa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedSide("B")
                      setCreateCompanyModalOpen(true)
                    }}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractData.sideB?.parties && contractData.sideB.parties.length > 0 ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  {contractData.sideB.parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              party.type === "pessoa"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {party.type === "pessoa" ? (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Pessoa
                              </>
                            ) : (
                              <>
                                <Building className="h-3 w-3 mr-1" />
                                Empresa
                              </>
                            )}
                          </Badge>
                          <span className="text-sm font-medium">{party.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{party.document}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{party.email || 'Sem email'}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveParty(party.id, "B")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-medium">
                  Total: {contractData.sideB.parties.length} parte(s)
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma parte no Lado B</p>
                <p className="text-sm">Clique em "Nova Parte" para adicionar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SearchPersonModal
        open={searchPersonModalOpen}
        onOpenChange={setSearchPersonModalOpen}
        onPartyAdded={handlePartyAdded}
        side={selectedSide}
      />

      <SearchCompanyModal
        open={searchCompanyModalOpen}
        onOpenChange={setSearchCompanyModalOpen}
        onPartyAdded={handlePartyAdded}
        side={selectedSide}
      />

      <PersonCreateModal
        open={createPersonModalOpen}
        onOpenChange={setCreatePersonModalOpen}
        onSuccess={() => {
          toast({
            title: "Pessoa criada",
            description: "Agora você pode buscar e adicionar esta pessoa ao contrato",
          })
        }}
      />

      <CompanyCreateModal
        open={createCompanyModalOpen}
        onOpenChange={setCreateCompanyModalOpen}
        onSuccess={() => {
          toast({
            title: "Empresa criada",
            description: "Agora você pode buscar e adicionar esta empresa ao contrato",
          })
        }}
      />
    </div>
  )

  const renderItemsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens que Entram (Lado A)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(contractData.sideA?.totalValue || 0)}
              </p>

              {contractData.sideA?.items && contractData.sideA.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideA.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.itemId || item.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem("A", item.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedSide("A")
                  setSelectItemTypeModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens que Saem (Lado B)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(contractData.sideB?.totalValue || 0)}
              </p>

              {contractData.sideB?.items && contractData.sideB.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideB.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.itemId || item.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem("B", item.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedSide("B")
                  setSelectItemTypeModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Diferença</p>
              <p
                className={`text-2xl font-bold ${Math.abs(contractData.balance || 0) < 0.01 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(contractData.balance || 0)}
              </p>
            </div>
            {Math.abs(contractData.balance || 0) < 0.01 ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {Math.abs(contractData.balance || 0) < 0.01
              ? "Contrato balanceado - pode ser ativado"
              : "Contrato deve estar balanceado para ser ativado"}
          </p>
        </CardContent>
      </Card>

      <SearchItemModal
        open={searchItemModalOpen}
        onOpenChange={setSearchItemModalOpen}
        onItemAdded={handleItemAdded}
        side={selectedSide}
        itemType={selectedItemType}
      />

      <SelectItemTypeModal
        open={selectItemTypeModalOpen}
        onOpenChange={setSelectItemTypeModalOpen}
        onTypeSelected={(type) => {
          setSelectedItemType(type)
          setIncludeItemModalOpen(true)
        }}
        side={selectedSide}
      />

      <IncludeItemModal
        open={includeItemModalOpen}
        onOpenChange={setIncludeItemModalOpen}
        onItemAdded={handleItemAdded}
        side={selectedSide}
        itemType={selectedItemType}
      />

      <CreateItemModal
        open={createItemModalOpen}
        onOpenChange={setCreateItemModalOpen}
        onItemCreated={handleItemAdded}
        side={selectedSide}
        itemType={selectedItemType}
      />
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Condições de Pagamento</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pagamento
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => addPaymentCondition("Entrada")}>Entrada</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addPaymentCondition("Saída")}>Saída</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {paymentConditions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma condição de pagamento adicionada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentConditions.map((condition) => (
            <Card key={condition.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={condition.direction === "Entrada" ? "default" : "secondary"}>
                      {condition.direction}
                    </Badge>
                    <h4 className="font-medium">Pagamento</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePaymentCondition(condition.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Total (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={condition.value}
                        onChange={(e) =>
                          updatePaymentCondition(condition.id, { value: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={condition.type}
                        onValueChange={(value: "Único" | "Parcelado") =>
                          updatePaymentCondition(condition.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Único">Único</SelectItem>
                          <SelectItem value="Parcelado">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={condition.frequency}
                        onValueChange={(value: PaymentCondition["frequency"]) =>
                          updatePaymentCondition(condition.id, { frequency: value })
                        }
                        disabled={condition.type === "Único"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                          <SelectItem value="Trimestral">Trimestral</SelectItem>
                          <SelectItem value="Semestral">Semestral</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={condition.startDate}
                        onChange={(e) => updatePaymentCondition(condition.id, { startDate: e.target.value })}
                      />
                    </div>
                  </div>
                  {condition.type === "Parcelado" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Data Final do Contrato</Label>
                        <Input
                          type="date"
                          value={condition.endDate}
                          onChange={(e) => updatePaymentCondition(condition.id, { endDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número de Parcelas</Label>
                        <Input
                          type="text"
                          value={condition.installments || 1}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor por Parcela (R$)</Label>
                        <Input
                          type="text"
                          value={condition.installmentValue ? condition.installmentValue.toFixed(2) : "0.00"}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Valor do Contrato</p>
              <p className="text-lg font-bold">
                {formatCurrency(Math.abs(contractData.balance || 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pagamentos</p>
              <p className="text-lg font-bold">{formatCurrency(getTotalPaymentValue())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diferença</p>
              <p
                className={`text-lg font-bold ${Math.abs(getPaymentBalance()) < 0.01 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(getPaymentBalance())}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {Math.abs(getPaymentBalance()) < 0.01
                ? "✓ Condições de pagamento balanceadas com o valor do contrato"
                : "⚠ Ajuste as condições para igualar o valor do contrato"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-medium">{contractData.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">{contractData.date ? formatDate(contractData.date) : "-"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Partes Envolvidas ({allParties.length})</h4>
            {allParties.length > 0 ? (
              <div className="space-y-2">
                {allParties.map((party) => (
                  <div key={party.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <Badge variant="outline">{party.type}</Badge>
                    <span>{party.name}</span>
                    <span className="text-sm text-muted-foreground">({party.document})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma parte adicionada</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Itens que Entram (Lado A – GRA e Outros)</h4>
              {contractData.sideA?.items && contractData.sideA.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideA.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.description}</span>
                        </div>
                      </div>
                      <span className="font-medium text-green-700">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="text-right font-bold text-green-700">
                    Total: {formatCurrency(contractData.sideA.totalValue)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Itens que Saem (Lado B – Terceiros)</h4>
              {contractData.sideB?.items && contractData.sideB.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideB.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.description}</span>
                        </div>
                      </div>
                      <span className="font-medium text-red-700">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="text-right font-bold text-red-700">
                    Total: {formatCurrency(contractData.sideB.totalValue)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Pagamentos ({paymentConditions.length})</h4>
            {paymentConditions.length > 0 ? (
              <div className="space-y-2">
                {paymentConditions.map((condition) => (
                  <div key={condition.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={condition.direction === "Entrada" ? "default" : "secondary"}>
                          {condition.direction}
                        </Badge>
                        <span className="font-medium">{condition.type}</span>
                        <span className="text-sm text-muted-foreground">({condition.frequency})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Início: {new Date(condition.startDate).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <span className="font-medium text-blue-700">{formatCurrency(condition.value)}</span>
                  </div>
                ))}
                <div className="text-right font-bold text-blue-700">
                  Total: {formatCurrency(getTotalPaymentValue())}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum pagamento adicionado</p>
            )}
          </div>

          <Separator />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Status de Balanceamento</p>
            <p
              className={`text-xl font-bold ${Math.abs(getPaymentBalanceDifference()) < 0.01 ? "text-green-600" : "text-red-600"}`}
            >
              {Math.abs(getPaymentBalanceDifference()) < 0.01
                ? "✓ Balanceado"
                : `Diferença: ${formatCurrency(getPaymentBalanceDifference())}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Validações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">
                  • {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderMetadataStep()
      case 2:
        return renderPartiesStep()
      case 3:
        return renderItemsStep()
      case 4:
        return renderPaymentStep()
      case 5:
        return renderSummaryStep()
      default:
        return renderMetadataStep()
    }
  }

  const handleIncludeItem = (side: "A" | "B", itemType: string) => {
    setSelectedSide(side)
    setSelectedItemType(itemType)
    setIncludeItemModalOpen(true)
  }

  const handleCreateItem = (side: "A" | "B", itemType: string) => {
    setSelectedSide(side)
    setSelectedItemType(itemType)
    setCreateItemModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.id
                          ? "bg-green-600 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? "✓" : step.id}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${currentStep > step.id ? "bg-green-600" : "bg-muted"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {renderCurrentStep()}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < steps.length ? (
            <Button onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}>Próximo</Button>
          ) : (
            <Button
              onClick={() => handleSave(true)}
              disabled={validationErrors.length > 0 || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {submitting ? 'Salvando...' : 'Finalizar Contrato'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
