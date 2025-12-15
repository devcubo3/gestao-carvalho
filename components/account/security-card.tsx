'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

export function SecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Segurança da Conta
        </CardTitle>
        <CardDescription>
          Informações sobre a segurança da sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Autenticação de Dois Fatores</div>
              <div className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </div>
            </div>
            <Badge variant="outline">Desabilitado</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Sessões Ativas</div>
              <div className="text-sm text-muted-foreground">
                Gerencie dispositivos conectados à sua conta
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Ver Sessões
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
