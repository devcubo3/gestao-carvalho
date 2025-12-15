import { MainLayout } from "@/components/main-layout"
import { ContractDetailsClient } from "@/components/contracts/contract-details-client"
import { getContractById } from "@/app/actions/contracts"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface ContractPageProps {
  params: {
    id: string
  }
}

export default async function ContractPage({ params }: ContractPageProps) {
  const contract = await getContractById(params.id)

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
      <ContractDetailsClient contract={contract} />
    </MainLayout>
  )
}
