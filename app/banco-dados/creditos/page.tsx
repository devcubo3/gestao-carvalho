import { MainLayout } from "@/components/main-layout"
import { CreditsTable } from "@/components/database/credits-table"
import { getCredits } from "@/app/actions/credits"

export default async function CreditsPage() {
  const result = await getCredits()
  const credits = result.success && result.data ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Créditos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créditos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro das Cartas de Crédito</p>
          </div>
        </div>

        <CreditsTable credits={credits} />
      </div>
    </MainLayout>
  )
}
