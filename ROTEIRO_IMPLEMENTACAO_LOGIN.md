# Roteiro de Implementação - Sistema de Login e Autenticação

**Data de Criação:** 31/10/2025  
**Projeto:** Sistema de Gestão Patrimonial GRA Empreendimentos  
**Status:** Planejamento

---

## 📋 Sumário Executivo

Este documento apresenta a análise completa do projeto e do banco de dados Supabase, identificando os requisitos, gaps e roteiro detalhado para implementação de um sistema de login robusto com controle de acesso baseado em roles.

---

## 🔍 Análise do Estado Atual

### 1. Estrutura do Banco de Dados (Supabase)

#### ✅ Recursos Disponíveis no Supabase Auth

O projeto já possui acesso ao **Supabase Auth**, que oferece:

- **Schema `auth.users`**: Tabela principal com 0 usuários cadastrados
  - Campos disponíveis: `id`, `email`, `encrypted_password`, `role`, `raw_user_meta_data`, `raw_app_meta_data`
  - Suporta autenticação via email/senha
  - Sistema de tokens (recovery, confirmation, email_change)
  - MFA (Multi-Factor Authentication) disponível
  - SSO e OAuth integrados
  - RLS (Row Level Security) habilitado

- **Schema `auth.sessions`**: Gerenciamento de sessões
- **Schema `auth.refresh_tokens`**: Tokens de atualização
- **Schema `auth.identities`**: Identidades de usuários (para OAuth)

#### ⚠️ Gaps Identificados no Schema `public`

**Tabela `public.profiles` INCOMPLETA:**
```sql
-- Estrutura atual (INADEQUADA)
CREATE TABLE public.profiles (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Problemas:**
1. ❌ Não há relação com `auth.users` (falta FK)
2. ❌ Campo `id` é `BIGINT` ao invés de `UUID` (incompatível com `auth.users.id`)
3. ❌ Faltam campos essenciais: `name`, `role`, `avatar_url`, etc.
4. ❌ RLS habilitado mas **SEM POLÍTICAS** (alerta de segurança)
5. ❌ Não há trigger para criar profile automaticamente após signup

---

### 2. Análise da Estrutura do Projeto Next.js

#### ✅ Tecnologias Instaladas

```json
{
  "next": "14.2.16",
  "react": "18.0.0",
  "typescript": "5.0.2",
  "@radix-ui/*": "Diversos componentes UI",
  "react-hook-form": "7.60.0",
  "zod": "3.25.67"
}
```

#### ❌ Dependências Faltantes para Auth

**Necessário instalar:**
```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

#### 📁 Estrutura de Páginas Atual

```
app/
├── page.tsx (Dashboard - SEM PROTEÇÃO)
├── layout.tsx (Root layout)
├── globals.css
├── banco-dados/
├── cadastros/
├── configuracoes/
│   ├── usuarios/ (SEM IMPLEMENTAÇÃO)
│   └── minha-conta/ (SEM IMPLEMENTAÇÃO)
├── contratos/
├── financeiro/
└── relatorios/
```

#### 🔒 Sistema de Rotas e Permissões

**Análise do `sidebar-nav.tsx`:**
- Todas as rotas são públicas atualmente
- Não há validação de sessão
- Não há controle de acesso por role
- Menu exibe todas as opções independente do usuário

---

### 3. Tipos de Usuário Identificados no Sistema

Baseado em `lib/types.ts`:

```typescript
export type UserRole = "admin" | "gestor" | "visualizador"
```

**Requisitos de Permissão por Role:**

| Role | Permissões |
|------|-----------|
| **admin** | Acesso total ao sistema, incluindo configurações e gerenciamento de usuários |
| **gestor** | Criar, editar e gerenciar contratos, patrimônio e financeiro |
| **visualizador** | Apenas visualização de dados, sem permissões de edição |

---

## 🎯 Requisitos Funcionais

### RF01: Sistema de Login
- [ ] Página de login com email e senha
- [ ] Validação de credenciais via Supabase Auth
- [ ] Feedback visual de erros
- [ ] Redirecionamento pós-login baseado em role

### RF02: Sistema de Registro
- [ ] Página de cadastro (apenas admin pode criar usuários)
- [ ] Campos: nome, email, senha, role
- [ ] Criação automática de profile em `public.profiles`
- [ ] Email de confirmação (opcional)

### RF03: Gerenciamento de Sessão
- [ ] Middleware para validar sessão em todas as rotas protegidas
- [ ] Refresh automático de tokens
- [ ] Logout com limpeza de cookies

### RF04: Controle de Acesso por Role
- [ ] Middleware para verificar permissões por rota
- [ ] Componentes que renderizam condicionalmente por role
- [ ] Redirecionamento para dashboard apropriado

### RF05: Páginas de Perfil
- [ ] Página "Minha Conta" para editar dados pessoais
- [ ] Alteração de senha
- [ ] Upload de avatar (via Supabase Storage)

### RF06: Gerenciamento de Usuários (Admin)
- [ ] Listagem de usuários
- [ ] Criar/editar/desabilitar usuários
- [ ] Atribuir roles

---

## 🛠️ Roteiro de Implementação

### **FASE 1: Preparação do Banco de Dados** ⚡ Prioridade ALTA

#### Tarefa 1.1: Recriar Tabela `public.profiles`

**Migration SQL:**
```sql
-- 1. Dropar tabela existente (se necessário backup)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Criar tabela correta
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'visualizador' CHECK (role IN ('admin', 'gestor', 'visualizador')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem inserir novos usuários
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'visualizador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Índices para performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

**Como executar:**
```typescript
// Via MCP Supabase
await mcp_supabase_apply_migration({
  name: "create_profiles_table_with_rls",
  query: "-- SQL acima"
});
```

#### Tarefa 1.2: Criar Primeiro Usuário Admin

```sql
-- Inserir usuário admin manualmente no Supabase Dashboard
-- Authentication > Users > Add User

-- Ou via SQL (se permitido)
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  'admin@graempreendimentos.com',
  crypt('senha_segura_temporaria', gen_salt('bf')),
  now(),
  '{"full_name": "Administrador", "role": "admin"}'::jsonb
);
```

#### Tarefa 1.3: Bucket de Storage para Avatares

```sql
-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Políticas de storage
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

### **FASE 2: Instalação de Dependências**

#### Tarefa 2.1: Instalar Pacotes Supabase

```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

#### Tarefa 2.2: Criar Arquivo `.env.local`

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://mztyoodjmgkdikdqbfih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
```

**Como obter as keys:**
- Dashboard Supabase > Project Settings > API
- Copiar "Project URL" e "anon public"

---

### **FASE 3: Configuração do Supabase Client**

#### Tarefa 3.1: Criar Utilitários Supabase

**Arquivo: `lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Arquivo: `lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Middleware context - ignore
          }
        },
      },
    }
  )
}
```

**Arquivo: `lib/supabase/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

#### Tarefa 3.2: Gerar Types do Banco de Dados

```bash
# Instalar CLI do Supabase (se não tiver)
pnpm add -D supabase

# Logar no Supabase
npx supabase login

# Linkar projeto
npx supabase link --project-ref mztyoodjmgkdikdqbfih

# Gerar types
npx supabase gen types typescript --project-id mztyoodjmgkdikdqbfih > lib/database.types.ts
```

---

### **FASE 4: Implementação do Middleware**

#### Tarefa 4.1: Criar Middleware de Autenticação

**Arquivo: `middleware.ts` (raiz do projeto)**
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/login', '/auth/callback', '/auth/error']

// Rotas que requerem role específico
const roleBasedRoutes: Record<string, string[]> = {
  admin: ['/configuracoes/usuarios'],
  gestor: ['/contratos/novo', '/cadastros'],
  visualizador: [], // Pode acessar apenas leitura
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Permitir rotas públicas
  if (publicRoutes.some(route => path.startsWith(route))) {
    return supabaseResponse
  }

  // Redirecionar para login se não autenticado
  if (!user && !publicRoutes.includes(path)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Validar permissões por role (buscar do banco)
  if (user) {
    // TODO: Buscar role do usuário de public.profiles
    // e validar acesso à rota específica
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### **FASE 5: Páginas de Autenticação**

#### Tarefa 5.1: Página de Login

**Arquivo: `app/login/page.tsx`**
```typescript
import { LoginForm } from '@/components/auth/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já está autenticado, redirecionar
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Gestão Patrimonial</h2>
          <p className="mt-2 text-gray-600">GRA Empreendimentos</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

**Arquivo: `components/auth/login-form.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Buscar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando...',
      })

      // Redirecionar baseado em role
      const redirectMap: Record<string, string> = {
        admin: '/',
        gestor: '/',
        visualizador: '/',
      }

      router.push(redirectMap[profile?.role || 'visualizador'])
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
```

#### Tarefa 5.2: Route Handler de Callback

**Arquivo: `app/auth/callback/route.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirectTo, request.url))
}
```

#### Tarefa 5.3: Página de Erro de Auth

**Arquivo: `app/auth/error/page.tsx`**
```typescript
export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Erro de Autenticação</h1>
        <p className="mt-2 text-gray-600">
          Algo deu errado. Tente novamente.
        </p>
        <a href="/login" className="mt-4 text-blue-600 underline">
          Voltar para login
        </a>
      </div>
    </div>
  )
}
```

#### Tarefa 5.4: Route Handler de Logout

**Arquivo: `app/auth/signout/route.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}
```

---

### **FASE 6: Proteção de Rotas e Componentes**

#### Tarefa 6.1: Hook de Verificação de Role

**Arquivo: `hooks/use-user-role.ts`**
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setRole(profile?.role as UserRole || null)
      }
      
      setLoading(false)
    }

    fetchRole()
  }, [])

  return { role, loading }
}
```

#### Tarefa 6.2: Componente de Proteção por Role

**Arquivo: `components/auth/role-gate.tsx`**
```typescript
'use client'

import { useUserRole } from '@/hooks/use-user-role'
import type { UserRole } from '@/lib/types'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { role, loading } = useUserRole()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback || <div>Acesso negado</div>
  }

  return <>{children}</>
}
```

**Uso:**
```typescript
<RoleGate allowedRoles={['admin', 'gestor']}>
  <Button>Criar Novo Contrato</Button>
</RoleGate>
```

#### Tarefa 6.3: Atualizar Sidebar com Controle de Acesso

**Modificar `components/sidebar-nav.tsx`:**
```typescript
// Adicionar verificação de role antes de renderizar itens
const { role } = useUserRole()

// Filtrar navItems baseado em role
const filteredNavItems = navItems.filter(item => {
  if (item.href === '/configuracoes/usuarios' && role !== 'admin') {
    return false
  }
  // Adicionar outras regras
  return true
})
```

---

### **FASE 7: Páginas de Gerenciamento**

#### Tarefa 7.1: Página "Minha Conta"

**Arquivo: `app/configuracoes/minha-conta/page.tsx`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountForm } from '@/components/settings/account-form'
import { MainLayout } from '@/components/main-layout'

export default async function MyAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <MainLayout breadcrumbs={[
      { label: 'Configurações' },
      { label: 'Minha Conta' }
    ]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Minha Conta</h1>
        <AccountForm user={user} profile={profile} />
      </div>
    </MainLayout>
  )
}
```

**Arquivo: `components/settings/account-form.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AvatarUpload } from './avatar-upload'

export function AccountForm({ user, profile }: any) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <AvatarUpload userId={user.id} currentUrl={profile?.avatar_url} />
      
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <Label htmlFor="email">Email (não editável)</Label>
          <Input id="email" value={user.email} disabled />
        </div>
        
        <div>
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <Label>Função</Label>
          <Input value={profile?.role} disabled />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>

      <div className="pt-6 border-t">
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="destructive">
            Sair da Conta
          </Button>
        </form>
      </div>
    </div>
  )
}
```

#### Tarefa 7.2: Página de Gerenciamento de Usuários (Admin)

**Arquivo: `app/configuracoes/usuarios/page.tsx`**
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/components/main-layout'
import { UsersTable } from '@/components/settings/users-table'
import { CreateUserModal } from '@/components/settings/create-user-modal'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Buscar todos os usuários
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <MainLayout breadcrumbs={[
      { label: 'Configurações' },
      { label: 'Usuários' }
    ]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <CreateUserModal />
        </div>
        <UsersTable users={users || []} />
      </div>
    </MainLayout>
  )
}
```

---

### **FASE 8: Testes e Validação**

#### Tarefa 8.1: Checklist de Testes

- [ ] Login com credenciais válidas redireciona corretamente
- [ ] Login com credenciais inválidas exibe erro
- [ ] Logout limpa sessão e redireciona para /login
- [ ] Rotas protegidas redirecionam usuários não autenticados
- [ ] Admin consegue acessar /configuracoes/usuarios
- [ ] Gestor NÃO consegue acessar /configuracoes/usuarios
- [ ] Visualizador tem acesso apenas de leitura
- [ ] Edição de perfil atualiza corretamente
- [ ] Upload de avatar funciona
- [ ] RLS impede acesso não autorizado via API

#### Tarefa 8.2: Testes de Segurança

```typescript
// Testar RLS via console do Supabase
// 1. Fazer login como usuário comum
// 2. Tentar acessar profiles de outros usuários:

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .neq('id', user.id) // Deve retornar vazio ou erro

// 3. Verificar que admin consegue ver todos
```

---

## 📊 Fluxogramas de Redirecionamento

### Fluxo de Login

```
Usuário acessa /login
    ↓
Já está autenticado?
    ↓ SIM → Redireciona para / (dashboard)
    ↓ NÃO
Exibe formulário de login
    ↓
Submete credenciais
    ↓
Válidas?
    ↓ NÃO → Exibe erro
    ↓ SIM
Busca role do usuário em public.profiles
    ↓
admin → / (dashboard completo)
gestor → / (dashboard com permissões limitadas)
visualizador → / (dashboard apenas leitura)
```

### Fluxo de Proteção de Rotas

```
Usuário tenta acessar rota
    ↓
Middleware verifica sessão
    ↓
Não autenticado?
    ↓ SIM → /login?redirectTo={rota_original}
    ↓ NÃO
Busca role do usuário
    ↓
Valida permissão para a rota
    ↓
Sem permissão?
    ↓ SIM → Redireciona para /
    ↓ NÃO
Permite acesso
```

---

## 🚨 Alertas de Segurança

### CRÍTICO
1. **RLS sem políticas**: A tabela `profiles` precisa ser recriada com as políticas corretas
2. **Anon Key exposta**: Nunca commitar `.env.local` no Git
3. **Senha do primeiro admin**: Trocar imediatamente após primeiro login

### IMPORTANTE
1. Implementar rate limiting no login (Supabase Auth já tem, mas validar configurações)
2. Adicionar CAPTCHA após N tentativas de login falhadas
3. Implementar MFA para usuários admin (opcional)
4. Habilitar auditoria de ações no Supabase Dashboard

---

## 📚 Referências e Documentação

### Documentação Oficial
- [Supabase Auth com Next.js (SSR)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

### Exemplos de Código
- [Next.js User Management Example](https://github.com/supabase/supabase/tree/master/examples/user-management/nextjs-user-management)
- [Twitter Clone with Auth](https://egghead.io/courses/build-a-twitter-clone-with-the-next-js-app-router-and-supabase-19bebadb)

---

## ✅ Checklist de Conclusão

### Banco de Dados
- [ ] Tabela `profiles` recriada com estrutura correta
- [ ] RLS habilitado com todas as políticas
- [ ] Trigger de auto-criação de profile configurado
- [ ] Bucket de avatares criado
- [ ] Primeiro usuário admin criado

### Código
- [ ] Dependências `@supabase/ssr` e `@supabase/supabase-js` instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Utilitários Supabase criados (client, server, middleware)
- [ ] Types do banco gerados
- [ ] Middleware de autenticação implementado
- [ ] Páginas de login/logout criadas
- [ ] Route handlers de auth configurados
- [ ] Páginas de perfil implementadas
- [ ] Gerenciamento de usuários (admin) implementado
- [ ] Controle de acesso por role funcional

### Testes
- [ ] Todos os fluxos de autenticação testados
- [ ] Permissões por role validadas
- [ ] RLS testado no console do Supabase
- [ ] Testes de segurança realizados

### Documentação
- [ ] Variáveis de ambiente documentadas
- [ ] Permissões por role documentadas
- [ ] Fluxos de autenticação documentados
- [ ] Instruções de primeiro acesso criadas

---

## 🎯 Próximos Passos (Pós-Implementação)

1. **Auditoria**: Implementar log de ações dos usuários
2. **MFA**: Adicionar autenticação de dois fatores para admins
3. **Recuperação de Senha**: Implementar fluxo de reset de senha
4. **Onboarding**: Criar wizard de primeiro acesso
5. **Notificações**: Sistema de notificações por email (Supabase Auth já tem)
6. **Analytics**: Integrar analytics de uso do sistema

---

## 📝 Notas Finais

- **Estimativa de Tempo**: 12-16 horas de desenvolvimento
- **Complexidade**: Média
- **Dependências Externas**: Supabase (já configurado)
- **Impacto**: Alto - Sistema não funcionará sem login

**Observação Importante**: Não alterar nada no projeto até completar pelo menos a FASE 1 (banco de dados), pois a estrutura atual da tabela `profiles` está incorreta e causará erros na aplicação.

---

**Documento preparado em:** 31 de outubro de 2025  
**Última atualização:** 31 de outubro de 2025  
**Versão:** 1.0
