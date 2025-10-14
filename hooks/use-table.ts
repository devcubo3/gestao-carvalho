"use client"

import type React from "react"

import { useState, useMemo } from "react"

export type SortDirection = "asc" | "desc" | null

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: "left" | "center" | "right"
  width?: string
  render?: (item: T) => React.ReactNode
}

export interface UseTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  searchFields?: (keyof T)[]
  itemsPerPage?: number
}

export function useTable<T extends Record<string, any>>({
  data,
  columns,
  searchFields = [],
  itemsPerPage = 15,
}: UseTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)

  const filteredData = useMemo(() => {
    let filtered = data

    if (searchQuery && searchFields.length > 0) {
      filtered = filtered.filter((item) =>
        searchFields.some((field) => String(item[field]).toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    return filtered
  }, [data, searchQuery, searchFields])

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue === bValue) return 0

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, sortedData.length)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  return {
    // Data
    data: paginatedData,
    totalItems: sortedData.length,

    // Search
    searchQuery,
    setSearchQuery,

    // Sort
    sortColumn,
    sortDirection,
    handleSort,

    // Pagination
    currentPage,
    totalPages,
    pageSize,
    startItem,
    endItem,
    handlePageChange,
    handlePageSizeChange,
  }
}
