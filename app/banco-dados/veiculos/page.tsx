import { MainLayout } from "@/components/main-layout"
import { VehiclesTable } from "@/components/database/vehicles-table"
import { mockVehicles } from "@/lib/mock-data"

export default function VehiclesPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados" }, { label: "Veículos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
            <p className="text-muted-foreground">Gerencie o cadastro de veículos do patrimônio</p>
          </div>
        </div>

        <VehiclesTable vehicles={mockVehicles} />
      </div>
    </MainLayout>
  )
}
