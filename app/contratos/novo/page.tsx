import { MainLayout } from "@/components/main-layout"
import { ContractForm } from "@/components/contracts/contract-form"

export default function NewContractPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Contratos", href: "/contratos" }, { label: "Novo Contrato" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Contrato</h1>
          <p className="text-muted-foreground">Crie um novo contrato balanceado entre as partes</p>
        </div>

        <ContractForm />
      </div>
    </MainLayout>
  )
}
