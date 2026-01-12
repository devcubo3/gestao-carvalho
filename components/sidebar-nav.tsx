"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Building2,
  Car,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  MapPin,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  ChevronDown,
  ChevronRight,
  Building,
  User,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: "Início",
    href: "/",
    icon: Home,
  },
  {
    title: "Contratos",
    href: "/contratos",
    icon: FileText,
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    children: [
      {
        title: "Caixa",
        href: "/financeiro/caixa",
        icon: Wallet,
      },
      {
        title: "Contas a Receber",
        href: "/financeiro/contas-receber",
        icon: TrendingUp,
      },
      {
        title: "Contas a Pagar",
        href: "/financeiro/contas-pagar",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Patrimônio",
    icon: Building2,
    children: [
      {
        title: "Imóveis",
        href: "/banco-dados/imoveis",
        icon: MapPin,
      },
      {
        title: "Veículos",
        href: "/banco-dados/veiculos",
        icon: Car,
      },
      {
        title: "Créditos",
        href: "/banco-dados/creditos",
        icon: CreditCard,
      },
      {
        title: "Empreendimentos",
        href: "/banco-dados/empreendimentos",
        icon: Building2,
      },
    ],
  },
  {
    title: "Cadastros",
    icon: Users,
    children: [
      {
        title: "Pessoas",
        href: "/cadastros/pessoas",
        icon: User,
      },
      {
        title: "Empresas",
        href: "/cadastros/empresas",
        icon: Building,
      },
    ],
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
]

const settingsItems: NavItem[] = [
  {
    title: "Configurações",
    icon: Settings,
    children: [
      {
        title: "Usuários",
        href: "/configuracoes/usuarios",
        icon: Users,
      },
      {
        title: "Categorias",
        href: "/configuracoes/categorias",
        icon: Database,
      },
      {
        title: "Minha Conta",
        href: "/configuracoes/minha-conta",
        icon: User,
      },
    ],
  },
]

interface SidebarNavProps {
  isCollapsed?: boolean
}

export function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<string[]>([])

  React.useEffect(() => {
    const currentAccordion = navItems.find((item) =>
      item.children?.some((child) => {
        if (!child.href) return false
        return pathname === child.href || pathname.startsWith(child.href + "/")
      }),
    )

    if (currentAccordion && !openItems.includes(currentAccordion.title)) {
      setOpenItems((prev) => {
        const otherAccordeons = navItems
          .filter((item) => item.children && item.title !== currentAccordion.title)
          .map((item) => item.title)
        return [currentAccordion.title, ...prev.filter((item) => !otherAccordeons.includes(item))]
      })
    }
  }, [pathname])

  const toggleItem = (title: string) => {
    setOpenItems((prev) => {
      if (prev.includes(title)) {
        return prev.filter((item) => item !== title)
      } else {
        const otherAccordeons = navItems
          .filter((item) => item.children && item.title !== title)
          .map((item) => item.title)
        return [title, ...prev.filter((item) => !otherAccordeons.includes(item))]
      }
    })
  }

  const renderNavItem = (item: NavItem, level = 0, parentTitle?: string) => {
    const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems.includes(item.title)

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-auto font-medium text-primary-foreground/90 hover:bg-white/20 hover:text-primary-foreground cursor-pointer",
                isCollapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.title}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 ml-auto shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto shrink-0" />
                  )}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          {!isCollapsed && (
            <CollapsibleContent className="space-y-1">
              {item.children?.map((child) => renderNavItem(child, level + 1, item.title))}
            </CollapsibleContent>
          )}
        </Collapsible>
      )
    }

    return (
      <Button
        key={item.title}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 py-2 h-auto font-medium cursor-pointer",
          level > 0 ? "pl-6 pr-3" : "px-3",
          isCollapsed && "justify-center px-2",
          isActive
            ? "bg-accent text-primary hover:bg-accent/80"
            : "text-primary-foreground/90 hover:bg-white/20 hover:text-primary-foreground",
        )}
        asChild
      >
        <Link href={item.href || "#"}>
          {level === 0 && <item.icon className="h-4 w-4 shrink-0" />}
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 border-primary-foreground/20 border-b-0 items-center justify-start px-3">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex-shrink-0">
            <Image src="/logo.svg" alt="GRA Empreendimentos" width={32} height={32} className="w-8 h-8" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-primary-foreground">Gestão Patrimônial</h1>
              <p className="text-xs text-primary-foreground/80">GRA Empreendimentos</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2 px-0 py-0">{navItems.map((item) => renderNavItem(item))}</nav>

      <div className="p-2 px-0 py-0">
        {settingsItems.map((item) =>
          item.children ? (
            <Collapsible
              key={item.title}
              open={openItems.includes(item.title)}
              onOpenChange={() => toggleItem(item.title)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2 h-auto font-medium text-primary-foreground/90 hover:bg-white/20 hover:text-primary-foreground cursor-pointer",
                    isCollapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{item.title}</span>
                      {openItems.includes(item.title) ? (
                        <ChevronDown className="h-4 w-4 ml-auto shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto shrink-0" />
                      )}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="space-y-1">
                  {item.children?.map((child) => renderNavItem(child, 0, item.title))}
                </CollapsibleContent>
              )}
            </Collapsible>
          ) : (
            renderNavItem(item)
          ),
        )}
      </div>
    </div>
  )
}
