"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Car, CreditCard, Building2, ArrowRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

// Mock data for recent additions
const recentAdditions = [
  {
    id: "1",
    type: "imovel",
    name: "Casa Residencial - Rua das Flores, 123",
    value: 450000,
    date: new Date("2024-01-20"),
    icon: MapPin,
    href: "/banco-dados/imoveis/1",
  },
  {
    id: "2",
    type: "veiculo",
    name: "Honda Civic 2022 - ABC-1234",
    value: 85000,
    date: new Date("2024-01-19"),
    icon: Car,
    href: "/banco-dados/veiculos/2",
  },
  {
    id: "3",
    type: "credito",
    name: "Crédito Empresarial - João Silva",
    value: 120000,
    date: new Date("2024-01-18"),
    icon: CreditCard,
    href: "/banco-dados/creditos/3",
  },
  {
    id: "4",
    type: "empreendimento",
    name: "Residencial Jardim das Palmeiras",
    value: 2500000,
    date: new Date("2024-01-17"),
    icon: Building2,
    href: "/banco-dados/empreendimentos/4",
  },
  {
    id: "5",
    type: "imovel",
    name: "Apartamento - Ed. Central Plaza",
    value: 320000,
    date: new Date("2024-01-16"),
    icon: MapPin,
    href: "/banco-dados/imoveis/5",
  },
]

const typeLabels = {
  imovel: "Imóvel",
  veiculo: "Veículo",
  credito: "Crédito",
  empreendimento: "Empreendimento",
}

export function RecentAdditions() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentAdditions.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    {typeLabels[item.type as keyof typeof typeLabels]}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.value)}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={item.href}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/banco-dados">
              Ver todas as adições
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
