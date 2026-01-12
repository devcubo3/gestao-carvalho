"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, Trash2, Building, Car, Home, CreditCard, FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ContractWithDetails } from "@/lib/types"
import { deleteContract, activateContract } from "@/app/actions/contracts"
import { toast } from "@/hooks/use-toast"

interface ContractDetailsClientProps {
  contract: ContractWithDetails
  isAdmin?: boolean
}

export function ContractDetailsClient({ contract, isAdmin = false }: ContractDetailsClientProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isActivating, setIsActivating] = useState(false)

  const handleDeleteContract = async () => {
    if (deleteConfirmation.toLowerCase() === "excluir") {
      const result = await deleteContract(contract.id)
      if (result.success) {
        toast({
          title: "Contrato excluído",
          description: `O contrato ${contract.code} foi excluído com sucesso.`,
        })
        router.push("/contratos")
      } else {
        toast({
          title: "Erro ao excluir",
          description: result.error,
          variant: "destructive",
        })
      }
      setShowDeleteDialog(false)
    }
  }

  const handleActivateContract = async () => {
    setIsActivating(true)
    const result = await activateContract(contract.id)
    setIsActivating(false)
    
    if (result.success) {
      toast({
        title: "Contrato ativado",
        description: `O contrato ${contract.code} foi ativado com sucesso.`,
      })
      router.refresh()
    } else {
      toast({
        title: "Erro ao ativar",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "imovel":
        return <Home className="h-4 w-4" />
      case "veiculo":
        return <Car className="h-4 w-4" />
      case "empreendimento":
        return <Building className="h-4 w-4" />
      case "credito":
        return <CreditCard className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      ativo: { variant: "default", label: "Ativo" },
      concluido: { variant: "outline", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    }
    const config = variants[status] || variants.rascunho
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const sideAParties = contract.parties.filter(p => p.side === ('A' as any))
  const sideBParties = contract.parties.filter(p => p.side === ('B' as any))
  const sideAItems = contract.items.filter(i => i.side === ('A' as any))
  const sideBItems = contract.items.filter(i => i.side === ('B' as any))

  // Calcular balanceamento correto: (Itens Lado A + Pagamentos Entrada) - (Itens Lado B + Pagamentos Saída)
  const totalPaymentEntrada = contract.payment_conditions?.reduce((sum, c) => 
    sum + (c.direction === 'entrada' ? c.condition_value : 0), 0
  ) || 0
  const totalPaymentSaida = contract.payment_conditions?.reduce((sum, c) => 
    sum + (c.direction === 'saida' ? c.condition_value : 0), 0
  ) || 0
  
  const ladoATotal = contract.side_a_total + totalPaymentEntrada
  const ladoBTotal = contract.side_b_total + totalPaymentSaida
  const balanceDifference = ladoATotal - ladoBTotal

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Contrato {contract.code}</h1>
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-muted-foreground">Resumo completo do contrato</p>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'rascunho' && (
            <Button onClick={handleActivateContract} disabled={isActivating}>
              {isActivating ? "Ativando..." : "Ativar Contrato"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Código</Label>
            <p className="text-lg font-semibold">{contract.code}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Data do Contrato</Label>
            <p className="text-lg">{formatDate(new Date(contract.contract_date))}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Lado A</Label>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(contract.side_a_total)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Lado B</Label>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(contract.side_b_total)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Desbalanceamento (se houver) */}
      {Math.abs(balanceDifference) > 0.01 && (
        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-600">Contrato Desbalanceado</p>
                <p className="text-sm text-muted-foreground">
                  O contrato precisa estar balanceado para ser ativado
                </p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                Diferença: {formatCurrency(Math.abs(balanceDifference))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partes Envolvidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado A */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Lado A (GRA e Outros)</span>
              <Badge variant="secondary">{sideAParties.length} parte(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sideAParties.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma parte adicionada</p>
            ) : (
              sideAParties.map((party) => (
                <div key={party.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{party.party_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {party.party_document} • {party.party_type === 'pessoa' ? 'Pessoa' : 'Empresa'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Lado B */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Lado B (Terceiros)</span>
              <Badge variant="secondary">{sideBParties.length} parte(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sideBParties.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma parte adicionada</p>
            ) : (
              sideBParties.map((party) => (
                <div key={party.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{party.party_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {party.party_document} • {party.party_type === 'pessoa' ? 'Pessoa' : 'Empresa'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens Lado A */}
        <Card>
          <CardHeader>
            <CardTitle>Itens Lado A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sideAItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum item adicionado</p>
            ) : (
              sideAItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getItemIcon(item.item_type)}
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.item_type}</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(item.item_value)}</p>
                  </div>
                  {item.participants && item.participants.length > 0 && (
                    <div className="ml-8 pl-4 border-l-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Participantes:</p>
                      {item.participants.map((p: any, idx: number) => (
                        <p key={p.id || idx} className="text-sm">
                          {p.party_name || 'N/A'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Itens Lado B */}
        <Card>
          <CardHeader>
            <CardTitle>Itens Lado B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sideBItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum item adicionado</p>
            ) : (
              sideBItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getItemIcon(item.item_type)}
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.item_type}</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(item.item_value)}</p>
                  </div>
                  {item.participants && item.participants.length > 0 && (
                    <div className="ml-8 pl-4 border-l-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Participantes:</p>
                      {item.participants.map((p: any, idx: number) => (
                        <p key={p.id || idx} className="text-sm">
                          {p.party_name || 'N/A'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Condições de Pagamento */}
      {contract.payment_conditions && contract.payment_conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contract.payment_conditions.map((condition) => (
              <div key={condition.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{formatCurrency(condition.condition_value)}</p>
                  <p className="text-sm text-muted-foreground">
                    {condition.direction === 'entrada' ? 'Entrada' : 'Saída'} • 
                    {condition.payment_type === 'unico' ? ' Único' : ` ${condition.installments}x`}
                    {condition.frequency && ` (${condition.frequency})`}
                  </p>
                  <p className="text-xs text-muted-foreground">Início: {formatDate(new Date(condition.start_date))}</p>
                </div>
                <Badge variant={condition.direction === 'entrada' ? 'default' : 'secondary'}>
                  {condition.direction === 'entrada' ? 'Entrada' : 'Saída'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {contract.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Contrato</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O contrato {contract.code} será permanentemente removido do sistema.
              <br />
              <br />
              Para confirmar, digite <strong>"excluir"</strong> no campo abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">Confirmação</Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Digite 'excluir' para confirmar"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContract}
              disabled={deleteConfirmation.toLowerCase() !== "excluir"}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
