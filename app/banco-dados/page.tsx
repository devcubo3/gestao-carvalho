"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Car, Tag, Link } from "lucide-react"
import NextLink from "next/link"

export default function BancoDadosPage() {
  const categories = [
    {
      id: "vinculo",
      name: "Vínculo",
      description: "Tipos de vínculo entre partes",
      icon: Link,
      itemCount: 1,
      color: "bg-blue-500",
    },
    {
      id: "tipo-imovel",
      name: "Tipo de Imóvel",
      description: "Categorias de imóveis disponíveis",
      icon: Building2,
      itemCount: 8,
      color: "bg-green-500",
    },
    {
      id: "tipo-veiculo",
      name: "Tipo de Veículo",
      description: "Categorias de veículos disponíveis",
      icon: Car,
      itemCount: 3,
      color: "bg-orange-500",
    },
    {
      id: "outros",
      name: "Outros",
      description: "Outras categorias e classificações",
      icon: Tag,
      itemCount: 23,
      color: "bg-purple-500",
    },
  ]

  return (
    <MainLayout breadcrumbs={[{ label: "Banco de Dados" }]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-serif text-foreground">Banco de Dados</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <NextLink key={category.id} href={`/banco-dados/${category.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-serif">{category.name}</CardTitle>
                        </div>
                      </div>
                      <Badge variant="secondary">{category.itemCount} itens</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              </NextLink>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}
