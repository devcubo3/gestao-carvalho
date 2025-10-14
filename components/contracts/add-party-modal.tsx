"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { User, Building, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockPeople, mockCompanies } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface AddPartyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded: (party: any) => void
  onPartySelected?: (party: any) => void
  side: "A" | "B"
  mode?: "search" | "create-person" | "create-company"
}

export function AddPartyModal({
  open,
  onOpenChange,
  onPartyAdded,
  onPartySelected,
  side,
  mode = "search",
}: AddPartyModalProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [selectedParty, setSelectedParty] = React.useState<any>(null)
  const [percentage, setPercentage] = React.useState("")
  const [newPersonData, setNewPersonData] = React.useState({
    name: "",
    cpf: "",
    percentage: "",
  })
  const [newCompanyData, setNewCompanyData] = React.useState({
    name: "",
    cnpj: "",
    percentage: "",
  })
  const { toast } = useToast()

  const allParties = [
    ...mockPeople.map((p) => ({ ...p, type: "person" as const })),
    ...mockCompanies.map((c) => ({ ...c, type: "company" as const })),
  ]

  const handleConfirmSelection = () => {
    if (!selectedParty || !percentage) {
      toast({
        title: "Erro",
        description: "Selecione uma parte e defina a participação",
        variant: "destructive",
      })
      return
    }

    const partyData = {
      id: selectedParty.id,
      name: selectedParty.name,
      type: selectedParty.type,
      document: selectedParty.type === "person" ? selectedParty.cpf : selectedParty.cnpj,
      email: selectedParty.email,
      phone: selectedParty.phone,
      percentage: Number.parseFloat(percentage) || 0,
    }

    if (onPartySelected) {
      onPartySelected(partyData)
    } else {
      onPartyAdded(partyData)
    }

    // Reset form
    setSelectedParty(null)
    setPercentage("")
    onOpenChange(false)

    toast({
      title: "Parte adicionada",
      description: `${selectedParty.name} foi adicionado ao ${side === "A" ? "Lado 1" : "Lado 2"}`,
    })
  }

  const handleCreateNewPerson = () => {
    if (!newPersonData.name || !newPersonData.cpf || !newPersonData.percentage) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    const partyData = {
      id: Date.now(),
      name: newPersonData.name,
      type: "person" as const,
      document: newPersonData.cpf,
      email: "",
      phone: "",
      percentage: Number.parseFloat(newPersonData.percentage) || 0,
    }

    onPartyAdded(partyData)
    onOpenChange(false)
    setNewPersonData({ name: "", cpf: "", percentage: "" })
    toast({
      title: "Pessoa criada e incluída",
      description: `${newPersonData.name} foi criada e incluída no ${side === "A" ? "Lado 1" : "Lado 2"}`,
    })
  }

  const handleCreateNewCompany = () => {
    if (!newCompanyData.name || !newCompanyData.cnpj || !newCompanyData.percentage) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    const partyData = {
      id: Date.now(),
      name: newCompanyData.name,
      type: "company" as const,
      document: newCompanyData.cnpj,
      email: "",
      phone: "",
      percentage: Number.parseFloat(newCompanyData.percentage) || 0,
    }

    onPartyAdded(partyData)
    onOpenChange(false)
    setNewCompanyData({ name: "", cnpj: "", percentage: "" })
    toast({
      title: "Empresa criada e incluída",
      description: `${newCompanyData.name} foi criada e incluída no ${side === "A" ? "Lado 1" : "Lado 2"}`,
    })
  }

  // Modal para buscar existente com autocomplete
  if (mode === "search") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar Existente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar pessoa/empresa</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between bg-transparent"
                  >
                    {selectedParty ? (
                      <div className="flex items-center gap-2">
                        {selectedParty.type === "person" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Building className="h-4 w-4" />
                        )}
                        <span>{selectedParty.name}</span>
                      </div>
                    ) : (
                      "Digite para buscar..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Digite o nome, CPF ou CNPJ..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma pessoa ou empresa encontrada.</CommandEmpty>
                      <CommandGroup>
                        {allParties.map((party) => (
                          <CommandItem
                            key={party.id}
                            value={`${party.name} ${party.type === "person" ? party.cpf : party.cnpj}`}
                            onSelect={() => {
                              setSelectedParty(party)
                              setSearchOpen(false)
                            }}
                            className="hover:bg-gray-100 data-[selected]:bg-gray-100"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedParty?.id === party.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex items-center gap-2">
                              {party.type === "person" ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Building className="h-4 w-4" />
                              )}
                              <div>
                                <div className="font-medium">{party.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {party.type === "person" ? party.cpf : party.cnpj}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentagem no contrato (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmSelection}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Modal para criar nova pessoa
  if (mode === "create-person") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Pessoa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="person-name">Nome completo</Label>
              <Input
                id="person-name"
                value={newPersonData.name}
                onChange={(e) => setNewPersonData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-cpf">CPF</Label>
              <Input
                id="person-cpf"
                value={newPersonData.cpf}
                onChange={(e) => setNewPersonData((prev) => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-percentage">Porcentagem no contrato (%)</Label>
              <Input
                id="person-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newPersonData.percentage}
                onChange={(e) => setNewPersonData((prev) => ({ ...prev, percentage: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNewPerson}>Criar e Incluir Pessoa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Modal para criar nova empresa
  if (mode === "create-company") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Empresa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome fantasia</Label>
              <Input
                id="company-name"
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome fantasia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-cnpj">CNPJ</Label>
              <Input
                id="company-cnpj"
                value={newCompanyData.cnpj}
                onChange={(e) => setNewCompanyData((prev) => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-percentage">Porcentagem no contrato (%)</Label>
              <Input
                id="company-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newCompanyData.percentage}
                onChange={(e) => setNewCompanyData((prev) => ({ ...prev, percentage: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNewCompany}>Criar e Incluir Empresa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
