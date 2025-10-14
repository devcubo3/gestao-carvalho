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
}

export function TopBar({ onToggleSidebar, breadcrumbs = [] }: TopBarProps) {
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

        {/* Global search */}
        <div className="relative w-64 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar contratos, imóveis..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Ações rápidas</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action, index) => (
              <DropdownMenuItem key={index} onClick={action.action}>
                {action.label}
                {action.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">Ctrl+{action.shortcut}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button size="icon" variant="outline">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificações</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">João Silva</p>
                <p className="text-xs leading-none text-muted-foreground">joao.silva@empresa.com.br</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracoes/minha-conta">
                <User className="mr-2 h-4 w-4" />
                <span>Minha Conta</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
