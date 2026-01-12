"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Car, CreditCard, Building2, ArrowRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import type { RecentAddition } from "@/lib/types"

const typeConfig = {
  imovel: {
    label: "Imóvel",
    icon: MapPin,
    href: "/banco-dados/imoveis",
  },
  veiculo: {
    label: "Veículo",
    icon: Car,
    href: "/banco-dados/veiculos",
  },
  credito: {
    label: "Crédito",
    icon: CreditCard,
    href: "/banco-dados/creditos",
  },
  empreendimento: {
    label: "Empreendimento",
    icon: Building2,
    href: "/banco-dados/empreendimentos",
  },
}

interface RecentAdditionsProps {
  additions: RecentAddition[]
}

export function RecentAdditions({ additions }: RecentAdditionsProps) {
  if (additions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma adição recente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre imóveis, veículos, créditos ou empreendimentos
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {additions.map((item) => {
            const config = typeConfig[item.type]
            const Icon = config.icon

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                      {config.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.value)}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={config.href}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/banco-dados">
              Ver banco de dados completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
