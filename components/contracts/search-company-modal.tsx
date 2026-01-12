"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Building, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Company } from "@/lib/types"

interface SearchCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartyAdded: (party: any) => void
  side: "A" | "B"
}

export function SearchCompanyModal({ open, onOpenChange, onPartyAdded, side }: SearchCompanyModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null)
  const [percentage, setPercentage] = React.useState("")
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    if (open) {
      fetchCompanies()
    }
  }, [open])

  const fetchCompanies = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'ativo')
      .order('trade_name')
    
    if (error) {
      console.error('Erro ao buscar empresas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as empresas",
        variant: "destructive",
      })
    } else {
      setCompanies(data || [])
    }
    setLoading(false)
  }

  const filteredCompanies = companies.filter(
    (company) => company.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) || company.cnpj.includes(searchTerm),
  )

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company)
  }

  const handleRemoveSelection = () => {
    setSelectedCompany(null)
  }

  const handleConfirm = () => {
    if (!selectedCompany) {
      toast({
        title: "Erro",
        description: "Selecione uma empresa",
        variant: "destructive",
      })
      return
    }

    const partyData = {
      id: selectedCompany.id,
      name: selectedCompany.trade_name,
      type: "empresa" as const,
      document: selectedCompany.cnpj,
      email: undefined,
      phone: undefined,
    }

    onPartyAdded(partyData)

    // Reset form
    setSearchTerm("")
    setSelectedCompany(null)
    setPercentage("")
    setCompanies([])
    onOpenChange(false)

    toast({
      title: "Empresa adicionada",
      description: `${selectedCompany.trade_name} foi adicionada ao ${side === "A" ? "Lado A" : "Lado B"}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Buscar empresa</Label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome fantasia ou CNPJ..."
              disabled={!!selectedCompany}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : selectedCompany ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900 text-sm">{selectedCompany.trade_name}</div>
                      <div className="text-xs text-green-700">{selectedCompany.cnpj}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSelection}
                    className="h-6 w-6 p-0 hover:bg-green-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <Card
                    key={company.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelectCompany(company)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium text-sm">{company.trade_name}</div>
                          <div className="text-xs text-gray-500">{company.cnpj}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-2 text-gray-500 text-sm">Nenhuma empresa encontrada</div>
              )}
            </div>
          )}

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
