import { MainLayout } from "@/components/main-layout"
import { DevelopmentsTable } from "@/components/database/developments-table"
import { getDevelopments } from "@/app/actions/developments"

export default async function DevelopmentsPage() {
  const developments = await getDevelopments()

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Empreendimentos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empreendimentos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de empreendimentos imobiliários</p>
          </div>
        </div>

        <DevelopmentsTable developments={developments} />
      </div>
    </MainLayout>
  )
}
