import { MainLayout } from "@/components/main-layout"
import { ContractsTableClient } from "@/components/contracts/contracts-table-client"
import { getContracts } from "@/app/actions/contracts"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: { status?: string; codigo?: string; dateFrom?: string; dateTo?: string }
}) {
  // Verificar se o usuário é admin
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isAdmin = profile?.role === 'admin'
    }
  } catch (error) {
    isAdmin = false
  }

  // Busca contratos com filtros da URL
  const contracts = await getContracts({
    status: searchParams.status,
    codigo: searchParams.codigo,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
  })

  const appliedFilters = {
    status: searchParams.status,
    code: searchParams.codigo,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
  }

  const filteredContracts = contracts

  return (
    <MainLayout breadcrumbs={[{ label: "Contratos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground">Gerencie todos os contratos do sistema</p>
          </div>
          <Link href="/contratos/novo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </Link>
        </div>

        <ContractsTableClient 
          initialContracts={filteredContracts} 
          appliedFilters={appliedFilters}
          isAdmin={isAdmin}
        />
      </div>
    </MainLayout>
  )
}
