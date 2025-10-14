"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface DevelopmentCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DevelopmentCreateModal({ open, onOpenChange }: DevelopmentCreateModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    type: "",
    city: "",
    name: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.type || !formData.city || !formData.name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Mock creation - in real app would call API
    console.log("Creating development:", formData)

    toast({
      title: "Sucesso",
      description: "Empreendimento cadastrado com sucesso!",
    })

    setFormData({
      code: "",
      type: "",
      city: "",
      name: "",
      description: "",
    })
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Empreendimento</DialogTitle>
          <DialogDescription>Cadastre um novo empreendimento imobiliário no sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="Código do empreendimento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predio">Prédio</SelectItem>
                  <SelectItem value="loteamento">Loteamento</SelectItem>
                  <SelectItem value="chacaramento">Chacaramento</SelectItem>
                  <SelectItem value="condominio">Condomínio</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sao-paulo">São Paulo</SelectItem>
                <SelectItem value="rio-de-janeiro">Rio de Janeiro</SelectItem>
                <SelectItem value="belo-horizonte">Belo Horizonte</SelectItem>
                <SelectItem value="brasilia">Brasília</SelectItem>
                <SelectItem value="salvador">Salvador</SelectItem>
                <SelectItem value="fortaleza">Fortaleza</SelectItem>
                <SelectItem value="curitiba">Curitiba</SelectItem>
                <SelectItem value="recife">Recife</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome Usual *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Nome usual do empreendimento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição detalhada do empreendimento"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Empreendimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
