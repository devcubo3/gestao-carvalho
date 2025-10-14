"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { PeopleTable } from "@/components/database/people-table"
import { PersonCreateModal } from "@/components/database/person-create-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function PessoasPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de pessoas físicas do sistema</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pessoa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pessoas</CardTitle>
            <CardDescription>Visualize e gerencie todas as pessoas cadastradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <PeopleTable />
          </CardContent>
        </Card>
      </div>

      <PersonCreateModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </MainLayout>
  )
}
