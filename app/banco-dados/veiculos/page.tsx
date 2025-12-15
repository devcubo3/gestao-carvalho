import { MainLayout } from "@/components/main-layout"
import { VehiclesTable } from "@/components/database/vehicles-table"
import { getVehicles } from "@/app/actions/vehicles"

export default async function VehiclesPage() {
  const result = await getVehicles()
  const vehicles = result.success && result.data ? result.data : []

  return (
    <MainLayout breadcrumbs={[{ label: "Patrimônio" }, { label: "Veículos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de veículos do patrimônio</p>
          </div>
        </div>

        <VehiclesTable vehicles={vehicles} />
      </div>
    </MainLayout>
  )
}
