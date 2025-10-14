"use client"
import { useState, useMemo } from "react"
import { MainLayout } from "@/components/main-layout"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { ContractsFilters, type ContractFilters } from "@/components/contracts/contracts-filters"
import { mockContracts } from "@/lib/mock-data"
import type { Contract } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ContractsPage() {
  const [filters, setFilters] = useState<ContractFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<ContractFilters>({})
  const router = useRouter()

  const filteredContracts = useMemo(() => {
    return mockContracts.filter((contract: Contract) => {
      // Date range filter
      if (appliedFilters.dateFrom && new Date(contract.date) < appliedFilters.dateFrom) return false
      if (appliedFilters.dateTo && new Date(contract.date) > appliedFilters.dateTo) return false

      // Code filter
      if (appliedFilters.code && !contract.code.toLowerCase().includes(appliedFilters.code.toLowerCase())) return false

      // Currency filter
      if (
        appliedFilters.currency &&
        !contract.sideA.currency.toLowerCase().includes(appliedFilters.currency.toLowerCase())
      )
        return false

      // Person filter (search in both sides)
      if (appliedFilters.person) {
        const personLower = appliedFilters.person.toLowerCase()
        const hasPersonInSideA = contract.sideA.parties.some(
          (party) =>
            party.name.toLowerCase().includes(personLower) ||
            (party.document && party.document.toLowerCase().includes(personLower)),
        )
        const hasPersonInSideB = contract.sideB.parties.some(
          (party) =>
            party.name.toLowerCase().includes(personLower) ||
            (party.document && party.document.toLowerCase().includes(personLower)),
        )
        if (!hasPersonInSideA && !hasPersonInSideB) return false
      }

      // Company filter (search in both sides)
      if (appliedFilters.company) {
        const companyLower = appliedFilters.company.toLowerCase()
        const hasCompanyInSideA = contract.sideA.parties.some(
          (party) =>
            party.name.toLowerCase().includes(companyLower) ||
            (party.document && party.document.toLowerCase().includes(companyLower)),
        )
        const hasCompanyInSideB = contract.sideB.parties.some(
          (party) =>
            party.name.toLowerCase().includes(companyLower) ||
            (party.document && party.document.toLowerCase().includes(companyLower)),
        )
        if (!hasCompanyInSideA && !hasCompanyInSideB) return false
      }

      // Value range filter
      if (appliedFilters.valueMin && contract.sideA.totalValue < appliedFilters.valueMin) return false
      if (appliedFilters.valueMax && contract.sideA.totalValue > appliedFilters.valueMax) return false

      return true
    })
  }, [appliedFilters])

  const handleClearFilters = () => {
    setFilters({})
    setAppliedFilters({})
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  return (
    <MainLayout breadcrumbs={[{ label: "Contratos" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
            <p className="text-muted-foreground">Gerencie todos os contratos do sistema</p>
          </div>
          <Button onClick={() => router.push("/contratos/novo")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        <ContractsFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />

        <ContractsTable contracts={filteredContracts} />
      </div>
    </MainLayout>
  )
}
