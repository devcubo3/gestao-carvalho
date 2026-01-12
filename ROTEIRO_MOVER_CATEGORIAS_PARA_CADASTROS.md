# Roteiro: Mover Página de Categorias para Aba de Cadastros

## 📋 Visão Geral

Este roteiro detalha os passos para mover a página de gerenciamento de categorias de **Configurações** para a aba **Cadastros** no menu lateral.

## 🎯 Objetivos

1. Mover a página de categorias de `/configuracoes/categorias` para `/cadastros/categorias`
2. Atualizar o menu lateral para exibir o link na aba "Cadastros"
3. Manter toda a funcionalidade existente (criar, editar, excluir categorias)
4. Garantir que apenas administradores possam acessar

## 📊 Análise do Banco de Dados

### Tabela: `categories` (59 registros)

**Estrutura:**
```sql
- id: uuid (PK)
- name: text (NOT NULL)
- type: text (NOT NULL) - CHECK constraint com 9 tipos
- description: text (NULLABLE)
- is_active: boolean (NOT NULL, DEFAULT true)
- display_order: integer (NOT NULL, DEFAULT 0)
- created_by: uuid (FK -> auth.users)
- created_at: timestamptz
- updated_at: timestamptz
```

**Tipos de Categorias (9 tipos):**
1. `vinculo` - 10 categorias
2. `centro_custo` - 7 categorias
3. `forma_pagamento` - 7 categorias
4. `imovel_tipo` - 5 categorias
5. `imovel_classe` - 7 categorias
6. `imovel_subclasse` - 5 categorias
7. `veiculo_tipo` - 6 categorias
8. `veiculo_combustivel` - 7 categorias
9. `empreendimento_tipo` - 5 categorias

**RLS Policies:**
- ✅ SELECT: Todos usuários autenticados
- ✅ INSERT: Apenas administradores
- ✅ UPDATE: Apenas administradores
- ✅ DELETE: Apenas administradores (soft delete via is_active)

## 📁 Estrutura Atual vs Nova

### Atual (Configurações)
```
app/
  configuracoes/
    categorias/
      page.tsx          ← Mover

components/
  settings/
    category-form-dialog.tsx  ← Mover

components/
  sidebar-nav.tsx      ← Atualizar
```

### Nova (Cadastros)
```
app/
  cadastros/
    categorias/
      page.tsx          ← Destino

components/
  database/
    category-form-dialog.tsx  ← Destino

components/
  sidebar-nav.tsx      ← Atualizar
```

## 🔧 Passos de Implementação

### Passo 1: Criar Nova Estrutura de Pastas

**Objetivo:** Criar as pastas necessárias na estrutura de Cadastros

**Comandos:**
```powershell
# Criar pasta para a página de categorias
New-Item -ItemType Directory -Path "app/cadastros/categorias" -Force

# A pasta components/database já existe (usada por pessoas e empresas)
```

---

### Passo 2: Mover a Página Principal

**Objetivo:** Mover a página de gerenciamento de categorias

**Arquivo Origem:** `app/configuracoes/categorias/page.tsx`  
**Arquivo Destino:** `app/cadastros/categorias/page.tsx`

**Ação:**
```powershell
# Copiar o arquivo para o novo local
Copy-Item "app/configuracoes/categorias/page.tsx" "app/cadastros/categorias/page.tsx"

# Após confirmar que tudo funciona, remover o antigo
# Remove-Item -Recurse "app/configuracoes/categorias"
```

**Alterações no Código:**
- ✅ **Nenhuma alteração necessária no código**
- A página já importa corretamente os componentes
- Todas as importações usam caminhos absolutos com `@/`

---

### Passo 3: Mover o Componente Dialog

**Objetivo:** Mover o modal de criar/editar categorias para a pasta database

**Arquivo Origem:** `components/settings/category-form-dialog.tsx`  
**Arquivo Destino:** `components/database/category-form-dialog.tsx`

**Ação:**
```powershell
# Copiar o arquivo para o novo local
Copy-Item "components/settings/category-form-dialog.tsx" "components/database/category-form-dialog.tsx"

# Após confirmar que tudo funciona, remover o antigo
# Remove-Item "components/settings/category-form-dialog.tsx"
```

**Alterações no Código:**
- ✅ **Nenhuma alteração necessária no componente**
- Todas as importações já usam caminhos absolutos

---

### Passo 4: Atualizar Import na Página

**Objetivo:** Atualizar o import do dialog na página de categorias

**Arquivo:** `app/cadastros/categorias/page.tsx`

**Localizar:**
```typescript
import { CategoryFormDialog } from '@/components/settings/category-form-dialog'
```

**Substituir por:**
```typescript
import { CategoryFormDialog } from '@/components/database/category-form-dialog'
```

---

### Passo 5: Atualizar Menu Lateral (Sidebar)

**Objetivo:** Mover o link de "Categorias" de Configurações para Cadastros

**Arquivo:** `components/sidebar-nav.tsx`

**Localizar a seção de Cadastros (linha ~95):**
```typescript
{
  title: "Cadastros",
  icon: Users,
  children: [
    {
      title: "Pessoas",
      href: "/cadastros/pessoas",
      icon: User,
    },
    {
      title: "Empresas",
      href: "/cadastros/empresas",
      icon: Building,
    },
  ],
},
```

**Substituir por:**
```typescript
{
  title: "Cadastros",
  icon: Users,
  children: [
    {
      title: "Pessoas",
      href: "/cadastros/pessoas",
      icon: User,
    },
    {
      title: "Empresas",
      href: "/cadastros/empresas",
      icon: Building,
    },
    {
      title: "Categorias",
      href: "/cadastros/categorias",
      icon: Database,
    },
  ],
},
```

**Localizar a seção de Configurações (linha ~117):**
```typescript
const settingsItems: NavItem[] = [
  {
    title: "Configurações",
    icon: Settings,
    children: [
      {
        title: "Usuários",
        href: "/configuracoes/usuarios",
        icon: Users,
      },
      {
        title: "Categorias",
        href: "/configuracoes/categorias",
        icon: Database,
      },
      {
        title: "Minha Conta",
        href: "/configuracoes/minha-conta",
        icon: User,
      },
    ],
  },
]
```

**Substituir por:**
```typescript
const settingsItems: NavItem[] = [
  {
    title: "Configurações",
    icon: Settings,
    children: [
      {
        title: "Usuários",
        href: "/configuracoes/usuarios",
        icon: Users,
      },
      {
        title: "Minha Conta",
        href: "/configuracoes/minha-conta",
        icon: User,
      },
    ],
  },
]
```

---

### Passo 6: Verificar Imports

**Objetivo:** Garantir que todos os imports estejam corretos

**Arquivos para verificar:**

1. **app/cadastros/categorias/page.tsx**
   - ✅ `import { CategoryFormDialog } from '@/components/database/category-form-dialog'`
   - ✅ `import { getAllCategories, deleteCategory, getUserPermissions } from '@/app/actions/categories'`

2. **components/database/category-form-dialog.tsx**
   - ✅ `import { createCategory, updateCategory } from '@/app/actions/categories'`

---

### Passo 7: Remover Arquivos Antigos (Após Testes)

**Objetivo:** Limpar estrutura antiga após confirmar que tudo funciona

**Comandos (executar apenas após testar):**
```powershell
# Remover pasta antiga de configurações/categorias
Remove-Item -Recurse -Force "app/configuracoes/categorias"

# Remover componente antigo
Remove-Item -Force "components/settings/category-form-dialog.tsx"

# Verificar se a pasta settings está vazia e removê-la se sim
$settingsContent = Get-ChildItem "components/settings"
if ($settingsContent.Count -eq 0) {
    Remove-Item -Force "components/settings"
}
```

---

## ✅ Checklist de Implementação

### Estrutura de Arquivos
- [ ] Pasta `app/cadastros/categorias` criada
- [ ] Arquivo `app/cadastros/categorias/page.tsx` criado
- [ ] Arquivo `components/database/category-form-dialog.tsx` criado

### Código Atualizado
- [ ] Import do dialog atualizado em `page.tsx`
- [ ] Link adicionado em "Cadastros" no `sidebar-nav.tsx`
- [ ] Link removido de "Configurações" no `sidebar-nav.tsx`

### Testes Funcionais
- [ ] Acessar `/cadastros/categorias` funciona
- [ ] Menu "Cadastros > Categorias" aparece e redireciona corretamente
- [ ] Botão "Nova Categoria" abre o modal
- [ ] Criar nova categoria funciona
- [ ] Editar categoria existente funciona
- [ ] Excluir (desativar) categoria funciona
- [ ] Apenas administradores conseguem criar/editar/excluir
- [ ] Usuários não-admin visualizam as categorias mas não podem modificar

### Limpeza
- [ ] Pasta antiga `app/configuracoes/categorias` removida
- [ ] Arquivo antigo `components/settings/category-form-dialog.tsx` removido
- [ ] Não há erros de compilação
- [ ] Não há imports quebrados

---

## 🎨 Interface Esperada

### Navegação

**Menu Lateral - Seção Cadastros:**
```
📋 Cadastros
  └─ 👤 Pessoas
  └─ 🏢 Empresas
  └─ 🗂️ Categorias  ← NOVO
```

**Menu Lateral - Seção Configurações:**
```
⚙️ Configurações
  └─ 👥 Usuários
  └─ 👤 Minha Conta
```

### Página de Categorias

**URL:** `/cadastros/categorias`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Categorias                    [Nova Categoria]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Gerencie as categorias do sistema             │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Vínculos         │  │ Centros de Custo │    │
│  │ ─────────────    │  │ ─────────────    │    │
│  │ • Aluguel    ✏️🗑│  │ • Administrativo ✏️│   │
│  │ • Compra     ✏️🗑│  │ • Comercial     ✏️🗑│   │
│  │ • Venda      ✏️🗑│  │ • Operacional   ✏️🗑│   │
│  │ ...              │  │ ...              │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Formas de Pag.   │  │ Tipos de Imóvel  │    │
│  │ ─────────────    │  │ ─────────────    │    │
│  │ • Dinheiro   ✏️🗑│  │ • Casa          ✏️🗑│   │
│  │ • PIX        ✏️🗑│  │ • Apartamento   ✏️🗑│   │
│  │ ...              │  │ ...              │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                  │
│  [Mais cards para outros tipos...]              │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Testes de Aceitação

### Teste 1: Navegação
1. Fazer login como admin
2. Clicar em "Cadastros" no menu lateral
3. Verificar que "Categorias" aparece na lista
4. Clicar em "Categorias"
5. **Resultado esperado:** Página `/cadastros/categorias` carrega com sucesso

### Teste 2: Criação de Categoria
1. Na página de categorias, clicar em "Nova Categoria"
2. Preencher:
   - Tipo: `vinculo`
   - Nome: `Teste Admin`
   - Descrição: `Categoria de teste`
   - Ordem: `999`
   - Ativo: `true`
3. Clicar em "Criar"
4. **Resultado esperado:** 
   - Toast de sucesso aparece
   - Nova categoria aparece no card "Vínculos"
   - Modal fecha automaticamente

### Teste 3: Edição de Categoria
1. Localizar uma categoria existente
2. Clicar no ícone de editar (✏️)
3. Alterar o nome
4. Clicar em "Salvar"
5. **Resultado esperado:**
   - Toast de sucesso aparece
   - Nome atualizado aparece no card
   - Modal fecha automaticamente

### Teste 4: Exclusão de Categoria (Soft Delete)
1. Localizar uma categoria de teste
2. Clicar no ícone de excluir (🗑️)
3. Confirmar exclusão
4. **Resultado esperado:**
   - Toast de sucesso aparece
   - Categoria desaparece da listagem
   - Categoria continua no banco com `is_active = false`

### Teste 5: Controle de Acesso
1. Fazer login como usuário **NÃO admin** (role: editor ou visualizador)
2. Tentar acessar `/cadastros/categorias`
3. **Resultado esperado:**
   - Usuários não-admin devem ver as categorias
   - Botão "Nova Categoria" deve estar desabilitado ou oculto
   - Ícones de editar/excluir não devem aparecer

### Teste 6: Responsividade
1. Acessar a página em diferentes tamanhos de tela
2. **Resultado esperado:**
   - Cards de categorias se reorganizam em grid responsivo
   - Todos os elementos são acessíveis em mobile
   - Não há overflow horizontal

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Erro 404 ao acessar /cadastros/categorias

**Causa:** Arquivo não foi criado no local correto  
**Solução:**
```powershell
# Verificar se o arquivo existe
Test-Path "app/cadastros/categorias/page.tsx"
# Deve retornar: True

# Se retornar False, criar novamente
Copy-Item "app/configuracoes/categorias/page.tsx" "app/cadastros/categorias/page.tsx"
```

---

### Problema 2: Import quebrado do CategoryFormDialog

**Causa:** Import não foi atualizado  
**Solução:**
```typescript
// ERRADO
import { CategoryFormDialog } from '@/components/settings/category-form-dialog'

// CORRETO
import { CategoryFormDialog } from '@/components/database/category-form-dialog'
```

---

### Problema 3: Link não aparece no menu lateral

**Causa:** sidebar-nav.tsx não foi atualizado corretamente  
**Solução:**
1. Abrir `components/sidebar-nav.tsx`
2. Localizar a seção `Cadastros` (linha ~95)
3. Adicionar o objeto de categoria após "Empresas"
4. Salvar e recarregar a página

---

### Problema 4: Permissões não funcionam

**Causa:** RLS policies não estão ativas  
**Solução:**
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'categories';
-- rowsecurity deve ser 't' (true)

-- Se não estiver, habilitar:
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Notas Importantes

### Sobre a Estrutura Existente

A página de categorias **já está implementada** em `/configuracoes/categorias`. Este roteiro apenas move ela para a aba de Cadastros, onde faz mais sentido semanticamente.

### Arquivos Backend (NÃO precisam ser modificados)

Os seguintes arquivos **NÃO serão alterados** pois já usam caminhos absolutos:
- ✅ `app/actions/categories.ts` - Server actions
- ✅ `hooks/use-categories.ts` - Custom hook
- ✅ `lib/types.ts` - Interface Category

### Integração com Formulários

Os formulários financeiros que usam categorias **NÃO precisam ser alterados**, pois já consomem o hook `useCategories`:
- Contas a Pagar (3 arquivos)
- Contas a Receber (3 arquivos)
- Caixa (1 arquivo)

---

## 🚀 Comandos Rápidos

### Executar toda a migração de uma vez (PowerShell)

```powershell
# 1. Criar estrutura
New-Item -ItemType Directory -Path "app/cadastros/categorias" -Force

# 2. Copiar arquivos
Copy-Item "app/configuracoes/categorias/page.tsx" "app/cadastros/categorias/page.tsx"
Copy-Item "components/settings/category-form-dialog.tsx" "components/database/category-form-dialog.tsx"

# 3. Após atualizar os imports manualmente, testar
pnpm run dev

# 4. Se tudo funcionar, limpar arquivos antigos
# Remove-Item -Recurse -Force "app/configuracoes/categorias"
# Remove-Item -Force "components/settings/category-form-dialog.tsx"
```

---

## 📚 Referências

### Documentação do Projeto
- [IMPLEMENTACAO_CATEGORIAS_DINAMICAS.md](./IMPLEMENTACAO_CATEGORIAS_DINAMICAS.md) - Implementação original
- [ROTEIRO_IMPLEMENTACAO_CADASTRO_PESSOAS.md](./ROTEIRO_IMPLEMENTACAO_CADASTRO_PESSOAS.md) - Padrão de cadastros

### Arquivos Relacionados
- Backend: `app/actions/categories.ts`
- Hook: `hooks/use-categories.ts`
- Tipos: `lib/types.ts`
- Migrações: `supabase/migrations/`

---

## ✨ Conclusão

Após seguir este roteiro, a página de categorias estará:
- ✅ Acessível via menu "Cadastros > Categorias"
- ✅ Localizada em `/cadastros/categorias`
- ✅ Com todos os componentes na pasta `components/database`
- ✅ Mantendo toda a funcionalidade CRUD
- ✅ Com controle de acesso admin preservado
- ✅ Totalmente integrada com os formulários existentes

**Tempo estimado:** 15-20 minutos  
**Complexidade:** Baixa (apenas mover arquivos e atualizar imports)  
**Impacto:** Baixo (não quebra funcionalidades existentes)
