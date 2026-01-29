"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { DefaultReport } from "@/lib/types"
import { AlertTriangle, TrendingUp, TrendingDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DefaultReportProps {
  data: DefaultReport
  reportId: string
}

interface Person {
  id: string
  full_name: string
}

export function DefaultReportView({ data, reportId }: DefaultReportProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<string>(searchParams.get('personId') || 'all')
  const [loading, setLoading] = useState(false)
  const defaultRateNum = parseFloat(data.summary.defaultRate)

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
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Inadimplência da pessoa:</p>
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
                  <SelectValue placeholder="Todas as pessoas em atraso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pessoas em atraso</SelectItem>
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

      {/* Taxa de Inadimplência */}
      <Card className={defaultRateNum > 10 ? 'border-red-500' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${defaultRateNum > 10 ? 'text-red-500' : 'text-yellow-500'}`} />
            Taxa de Inadimplência
          </CardTitle>
          <CardDescription>
            Percentual de contas a receber em atraso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-5xl font-bold ${
            defaultRateNum > 10 ? 'text-red-600' : defaultRateNum > 5 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {data.summary.defaultRate}%
          </p>
        </CardContent>
      </Card>

      {/* Resumo de Inadimplências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Contas a Receber Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(data.summary.overdueReceivablesValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.summary.overdueReceivablesCount} {data.summary.overdueReceivablesCount === 1 ? 'conta' : 'contas'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Contas a Pagar Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(data.summary.overduePayablesValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.summary.overduePayablesCount} {data.summary.overduePayablesCount === 1 ? 'conta' : 'contas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Período de Atraso */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Período de Atraso</CardTitle>
          <CardDescription>
            Contas a receber agrupadas por dias de atraso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.summary.overdueReceivablesCount === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma conta em atraso
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">0-30 dias</p>
                  <p className="text-sm text-muted-foreground">
                    {data.agingAnalysis['0-30'].count} {data.agingAnalysis['0-30'].count === 1 ? 'conta' : 'contas'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {formatCurrency(data.agingAnalysis['0-30'].value)}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">31-60 dias</p>
                  <p className="text-sm text-muted-foreground">
                    {data.agingAnalysis['31-60'].count} {data.agingAnalysis['31-60'].count === 1 ? 'conta' : 'contas'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {formatCurrency(data.agingAnalysis['31-60'].value)}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-orange-300">
                <div className="flex-1">
                  <p className="font-semibold">61-90 dias</p>
                  <p className="text-sm text-muted-foreground">
                    {data.agingAnalysis['61-90'].count} {data.agingAnalysis['61-90'].count === 1 ? 'conta' : 'contas'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg bg-orange-100">
                  {formatCurrency(data.agingAnalysis['61-90'].value)}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-red-300">
                <div className="flex-1">
                  <p className="font-semibold">Mais de 90 dias</p>
                  <p className="text-sm text-muted-foreground">
                    {data.agingAnalysis['90+'].count} {data.agingAnalysis['90+'].count === 1 ? 'conta' : 'contas'}
                  </p>
                </div>
                <Badge variant="destructive" className="text-lg">
                  {formatCurrency(data.agingAnalysis['90+'].value)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
