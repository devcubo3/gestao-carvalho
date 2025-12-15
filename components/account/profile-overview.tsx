'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, LogOut } from 'lucide-react'
import { AvatarUpload } from './avatar-upload'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  createdAt: string
  lastSignInAt: string | null
}

interface ProfileOverviewProps {
  userData: UserData
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visualizador: 'Visualizador',
}

export function ProfileOverview({ userData }: ProfileOverviewProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/auth/signout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center">
          <AvatarUpload
            userId={userData.id}
            currentAvatarUrl={userData.avatarUrl}
            userName={userData.fullName || 'Usuário'}
          />
        </div>
        <CardTitle className="font-serif">
          {userData.fullName || 'Nome não definido'}
        </CardTitle>
        <CardDescription>{userData.email}</CardDescription>
        <div className="flex justify-center">
          <Badge variant="default" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {roleLabels[userData.role] || userData.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Último acesso:</span>
            <span>
              {userData.lastSignInAt
                ? new Date(userData.lastSignInAt).toLocaleDateString('pt-BR')
                : 'Nunca'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Membro desde:</span>
            <span>
              {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <Separator />
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>
      </CardContent>
    </Card>
  )
}
