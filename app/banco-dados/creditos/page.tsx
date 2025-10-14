import { MainLayout } from "@/components/main-layout"
import { CreditsTable } from "@/components/database/credits-table"
import { mockCredits } from "@/lib/mock-data"

export default function CreditsPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados" }, { label: "Créditos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créditos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro das Cartas de Crédito</p>
          </div>
        </div>

        <CreditsTable credits={mockCredits} />
      </div>
    </MainLayout>
  )
}
