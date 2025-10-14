"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { User, X } from "lucide-react"
import { mockPeople } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface SearchPersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded: (party: any) => void
  side: "A" | "B"
}

export function SearchPersonModal({ open, onOpenChange, onPartyAdded, side }: SearchPersonModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedPerson, setSelectedPerson] = React.useState<any>(null)
  const [percentage, setPercentage] = React.useState("")
  const { toast } = useToast()

  const filteredPeople = mockPeople.filter(
    (person) => person.name.toLowerCase().includes(searchTerm.toLowerCase()) || person.cpf.includes(searchTerm),
  )

  const handleSelectPerson = (person: any) => {
    setSelectedPerson(person)
  }

  const handleRemoveSelection = () => {
    setSelectedPerson(null)
  }

  const handleConfirm = () => {
    if (!selectedPerson || !percentage) {
      toast({
        title: "Erro",
        description: "Selecione uma pessoa e defina a participação",
        variant: "destructive",
      })
      return
    }

    const partyData = {
      id: selectedPerson.id,
      name: selectedPerson.name,
      type: "person" as const,
      document: selectedPerson.cpf,
      email: selectedPerson.email,
      phone: selectedPerson.phone,
      percentage: Number.parseFloat(percentage) || 0,
    }

    onPartyAdded(partyData)

    // Reset form
    setSearchTerm("")
    setSelectedPerson(null)
    setPercentage("")
    onOpenChange(false)

    toast({
      title: "Pessoa adicionada",
      description: `${selectedPerson.name} foi adicionado ao ${side === "A" ? "Lado 1" : "Lado 2"}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Pessoa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Buscar pessoa</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CPF..."
              disabled={!!selectedPerson}
            />
          </div>

          {selectedPerson ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900 text-sm">{selectedPerson.name}</div>
                      <div className="text-xs text-blue-700">{selectedPerson.cpf}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSelection}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            searchTerm && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredPeople.length > 0 ? (
                  filteredPeople.map((person) => (
                    <Card
                      key={person.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelectPerson(person)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="font-medium text-sm">{person.name}</div>
                            <div className="text-xs text-gray-500">{person.cpf}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">Nenhuma pessoa encontrada</div>
                )}
              </div>
            )
          )}

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
            <Button onClick={handleConfirm}>Confirmar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
