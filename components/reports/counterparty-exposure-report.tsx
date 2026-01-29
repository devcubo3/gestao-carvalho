"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { CounterpartyExposureReport } from "@/lib/types"
import { Users, TrendingUp, TrendingDown, AlertCircle, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CounterpartyExposureReportProps {
  data: CounterpartyExposureReport
  reportId: string
}

interface Person {
  id: string
  full_name: string
}

export function CounterpartyExposureReportView({ data, reportId }: CounterpartyExposureReportProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<string>(searchParams.get('personId') || 'all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Buscar lista de pessoas
    async function fetchPeople() {
      try {
        const response = await fetch('/api/people/list')
        const data = await response.json()
        setPeople(data)
      } catch (error) {
        console.error('Erro ao buscar pessoas:', error)
      }
    }
    fetchPeople()
  }, [])

  const handleFilterApply = () => {
    setLoading(true)
    const params = new URLSearchParams()
    
    if (selectedPerson !== 'all') {
      params.set('personId', selectedPerson)
    }
    
    const url = params.toString() 
      ? `/relatorios/${reportId}?${params.toString()}`
      : `/relatorios/${reportId}`
    
    router.push(url)
  }

  const handleClearFilter = () => {
    setSelectedPerson('all')
    router.push(`/relatorios/${reportId}`)
  }

  const selectedPersonName = selectedPerson !== 'all' 
    ? people.find(p => p.id === selectedPerson)?.full_name 
    : null

  return (
    <div className="space-y-6">
      {/* Indicador de Pessoa Filtrada - Visível em PDF */}
      {selectedPersonName && (
        <Card className="print:block">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Contas vinculadas à pessoa:</p>
                <p className="text-lg font-semibold">{selectedPersonName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro por Pessoa */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Filtrar por Pessoa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="person-select">Pessoa</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger id="person-select">
                  <SelectValue placeholder="Todas as pessoas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pessoas</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFilterApply} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtro
            </Button>
            {selectedPerson !== 'all' && (
              <Button variant="outline" onClick={handleClearFilter}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.summary.totalReceivables)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(data.summary.totalPayables)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contas a Receber */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contas a Receber por Contraparte
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.receivables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conta a receber encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {data.receivables.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(item.totalReceivable || 0)}
                    </p>
                    {item.overdueReceivable && Number(item.overdueReceivable) > 0 && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <p className="text-sm text-red-500">
                          {formatCurrency(item.overdueReceivable)} vencido
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contas a Pagar por Vínculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.payables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conta a pagar encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {data.payables.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(item.totalPayable || 0)}
                    </p>
                    {item.overduePayable && Number(item.overduePayable) > 0 && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <p className="text-sm text-red-500">
                          {formatCurrency(item.overduePayable)} vencido
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
