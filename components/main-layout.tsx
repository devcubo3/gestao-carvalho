"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { SidebarNav } from "./sidebar-nav"
import { TopBar } from "./top-bar"

interface MainLayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
}

export function MainLayout({ children, breadcrumbs }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-primary transition-all duration-300 px-2 py-2",
          sidebarCollapsed ? "w-16" : "w-64",
          "md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav isCollapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main content */}
      <div className={cn("flex flex-col transition-all duration-300", sidebarCollapsed ? "md:ml-16" : "md:ml-64")}>
        <TopBar onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)} breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
