"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTable, type TableColumn, type SortDirection } from "@/hooks/use-table"

interface DataTableProps<T> {
  title: string
  data: T[]
  columns: TableColumn<T>[]
  searchFields?: (keyof T)[]
  searchPlaceholder?: string
  loading?: boolean
  emptyIcon?: React.ReactNode
  emptyMessage?: string
  emptyAction?: React.ReactNode
  headerAction?: React.ReactNode
  summary?: React.ReactNode
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ChevronUp className="h-4 w-4" />
  if (direction === "desc") return <ChevronDown className="h-4 w-4" />
  return <div className="h-4 w-4" />
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  searchFields = [],
  searchPlaceholder = "Buscar...",
  loading = false,
  emptyIcon,
  emptyMessage = "Nenhum registro encontrado",
  emptyAction,
  headerAction,
  summary,
}: DataTableProps<T>) {
  const {
    data: tableData,
    totalItems,
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    totalPages,
    pageSize,
    startItem,
    endItem,
    handlePageChange,
    handlePageSizeChange,
  } = useTable({
    data,
    columns,
    searchFields,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchFields.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        )}

        <div className="rounded-md border overflow-visible">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={`
                      h-12 font-semibold
                      ${column.align === "center" ? "text-center" : ""}
                      ${column.align === "right" ? "text-right" : ""}
                      ${column.width || ""}
                      ${column.sortable !== false ? "cursor-pointer hover:bg-muted/80 select-none" : ""}
                    `}
                    onClick={() => column.sortable !== false && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{column.label}</span>
                      {column.sortable !== false && (
                        <SortIcon direction={sortColumn === String(column.key) ? sortDirection : null} />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className="h-12">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tableData.length > 0 ? (
                tableData.map((item, index) => (
                  <TableRow key={item.id || index} className="h-12 hover:bg-muted/50 transition-colors">
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={`
                          h-12 max-w-0 truncate
                          ${column.align === "center" ? "text-center" : ""}
                          ${column.align === "right" ? "text-right" : ""}
                          ${column.width || ""}
                        `}
                        title={column.render ? undefined : String(item[column.key])}
                      >
                        {column.render ? column.render(item) : String(item[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {emptyIcon}
                      <p className="text-muted-foreground">{emptyMessage}</p>
                      {emptyAction}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && tableData.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startItem}–{endItem} de {totalItems}
              </p>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {summary}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
