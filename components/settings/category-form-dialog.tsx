'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCategory, updateCategory } from '@/app/actions/categories'
import { useToast } from '@/hooks/use-toast'
import type { Category } from '@/lib/types'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess?: () => void
}

const CATEGORY_TYPES = [
  { value: 'vinculo', label: 'Vínculo' },
  { value: 'centro_custo', label: 'Centro de Custo' },
  { value: 'forma_pagamento', label: 'Forma de Pagamento' },
  { value: 'imovel_tipo', label: 'Tipo de Imóvel' },
  { value: 'imovel_classe', label: 'Classe de Imóvel' },
  { value: 'imovel_subclasse', label: 'Subclasse de Imóvel' },
  { value: 'veiculo_tipo', label: 'Tipo de Veículo' },
  { value: 'veiculo_combustivel', label: 'Tipo de Combustível' },
  { value: 'empreendimento_tipo', label: 'Tipo de Empreendimento' },
]

export function CategoryFormDialog({ open, onOpenChange, category, onSuccess }: CategoryFormDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    is_active: true,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        is_active: category.is_active,
      })
    } else {
      setFormData({
        name: '',
        type: '',
        is_active: true,
      })
    }
  }, [category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const dataToSubmit = {
      ...formData,
      is_active: category ? formData.is_active : true, // Novas sempre ativas, edições mantêm o estado
    }

    const result = category
      ? await updateCategory(category.id, dataToSubmit as any)
      : await createCategory(dataToSubmit as any)

    if (result.success) {
      toast({
        title: category ? 'Categoria atualizada!' : 'Categoria criada!',
        description: `A categoria "${formData.name}" foi ${category ? 'atualizada' : 'criada'} com sucesso.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast({
        title: `Erro ao ${category ? 'atualizar' : 'criar'} categoria`,
        description: result.error,
        variant: 'destructive',
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar' : 'Nova'} Categoria</DialogTitle>
          <DialogDescription>
            {category ? 'Atualize' : 'Crie'} uma categoria do sistema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                disabled={!!category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : category ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
