'use client'

import { useState, useEffect } from 'react'
import { getCategories } from '@/app/actions/categories'
import type { Category } from '@/lib/types'

export function useCategories(type?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true)
      setError(null)

      const result = await getCategories(type)

      if (result.success) {
        setCategories(result.data || [])
      } else {
        setError(result.error || 'Erro ao carregar categorias')
      }

      setIsLoading(false)
    }

    loadCategories()
  }, [type])

  return { categories, isLoading, error }
}
