"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { ArrowLeft, Trash2, FileText, Building, Car, Home, CreditCard } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { mockContracts } from "@/lib/mock-data"

interface ContractPageProps {
  params: {
    id: string
  }
}

export default function ContractPage({ params }: ContractPageProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Mock: Find contract by ID
  const contract = mockContracts.find((c) => c.id === params.id)

  if (!contract) {
    return (
      <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: "Contrato não encontrado" }]}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Contrato não encontrado</h2>
          <p className="text-muted-foreground">O contrato solicitado não existe ou foi removido.</p>
          <Button onClick={() => router.push("/contratos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Contratos
          </Button>
        </div>
      </MainLayout>
    )
  }

  const handleDeleteContract = () => {
    if (deleteConfirmation.toLowerCase() === "excluir") {
      // Mock: Delete contract logic would go here
      console.log("Deleting contract:", contract.id)
      setShowDeleteDialog(false)
      router.push("/contratos")
    }
  }

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "imóvel":
        return <Home className="h-4 w-4" />
      case "veículo":
        return <Car className="h-4 w-4" />
      case "empreendimento":
        return <Building className="h-4 w-4" />
      case "crédito":
        return <CreditCard className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Mock data for payments and receivables
  const mockPayments = [
    { id: "1", value: 50000, dueDate: new Date("2024-02-15"), status: "Pago" },
    { id: "2", value: 50000, dueDate: new Date("2024-03-15"), status: "Pendente" },
  ]

  const mockReceivables = [
    { id: "1", value: 25000, dueDate: new Date("2024-02-10"), status: "Pago" },
    { id: "2", value: 25000, dueDate: new Date("2024-03-10"), status: "Pendente" },
  ]

  return (
    <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: contract.code }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Contrato {contract.code}</h1>
              <p className="text-muted-foreground">Resumo completo do contrato</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Contrato
          </Button>
        </div>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Código</Label>
              <p className="text-lg font-semibold">{contract.code}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Data de Criação</Label>
              <p className="text-lg">{formatDate(contract.date)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(contract.sideA.totalValue)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Partes Envolvidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lado GRA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Lado GRA e Outros</span>
                <Badge variant="secondary">{contract.sideA.parties.length} parte(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.sideA.parties.map((party, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {party.document} • {party.type}
                    </p>
                  </div>
                  <Badge variant="outline">{party.percentage}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lado Terceiros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Lado Terceiros</span>
                <Badge variant="secondary">{contract.sideB.parties.length} parte(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.sideB.parties.map((party, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {party.document} • {party.type}
                    </p>
                  </div>
                  <Badge variant="outline">{party.percentage}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Entradas e Saídas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Itens que Entraram */}
          <Card>
            <CardHeader>
              <CardTitle>Itens que Entraram</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.sideA.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getItemIcon(item.type)}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.value)}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Itens que Saíram */}
          <Card>
            <CardHeader>
              <CardTitle>Itens que Saíram</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.sideB.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getItemIcon(item.type)}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.value)}</p>
                    <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Acertos de Pagamento */}
        {contract.sideA.paymentAdjustment && (
          <Card>
            <CardHeader>
              <CardTitle>Acertos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div>
                  <p className="font-medium">Valor Combinado</p>
                  <p className="text-sm text-muted-foreground">
                    {contract.sideA.paymentAdjustment.type === "receive" ? "A receber" : "A pagar"}
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(contract.sideA.paymentAdjustment.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lançamentos */}
        {(mockReceivables.length > 0 || mockPayments.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Lançamentos</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contas a Receber */}
              {mockReceivables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Contas a Receber</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockReceivables.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(item.value)}</p>
                          <p className="text-sm text-muted-foreground">Venc: {formatDate(item.dueDate)}</p>
                        </div>
                        <Badge variant={item.status === "Pago" ? "default" : "secondary"}>{item.status}</Badge>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(50000)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Quitado:</span>
                        <span className="font-medium">{formatCurrency(25000)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Pendente:</span>
                        <span className="font-medium">{formatCurrency(25000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contas a Pagar */}
              {mockPayments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Contas a Pagar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockPayments.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(item.value)}</p>
                          <p className="text-sm text-muted-foreground">Venc: {formatDate(item.dueDate)}</p>
                        </div>
                        <Badge variant={item.status === "Pago" ? "default" : "secondary"}>{item.status}</Badge>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(100000)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Quitado:</span>
                        <span className="font-medium">{formatCurrency(50000)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Pendente:</span>
                        <span className="font-medium">{formatCurrency(50000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

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
    </MainLayout>
  )
}
