# 📋 ROTEIRO DE IMPLEMENTAÇÃO - PÁGINA MINHA CONTA

**Data de Criação:** 08/11/2025  
**Responsável:** @qa  
**Projeto:** Gestão Patrimonial GRA Empreendimentos

---

## 🎯 OBJETIVO

Implementar funcionalidades completas na página "Minha Conta" para permitir que usuários autenticados:
1. Visualizem seus dados reais do perfil
2. Alterem sua senha de autenticação
3. Façam upload e visualizem foto de perfil
4. Façam logout do sistema

---

## 📊 ANÁLISE ATUAL

### ✅ **Estrutura do Banco de Dados**

#### Tabela `profiles`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NÃO | - | FK para auth.users |
| `full_name` | TEXT | SIM | null | Nome completo do usuário |
| `avatar_url` | TEXT | SIM | null | URL da foto no storage |
| `role` | TEXT | NÃO | 'visualizador' | Papel do usuário (admin/editor/visualizador) |
| `created_at` | TIMESTAMPTZ | SIM | now() | Data de criação |
| `updated_at` | TIMESTAMPTZ | SIM | now() | Data de atualização |

#### Políticas RLS em `profiles`
- ✅ Users can view own profile (SELECT)
- ✅ Users can update own profile (UPDATE)
- ✅ Admins can view all profiles (SELECT)
- ✅ Admins can update all profiles (UPDATE)
- ✅ Admins can insert profiles (INSERT)
- ✅ Admins can delete profiles (DELETE)

#### Políticas de Storage (storage.objects)
- ✅ Avatar images are publicly accessible (SELECT)
- ✅ Users can upload their own avatar (INSERT)
- ✅ Users can update their own avatar (UPDATE)
- ✅ Users can delete their own avatar (DELETE)

### ❌ **Recursos Ausentes**

1. **Bucket de Storage:** Não existe bucket `avatars` criado
2. **Página Client-Side:** Atualmente usa dados mockados (João Silva)
3. **Integração com Supabase:** Nenhuma chamada real ao banco de dados
4. **Funcionalidade de Logout:** Apenas `console.log`, não faz logout real
5. **Upload de Avatar:** Não implementado
6. **Alteração de Senha:** Não implementada

### 📄 **Dados do Usuário Teste**
```json
{
  "id": "f1acb856-b795-4126-9255-8140c0e930b7",
  "email": "augustonanuque@gmail.com",
  "full_name": "Augusto Santos Lopes",
  "role": "admin",
  "avatar_url": null,
  "last_sign_in_at": "2025-11-01 20:02:53",
  "created_at": "2025-11-01 20:01:33"
}
```

---

## 🏗️ IMPLEMENTAÇÕES NECESSÁRIAS

### **FASE 1: Criação do Bucket de Avatares** 🗂️

#### Tarefa 1.1: Criar Bucket no Supabase
**Objetivo:** Criar bucket público para armazenar fotos de perfil

**Implementação:**
```sql
-- Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

**Validação:**
- [ ] Bucket `avatars` criado
- [ ] Limite de 5MB configurado
- [ ] Apenas formatos de imagem permitidos
- [ ] Bucket configurado como público

#### Tarefa 1.2: Configurar Políticas de Storage (Já Existem)
**Status:** ✅ Políticas já criadas na migration `create_avatars_storage_policies`

**Políticas Existentes:**
- Avatar images are publicly accessible
- Users can upload their own avatar
- Users can update their own avatar  
- Users can delete their own avatar

---

### **FASE 2: Integração com Dados Reais do Perfil** 👤

#### Tarefa 2.1: Converter Página para Server Component com Client Islands
**Objetivo:** Buscar dados do servidor e usar client components apenas onde necessário

**Arquivo:** `app/configuracoes/minha-conta/page.tsx`

**Implementação:**
1. Criar Server Component principal que busca dados
2. Extrair formulários para Client Components
3. Buscar dados de `auth.users` e `profiles`

**Código Server Component:**
```tsx
// app/configuracoes/minha-conta/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/account/profile-client'

export default async function MinhaContaPage() {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError)
    redirect('/login')
  }
  
  // Combinar dados de auth e profile
  const userData = {
    id: user.id,
    email: user.email!,
    fullName: profile.full_name || '',
    avatarUrl: profile.avatar_url,
    role: profile.role,
    createdAt: profile.created_at,
    lastSignInAt: user.last_sign_in_at,
  }
  
  return <ProfileClient userData={userData} />
}
```

**Validação:**
- [ ] Página redireciona se não autenticado
- [ ] Dados reais do usuário são carregados
- [ ] Email vem de `auth.users`
- [ ] Nome e role vêm de `profiles`
- [ ] Avatar URL é carregado corretamente

#### Tarefa 2.2: Criar Client Component para Interface
**Objetivo:** Manter interatividade da UI

**Arquivo:** `components/account/profile-client.tsx`

**Implementação:**
```tsx
'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/main-layout'
import { ProfileOverview } from './profile-overview'
import { PersonalInfoCard } from './personal-info-card'
import { ChangePasswordCard } from './change-password-card'
import { SecurityCard } from './security-card'

interface UserData {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  createdAt: string
  lastSignInAt: string | null
}

interface ProfileClientProps {
  userData: UserData
}

export function ProfileClient({ userData }: ProfileClientProps) {
  return (
    <MainLayout breadcrumbs={[
      { label: 'Configurações', href: '/configuracoes' },
      { label: 'Minha Conta' }
    ]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">
            Minha Conta
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileOverview userData={userData} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard userData={userData} />
            <ChangePasswordCard />
            <SecurityCard />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
```

**Validação:**
- [ ] Componente recebe dados do servidor
- [ ] Interface renderiza corretamente
- [ ] Dados reais são exibidos

---

### **FASE 3: Upload e Visualização de Avatar** 📸

#### Tarefa 3.1: Criar Componente de Upload de Avatar
**Arquivo:** `components/account/avatar-upload.tsx`

**Funcionalidades:**
- Input file oculto para seleção de imagem
- Preview da imagem antes do upload
- Validação de tipo e tamanho (max 5MB)
- Upload para bucket `avatars` com path: `{user_id}/avatar.{ext}`
- Atualização do campo `avatar_url` na tabela `profiles`
- Loading state durante upload

**Implementação:**
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  userName: string
}

export function AvatarUpload({ userId, currentAvatarUrl, userName }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.')
      }

      const file = event.target.files[0]
      
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.')
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem.')
      }

      // Fazer upload
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${fileExt}`

      // Deletar avatar antigo se existir
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        await supabase.storage.from('avatars').remove([`${userId}/${oldPath}`])
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(data.publicUrl)
      toast({
        title: 'Avatar atualizado!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      })
      
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="relative">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl || undefined} alt={userName} />
        <AvatarFallback className="text-lg">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <Button
        size="icon"
        variant="outline"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
        disabled={uploading}
        onClick={() => document.getElementById('avatar-upload')?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}
```

**Validação:**
- [ ] Upload de imagem funciona
- [ ] Preview da imagem é exibido
- [ ] Validações de tamanho e tipo funcionam
- [ ] URL é salva em `profiles.avatar_url`
- [ ] Imagem antiga é deletada ao fazer novo upload
- [ ] Loading state é exibido durante upload

#### Tarefa 3.2: Atualizar ProfileOverview com Avatar Upload
**Arquivo:** `components/account/profile-overview.tsx`

**Implementação:**
```tsx
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
```

**Validação:**
- [ ] Avatar é exibido corretamente
- [ ] Botão de logout funciona
- [ ] Dados reais são exibidos
- [ ] Role é traduzida corretamente

---

### **FASE 4: Alteração de Informações Pessoais** ✏️

#### Tarefa 4.1: Criar Formulário de Informações Pessoais
**Arquivo:** `components/account/personal-info-card.tsx`

**Funcionalidades:**
- Editar `full_name`
- Email é somente leitura (vem da autenticação)
- Salvar alterações no banco
- Validação de campos

**Implementação:**
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

interface PersonalInfoCardProps {
  userData: UserData
}

export function PersonalInfoCard({ userData }: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(userData.fullName)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome completo não pode estar vazio.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', userData.id)

      if (error) throw error

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      })

      setIsEditing(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(userData.fullName)
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações básicas de perfil
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing || saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>
        </div>
        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Validação:**
- [ ] Modo edição funciona corretamente
- [ ] Nome é salvo no banco
- [ ] Email não pode ser editado
- [ ] Validação de campo vazio funciona
- [ ] Loading state é exibido
- [ ] Página é atualizada após salvar

---

### **FASE 5: Alteração de Senha** 🔐

#### Tarefa 5.1: Criar Formulário de Alteração de Senha
**Arquivo:** `components/account/change-password-card.tsx`

**Funcionalidades:**
- Validar senha atual
- Validar nova senha (mínimo 6 caracteres)
- Confirmar nova senha
- Usar API `supabase.auth.updateUser()`

**Implementação:**
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para alterar a senha.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Senha fraca',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      })
      return
    }

    try {
      setChanging(true)

      // Tentar fazer login com senha atual para validar
      const { data: userData } = await supabase.auth.getUser()
      
      if (!userData.user?.email) {
        throw new Error('Usuário não autenticado')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Senha atual incorreta')
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      })

      // Limpar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Não foi possível alterar a senha.',
        variant: 'destructive',
      })
    } finally {
      setChanging(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Key className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Mantenha sua conta segura com uma senha forte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Senha Atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Digite sua senha atual"
            disabled={changing}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              disabled={changing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              disabled={changing}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} disabled={changing}>
            {changing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Validação:**
- [ ] Senha atual é validada
- [ ] Nova senha tem mínimo 6 caracteres
- [ ] Confirmação de senha funciona
- [ ] Senha é alterada no Supabase Auth
- [ ] Campos são limpos após sucesso
- [ ] Mensagens de erro são exibidas corretamente

---

### **FASE 6: Card de Segurança** 🛡️

#### Tarefa 6.1: Criar Card de Segurança (Estático por enquanto)
**Arquivo:** `components/account/security-card.tsx`

**Implementação:**
```tsx
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
```

**Observação:** Funcionalidades de 2FA e sessões ativas serão implementadas em fases futuras.

**Validação:**
- [ ] Card é exibido corretamente
- [ ] Interface está preparada para futuras funcionalidades

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
app/
├── configuracoes/
│   └── minha-conta/
│       └── page.tsx (Server Component - busca dados)
│
components/
├── account/
│   ├── profile-client.tsx (Client wrapper principal)
│   ├── profile-overview.tsx (Card esquerdo com avatar e logout)
│   ├── avatar-upload.tsx (Componente de upload de avatar)
│   ├── personal-info-card.tsx (Edição de nome)
│   ├── change-password-card.tsx (Alteração de senha)
│   └── security-card.tsx (Card de segurança)
│
lib/
├── supabase/
│   ├── client.ts (Já existe ✅)
│   └── server.ts (Já existe ✅)
│
app/
└── auth/
    └── signout/
        └── route.ts (Já existe ✅)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Bucket de Avatares
- [ ] Criar bucket `avatars` no Supabase
- [ ] Configurar limite de 5MB
- [ ] Configurar tipos permitidos (jpeg, png, webp, gif)
- [ ] Políticas RLS já existem ✅

### Fase 2: Dados Reais do Perfil
- [ ] Converter página para Server Component
- [ ] Buscar dados de `auth.users` e `profiles`
- [ ] Criar `profile-client.tsx`
- [ ] Validar redirecionamento se não autenticado

### Fase 3: Upload de Avatar
- [ ] Criar `avatar-upload.tsx`
- [ ] Implementar validação de arquivo
- [ ] Implementar upload para storage
- [ ] Atualizar `avatar_url` em profiles
- [ ] Criar `profile-overview.tsx`
- [ ] Integrar avatar upload no overview

### Fase 4: Informações Pessoais
- [ ] Criar `personal-info-card.tsx`
- [ ] Implementar edição de `full_name`
- [ ] Implementar validações
- [ ] Implementar salvamento no banco

### Fase 5: Alteração de Senha
- [ ] Criar `change-password-card.tsx`
- [ ] Implementar validação de senha atual
- [ ] Implementar validação de nova senha
- [ ] Implementar confirmação de senha
- [ ] Usar `supabase.auth.updateUser()`

### Fase 6: Card de Segurança
- [ ] Criar `security-card.tsx`
- [ ] Interface estática preparada para futuro

### Fase 7: Logout
- [ ] Implementar função de logout em `profile-overview.tsx`
- [ ] Fazer POST para `/auth/signout`
- [ ] Redirecionar para `/login`
- [ ] Route handler já existe ✅

---

## 🧪 TESTES NECESSÁRIOS

### Testes Funcionais
1. **Autenticação:**
   - [ ] Página redireciona se não autenticado
   - [ ] Dados corretos são carregados do banco

2. **Avatar:**
   - [ ] Upload de imagem funciona
   - [ ] Validação de tamanho (max 5MB)
   - [ ] Validação de tipo (apenas imagens)
   - [ ] Preview é exibido corretamente
   - [ ] URL é salva no banco
   - [ ] Imagem antiga é deletada

3. **Informações Pessoais:**
   - [ ] Nome pode ser editado
   - [ ] Email não pode ser editado
   - [ ] Validação de campo vazio
   - [ ] Salvamento no banco funciona
   - [ ] Página é atualizada após salvar

4. **Alteração de Senha:**
   - [ ] Senha atual é validada
   - [ ] Nova senha tem mínimo 6 caracteres
   - [ ] Confirmação funciona
   - [ ] Senha é alterada no Supabase Auth
   - [ ] Campos são limpos após sucesso

5. **Logout:**
   - [ ] Botão de logout funciona
   - [ ] Usuário é deslogado
   - [ ] Redirecionamento para login funciona

### Testes de UI/UX
- [ ] Loading states funcionam
- [ ] Mensagens de erro são claras
- [ ] Mensagens de sucesso são exibidas
- [ ] Interface é responsiva
- [ ] Botões desabilitam durante operações

---

## 📊 MÉTRICAS DE SUCESSO

1. ✅ Usuário consegue visualizar seus dados reais
2. ✅ Usuário consegue fazer upload de foto de perfil
3. ✅ Usuário consegue alterar seu nome
4. ✅ Usuário consegue alterar sua senha
5. ✅ Usuário consegue fazer logout
6. ✅ Todas as validações funcionam corretamente
7. ✅ Experiência do usuário é fluida e sem bugs

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. **Criar bucket de avatares** (2 min)
2. **Converter página para Server Component** (15 min)
3. **Criar todos os componentes client** (60 min)
4. **Testar fluxo completo** (30 min)
5. **Ajustes finais e polish** (15 min)

**Tempo Total Estimado:** ~2 horas

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Segurança
- ✅ RLS policies já configuradas corretamente
- ✅ Usuários só podem editar próprio perfil
- ✅ Admins podem editar todos os perfis
- ✅ Storage tem políticas adequadas

### Limitações
- Email não pode ser alterado (restrição do Supabase Auth)
- 2FA e sessões ativas são features futuras
- Avatar limitado a 5MB

### Pontos de Atenção
- Sempre validar no client e no server
- Usar loading states para melhor UX
- Tratar erros adequadamente
- Refresh da página após operações importantes

---

## 🎯 PRÓXIMOS PASSOS APÓS IMPLEMENTAÇÃO

1. Implementar gerenciamento de sessões ativas
2. Adicionar autenticação de dois fatores (2FA)
3. Permitir alteração de email (requer verificação)
4. Adicionar histórico de alterações
5. Implementar preferências de notificações

---

**Fim do Roteiro de Implementação**
