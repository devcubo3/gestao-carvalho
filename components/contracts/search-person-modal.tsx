"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, X, Loader2, UserCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Person } from "@/lib/types"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

interface CombinedPerson extends Person {
  source: 'people'
}

interface CombinedProfile {
  id: string
  full_name: string
  cpf: string
  email: string | null
  phone: string | null
  mobile_phone: string | null
  source: 'profiles'
  role: string
}

type CombinedResult = CombinedPerson | CombinedProfile

interface SearchPersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded: (party: any) => void
  side: "A" | "B"
}

export function SearchPersonModal({ open, onOpenChange, onPartyAdded, side }: SearchPersonModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedPerson, setSelectedPerson] = React.useState<CombinedResult | null>(null)
  const [percentage, setPercentage] = React.useState("")
  const [results, setResults] = React.useState<CombinedResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      fetchAllPeople()
    }
  }, [open])

  const fetchAllPeople = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Buscar pessoas da tabela people
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .eq('status', 'ativo')
      .order('full_name')
    
    // Buscar usuários da tabela profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')
    
    if (peopleError) {
      console.error('Erro ao buscar pessoas:', peopleError)
    }
    
    if (profilesError) {
      console.error('Erro ao buscar usuários:', profilesError)
    }
    
    if (peopleError && profilesError) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pessoas e usuários",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    
    // Combinar resultados
    const combinedResults: CombinedResult[] = []
    
    // Adicionar pessoas
    if (peopleData) {
      combinedResults.push(...peopleData.map(p => ({ ...p, source: 'people' as const })))
    }
    
    // Adicionar usuários (profiles) que não são pessoas
    if (profilesData) {
      const peopleIds = new Set(peopleData?.map(p => p.id) || [])
      const uniqueProfiles = profilesData.filter(profile => !peopleIds.has(profile.id))
      
      combinedResults.push(...uniqueProfiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Sem nome',
        cpf: '', // Usuários não têm CPF
        email: profile.email,
        phone: null,
        mobile_phone: null,
        source: 'profiles' as const,
        role: profile.role,
      })))
    }
    
    setResults(combinedResults)
    setLoading(false)
  }

  const filteredResults = React.useMemo(() => {
    if (!searchTerm) return results
    
    const searchLower = searchTerm.toLowerCase()
    
    // Primeiro, busca apenas por nome
    const nameMatches = results.filter(item => 
      item.full_name.toLowerCase().includes(searchLower)
    )
    
    // Se encontrou matches no nome, retorna apenas esses
    if (nameMatches.length > 0) {
      return nameMatches
    }
    
    // Se não encontrou no nome, busca em CPF e email
    return results.filter(item =>
      (item.cpf && item.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) ||
      (item.email && item.email.toLowerCase().includes(searchLower))
    )
  }, [results, searchTerm])

  const handleSelectPerson = (person: CombinedResult) => {
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
      name: selectedPerson.full_name,
      type: "person" as const,
      document: selectedPerson.cpf || undefined,
      email: selectedPerson.email || undefined,
      phone: selectedPerson.mobile_phone || selectedPerson.phone || undefined,
      percentage: Number.parseFloat(percentage) || 0,
    }

    onPartyAdded(partyData)

    // Reset form
    setSearchTerm("")
    setSelectedPerson(null)
    setPercentage("")
    setResults([])
    onOpenChange(false)

    toast({
      title: selectedPerson.source === 'profiles' ? "Usuário adicionado" : "Pessoa adicionada",
      description: `${selectedPerson.full_name} foi adicionado ao ${side === "A" ? "Lado A" : "Lado B"}`,
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
            <Label>Buscar pessoa ou usuário</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome, CPF ou email..."
              disabled={!!selectedPerson}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : selectedPerson ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPerson.source === 'profiles' ? (
                      <UserCircle className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-blue-900 text-sm">{selectedPerson.full_name}</div>
                        <Badge variant="secondary" className="text-xs">
                          {selectedPerson.source === 'profiles' ? 'Usuário' : 'Pessoa'}
                        </Badge>
                      </div>
                      {selectedPerson.cpf && (
                        <div className="text-xs text-blue-700">{selectedPerson.cpf}</div>
                      )}
                      {selectedPerson.email && (
                        <div className="text-xs text-blue-700">{selectedPerson.email}</div>
                      )}
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
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelectPerson(item)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        {item.source === 'profiles' ? (
                          <UserCircle className="h-4 w-4 text-purple-600" />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{item.full_name}</div>
                            <Badge variant="secondary" className="text-xs">
                              {item.source === 'profiles' ? 'Usuário' : 'Pessoa'}
                            </Badge>
                          </div>
                          {item.cpf && (
                            <div className="text-xs text-gray-500">{item.cpf}</div>
                          )}
                          {item.email && (
                            <div className="text-xs text-gray-500">{item.email}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-2 text-gray-500 text-sm">Nenhuma pessoa ou usuário encontrado</div>
              )}
            </div>
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
