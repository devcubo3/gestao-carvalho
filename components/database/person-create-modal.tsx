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

interface PersonCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonCreateModal({ open, onOpenChange }: PersonCreateModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (!formData.nome || !formData.cpf) {
      toast({
        title: "Erro",
        description: "Nome e CPF são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Simular criação
    toast({
      title: "Sucesso",
      description: "Pessoa cadastrada com sucesso!",
    })

    setFormData({
      nome: "",
      cpf: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Pessoa</DialogTitle>
          <DialogDescription>Cadastre uma nova pessoa física no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Pessoa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
