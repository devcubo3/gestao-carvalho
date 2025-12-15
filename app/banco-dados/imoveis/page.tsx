import { MainLayout } from "@/components/main-layout"
import { PropertiesTable } from "@/components/database/properties-table"
import { getProperties } from "@/app/actions/properties"

export default async function PropertiesPage() {
  const result = await getProperties()
  const properties = result.success && result.data ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Imóveis" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Imóveis</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de imóveis do patrimônio</p>
          </div>
        </div>

        <PropertiesTable properties={properties} />
      </div>
    </MainLayout>
  )
}
