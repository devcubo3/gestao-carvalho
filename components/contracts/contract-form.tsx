"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { generateContractCode } from "@/lib/mock-data"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Contract } from "@/lib/types"
import { AddPartyModal } from "./add-party-modal"
import { IncludeItemModal } from "./include-item-modal"
import { CreateItemModal } from "./create-item-modal"
import { SearchCompanyModal } from "./search-company-modal"
import { SearchPersonModal } from "./search-person-modal"
import { SearchItemModal } from "./search-item-modal"

interface PaymentCondition {
  id: string
  value: number
  type: "Único" | "Parcelado"
  frequency: "Semanal" | "Mensal" | "Trimestral" | "Semestral" | "Anual"
  startDate: string
  direction: "Entrada" | "Saída"
}

export function ContractForm() {
  const [contractData, setContractData] = React.useState<Partial<Contract>>({
    code: generateContractCode(Date.now()),
    date: new Date(),
    sideA: {
      name: "Lado 1 – GRA e Outros",
      parties: [],
      items: [],
      totalValue: 0,
    },
    sideB: {
      name: "Lado 2 – Terceiros",
      parties: [],
      items: [],
      totalValue: 0,
    },
    balance: 0,
    notes: "",
  })

  const [graPercentage, setGraPercentage] = React.useState<string>("")
  const [allParties, setAllParties] = React.useState<any[]>([])

  const [paymentConditions, setPaymentConditions] = React.useState<PaymentCondition[]>([
    {
      id: "1",
      value: 150000,
      type: "Parcelado",
      frequency: "Mensal",
      startDate: "2024-02-01",
      direction: "Entrada",
    },
    {
      id: "2",
      value: 50000,
      type: "Único",
      frequency: "Mensal",
      startDate: "2024-01-15",
      direction: "Saída",
    },
  ])

  const [currentStep, setCurrentStep] = React.useState(1)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])

  const [addPartyModalOpen, setAddPartyModalOpen] = React.useState(false)
  const [addItemModalOpen, setAddItemModalOpen] = React.useState(false)
  const [selectedSide, setSelectedSide] = React.useState<"A" | "B">("A")
  const [modalMode, setModalMode] = React.useState<"search" | "create-person" | "create-company">("search")

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
    const totalPercentage = sideAParties.reduce((sum, party) => sum + (party.percentage || 0), 0)
    setGraPercentage(totalPercentage.toFixed(2))

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

    if (Math.abs(contractData.balance || 0) > 0.01) {
      errors.push("Contrato deve estar balanceado (diferença = R$ 0,00)")
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [contractData, allParties])

  const handleSave = (activate = false) => {
    if (activate && !validateContract()) {
      return
    }

    console.log("Saving contract:", contractData)
    // Mock save - in real app would call API
  }

  const handleAddParty = () => {
    setAddPartyModalOpen(true)
  }

  const handlePartyAdded = (party: any) => {
    setContractData((prev) => {
      const sideKey = selectedSide === "A" ? "sideA" : "sideB"
      const currentSide = prev[sideKey] || {
        name: selectedSide === "A" ? "Lado 1 – GRA e Outros" : "Lado 2 – Terceiros",
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
        name: selectedSide === "A" ? "Lado 1 – GRA e Outros" : "Lado 2 – Terceiros",
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
        name: side === "A" ? "Lado 1 – GRA e Outros" : "Lado 2 – Terceiros",
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
      direction,
    }
    setPaymentConditions((prev) => [...prev, newCondition])
  }

  const updatePaymentCondition = (id: string, updates: Partial<PaymentCondition>) => {
    setPaymentConditions((prev) =>
      prev.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)),
    )
  }

  const removePaymentCondition = (id: string) => {
    setPaymentConditions((prev) => prev.filter((condition) => condition.id !== id))
  }

  const getTotalPaymentValue = () => {
    return paymentConditions.reduce((sum, condition) => sum + condition.value, 0)
  }

  const getPaymentBalance = () => {
    const contractTotal = Math.abs(contractData.balance || 0) < 0.01 ? contractData.sideA?.totalValue || 0 : 0
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
          <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{graPercentage || "0.00"}%</p>
              <p className="text-sm text-muted-foreground mt-1">Participação da GRA</p>
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
                Lado 1 – GRA
              </CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Incluir
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setModalMode("create-person")
                        setAddPartyModalOpen(true)
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Criar Pessoa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setModalMode("create-company")
                        setAddPartyModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Criar Empresa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractData.sideA?.parties && contractData.sideA.parties.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Partes do Lado 1 ({contractData.sideA.parties.length})</h4>
                <div className="space-y-2">
                  {contractData.sideA.parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              party.type === "person"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {party.type === "person" ? (
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
                        <div className="text-xs text-muted-foreground">{party.percentage}% de participação</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{party.percentage}%</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveParty(party.id, "A")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-medium">
                  Total: {contractData.sideA.parties.reduce((sum, party) => sum + (party.percentage || 0), 0)}%
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma parte no Lado 1</p>
                <p className="text-sm">Clique em "Incluir" para adicionar</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lado 2 – Terceiros
              </CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Incluir
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setModalMode("create-person")
                        setAddPartyModalOpen(true)
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Criar Pessoa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setModalMode("create-company")
                        setAddPartyModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Criar Empresa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractData.sideB?.parties && contractData.sideB.parties.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Partes do Lado 2 ({contractData.sideB.parties.length})</h4>
                <div className="space-y-2">
                  {contractData.sideB.parties.map((party) => (
                    <div key={party.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              party.type === "person"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {party.type === "person" ? (
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
                        <div className="text-xs text-muted-foreground">{party.percentage}% de participação</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{party.percentage}%</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveParty(party.id, "B")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-medium">
                  Total: {contractData.sideB.parties.reduce((sum, party) => sum + (party.percentage || 0), 0)}%
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma parte no Lado 2</p>
                <p className="text-sm">Clique em "Incluir" para adicionar</p>
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

      <AddPartyModal
        open={addPartyModalOpen}
        onOpenChange={setAddPartyModalOpen}
        onPartyAdded={handlePartyAdded}
        onPartySelected={handleSelectParty}
        side={selectedSide}
        mode={modalMode}
      />
    </div>
  )

  const renderItemsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Entradas
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Incluir
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Imóveis")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Imóveis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Veículos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Veículos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Créditos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Créditos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Empreendimentos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Empreendimentos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Imóveis")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Criar Imóvel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Veículos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Criar Veículo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Créditos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Criar Crédito
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("A")
                        setSelectedItemType("Empreendimentos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Criar Empreendimento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(contractData.sideA?.totalValue || 0)}
              </p>

              {contractData.sideA?.items && contractData.sideA.items.length > 0 && (
                <div className="space-y-2">
                  {contractData.sideA.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.code}</div>
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
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Saídas
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Incluir
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Imóveis")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Imóveis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Veículos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Veículos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Créditos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Créditos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Empreendimentos")
                        setSearchItemModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Empreendimentos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Imóveis")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Criar Imóvel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Veículos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Criar Veículo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Créditos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Criar Crédito
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSide("B")
                        setSelectedItemType("Empreendimentos")
                        setCreateItemModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Criar Empreendimento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(contractData.sideB?.totalValue || 0)}
              </p>

              {contractData.sideB?.items && contractData.sideB.items.length > 0 && (
                <div className="space-y-2">
                  {contractData.sideB.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.code}</div>
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
              )}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pagamentos
            {paymentConditions.length > 0 && (
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
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentConditions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum pagamento adicionado até o momento</p>
              <p className="text-sm mb-6">
                Adicione entradas e saídas para definir as condições financeiras do contrato
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pagamento
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={() => addPaymentCondition("Entrada")}>Entrada</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addPaymentCondition("Saída")}>Saída</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentConditions.map((condition) => (
                <Card key={condition.id} className="border-2">
                  <CardContent className="pt-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Valor do Contrato</p>
              <p className="text-lg font-bold">
                {formatCurrency(Math.abs(contractData.balance || 0) < 0.01 ? contractData.sideA?.totalValue || 0 : 0)}
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
              <h4 className="font-medium mb-3">Itens que Entram (Lado 1 – GRA e Outros)</h4>
              {contractData.sideA?.items && contractData.sideA.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideA.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.name}</span>
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
              <h4 className="font-medium mb-3">Itens que Saem (Lado 2 – Terceiros)</h4>
              {contractData.sideB?.items && contractData.sideB.items.length > 0 ? (
                <div className="space-y-2">
                  {contractData.sideB.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm font-medium">{item.name}</span>
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
              className={`text-xl font-bold ${Math.abs(contractData.balance || 0) < 0.01 ? "text-green-600" : "text-red-600"}`}
            >
              {Math.abs(contractData.balance || 0) < 0.01
                ? "✓ Balanceado"
                : `Diferença: ${formatCurrency(contractData.balance || 0)}`}
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
              disabled={validationErrors.length > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Contrato
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
