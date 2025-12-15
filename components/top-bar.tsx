"use client"

import React from "react"
import { Search, Plus, Menu, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation" // Importar useRouter para navegação
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopBarProps {
  onToggleSidebar?: () => void
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  hideSearch?: boolean
  hideQuickActions?: boolean
  hideNotifications?: boolean
  hideUserMenu?: boolean
}

export function TopBar({
  onToggleSidebar,
  breadcrumbs = [],
  hideSearch = false,
  hideQuickActions = false,
  hideNotifications = false,
  hideUserMenu = false
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter() // Importar useRouter para navegação

  const quickActions = [
    { label: "Novo Contrato", shortcut: "N", action: () => router.push("/contratos/novo") },
    { label: "Novo Imóvel", action: () => router.push("/patrimonio/imoveis/novo") },
    { label: "Novo Veículo", action: () => router.push("/patrimonio/veiculos/novo") },
    { label: "Lançamento Caixa", action: () => router.push("/financeiro/caixa") },
  ]

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "n" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        quickActions[0].action()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Mobile menu toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Breadcrumbs */}
        <div className="flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </header>
  )
}
