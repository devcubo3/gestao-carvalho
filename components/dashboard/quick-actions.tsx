"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, MapPin, Car, CreditCard, Building2 } from "lucide-react"

const quickActions = [
  {
    title: "Novo Contrato",
    href: "/contratos/novo",
    icon: FileText,
  },
  {
    title: "Novo Imóvel",
    href: "/banco-dados/imoveis/novo",
    icon: MapPin,
  },
  {
    title: "Novo Veículo",
    href: "/banco-dados/veiculos/novo",
    icon: Car,
  },
  {
    title: "Novo Crédito",
    href: "/banco-dados/creditos/novo",
    icon: CreditCard,
  },
  {
    title: "Novo Empreendimento",
    href: "/banco-dados/empreendimentos/novo",
    icon: Building2,
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {quickActions.map((action) => (
        <Button
          key={action.title}
          asChild
          variant="outline"
          className="h-24 flex-col gap-3 p-4 text-center hover:bg-accent/50 transition-colors bg-transparent"
        >
          <Link href={action.href}>
            <action.icon className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-foreground">{action.title}</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}
