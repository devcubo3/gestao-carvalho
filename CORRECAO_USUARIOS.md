# 🔧 Correção Implementada - Sistema de Criação de Usuários

## Problemas Identificados e Corrigidos

### 1. ❌ Erro 403 ao criar usuário
**Problema:** A chave ANON não tem permissão para usar `auth.admin.createUser()`

**Solução:** 
- Criado cliente admin com `SUPABASE_SERVICE_ROLE_KEY`
- Service role tem permissões administrativas completas

### 2. ❌ Erro 400 na função get_users_with_email
**Problema:** Função RPC não estava retornando dados corretamente

**Solução:**
- Adicionada coluna `email` na tabela `profiles`
- Criado trigger automático para sincronizar email de `auth.users` → `profiles`
- Removida dependência da função RPC problemática

## 📋 Ações Necessárias

### PASSO 1: Configurar Service Role Key

1. Acesse: https://supabase.com/dashboard/project/mztyoodjmgkdikdqbfih/settings/api

2. Na seção "Project API keys", encontre **service_role**

3. Clique no ícone 👁️ para revelar a chave

4. Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mztyoodjmgkdikdqbfih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dHlvb2RqbWdrZGlrZHFiZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Nzc0NTYsImV4cCI6MjA3NjU1MzQ1Nn0.tdITRb3zRYKdeiO0GYQ-OMtOXqJGfhfhgY6K6FStkkc
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

5. **NUNCA faça commit do `.env.local`!** Adicione ao `.gitignore`

### PASSO 2: Reiniciar o servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Iniciar novamente
npm run dev
```

## ✅ Alterações Implementadas

### Arquivos Modificados:

1. **app/actions/users.ts**
   - Criado cliente admin com service role
   - Uso de `supabaseAdmin` para criar usuários
   - Salvando email no profile

2. **app/configuracoes/usuarios/page.tsx**
   - Removida chamada RPC problemática
   - Busca email diretamente da tabela profiles

### Migrações no Banco de Dados:

1. **add_email_to_profiles**
   - Adicionada coluna `email TEXT` em `profiles`
   - Criado índice para performance

2. **sync_email_trigger**
   - Função `sync_user_email()` para sincronizar emails
   - Trigger automático em `auth.users`
   - Sincronização de emails existentes

3. **update_role_constraint_to_editor**
   - Atualizado constraint para aceitar 'editor' ao invés de 'gestor'

## 🎯 Como Funciona Agora

### Criação de Usuário:
```
1. Admin clica "Novo Usuário"
2. Preenche formulário (nome, email, senha, role)
3. Server action valida permissões
4. Cliente admin cria usuário em auth.users
5. Insere profile com email na tabela profiles
6. Trigger sincroniza email automaticamente
7. Página recarrega com novo usuário
```

### Segurança:
- ✅ Service role apenas no servidor (nunca exposta ao cliente)
- ✅ Validação de permissão admin antes de criar
- ✅ RLS policies protegem acesso aos dados
- ✅ Transação com rollback em caso de erro

## 🧪 Testar

1. Faça login como admin
2. Acesse Configurações > Usuários
3. Clique em "Novo Usuário"
4. Preencha os dados
5. Clique em "Criar Usuário"

**Resultado esperado:** 
- ✅ Toast de sucesso
- ✅ Usuário aparece na lista
- ✅ Email sincronizado automaticamente
- ✅ Acesso ao sistema com as credenciais criadas

## 📝 Notas Importantes

- A service_role key tem **acesso total** ao banco
- Use apenas em server actions/components
- Nunca exponha no código cliente
- Mantenha segura e em variáveis de ambiente
