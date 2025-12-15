"use client"

import { useState } from "react"
import { ContractsTable } from "./contracts-table"
import { ContractsFilters, type ContractFilters } from "./contracts-filters"
import type { Contract } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ContractsTableClientProps {
  initialContracts: Contract[]
  appliedFilters: any
}

export function ContractsTableClient({ initialContracts, appliedFilters }: ContractsTableClientProps) {
  const [filters, setFilters] = useState<ContractFilters>(appliedFilters || {})
  const router = useRouter()

  const handleClearFilters = () => {
    setFilters({})
    router.push("/contratos")
  }

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    
    if (filters.code) params.set("codigo", filters.code)
    // Status filter can be added when ContractFilters type is updated
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom.toISOString().split('T')[0])
    if (filters.dateTo) params.set("dateTo", filters.dateTo.toISOString().split('T')[0])
    
    router.push(`/contratos?${params.toString()}`)
  }

  return (
    <>
      <ContractsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />
      <ContractsTable contracts={initialContracts} />
    </>
  )
}
