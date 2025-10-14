"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface CompanyCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompanyCreateModal({ open, onOpenChange }: CompanyCreateModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nomeFantasia: "",
    cnpj: "",
    graPercentage: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomeFantasia || !formData.cnpj) {
      toast({
        title: "Erro",
        description: "Nome Fantasia e CNPJ são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Simular criação
    toast({
      title: "Sucesso",
      description: "Empresa cadastrada com sucesso!",
    })

    setFormData({
      nomeFantasia: "",
      cnpj: "",
      graPercentage: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>Cadastre uma nova pessoa jurídica no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
            <Input
              id="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
              placeholder="Digite o nome fantasia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graPercentage">% GRA</Label>
            <div className="relative">
              <Input
                id="graPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.graPercentage}
                onChange={(e) => setFormData({ ...formData, graPercentage: e.target.value })}
                placeholder="0.00"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Empresa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
