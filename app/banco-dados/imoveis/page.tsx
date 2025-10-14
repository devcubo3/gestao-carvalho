import { MainLayout } from "@/components/main-layout"
import { PropertiesTable } from "@/components/database/properties-table"
import { mockProperties } from "@/lib/mock-data"

export default function PropertiesPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados" }, { label: "Imóveis" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Imóveis</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de imóveis do patrimônio</p>
          </div>
        </div>

        <PropertiesTable properties={mockProperties} />
      </div>
    </MainLayout>
  )
}
