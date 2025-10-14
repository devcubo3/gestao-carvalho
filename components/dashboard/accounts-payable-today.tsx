import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle } from "lucide-react"
import { mockAccountsPayable } from "@/lib/mock-data"

export function AccountsPayableToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const accountsDueToday = mockAccountsPayable.filter((account) => {
    const dueDate = new Date(account.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  })

  const totalValue = accountsDueToday.reduce((sum, account) => sum + account.value, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Contas a Pagar Hoje</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{accountsDueToday.length}</span>
            <Badge variant={accountsDueToday.length > 0 ? "destructive" : "secondary"}>
              {accountsDueToday.length > 0 ? "Pendente" : "Em dia"}
            </Badge>
          </div>

          {totalValue > 0 && (
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalValue)}
            </div>
          )}

          {accountsDueToday.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>Contas vencendo hoje:</span>
              </div>
              {accountsDueToday.slice(0, 3).map((account) => (
                <div key={account.id} className="text-xs space-y-1">
                  <div className="font-medium truncate">{account.description}</div>
                  <div className="text-muted-foreground">
                    {account.counterparty} •{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(account.value)}
                  </div>
                </div>
              ))}
              {accountsDueToday.length > 3 && (
                <div className="text-xs text-muted-foreground">+{accountsDueToday.length - 3} mais</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
