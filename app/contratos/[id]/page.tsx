import { MainLayout } from "@/components/main-layout"
import { ContractDetailsClient } from "@/components/contracts/contract-details-client"
import { getContractById } from "@/app/actions/contracts"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

interface ContractPageProps {
  params: {
    id: string
  }
}

export default async function ContractPage({ params }: ContractPageProps) {
  let contract
  let errorMessage = ""
  let isAdmin = false
  
  // Verificar se o usuário é admin
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
    // Se houver erro, assume que não é admin
    isAdmin = false
  }
  
  try {
    contract = await getContractById(params.id)
  } catch (error: any) {
    if (error.message?.includes('administradores')) {
      errorMessage = "permission"
    } else {
      errorMessage = "not_found"
    }
  }

  if (errorMessage === "permission") {
    return (
      <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: "Acesso Negado" }]}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <FileText className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Apenas administradores podem visualizar detalhes de contratos.</p>
          <Link href="/contratos">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Contratos
            </Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  if (!contract) {
    return (
      <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: "Contrato não encontrado" }]}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Contrato não encontrado</h2>
          <p className="text-muted-foreground">O contrato solicitado não existe ou foi removido.</p>
          <Link href="/contratos">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Contratos
            </Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: contract.code }]}>
      <ContractDetailsClient contract={contract} isAdmin={isAdmin} />
    </MainLayout>
  )
}
