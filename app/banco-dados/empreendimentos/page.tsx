import { MainLayout } from "@/components/main-layout"
import { DevelopmentsTable } from "@/components/database/developments-table"
import { mockDevelopments } from "@/lib/mock-data"

export default function DevelopmentsPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados" }, { label: "Empreendimentos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empreendimentos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de empreendimentos imobiliários</p>
          </div>
        </div>

        <DevelopmentsTable developments={mockDevelopments} />
      </div>
    </MainLayout>
  )
}
