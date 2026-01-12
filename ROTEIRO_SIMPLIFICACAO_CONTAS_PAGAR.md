# 📋 ROTEIRO: Simplificação do Sistema de Contas a Pagar

**Data:** 06/01/2026  
**Responsável:** Dev Team  
**Prioridade:** ALTA  
**Estimativa:** 4-6 horas

---

## 🎯 OBJETIVO

Simplificar o cadastro de Contas a Pagar de 12 campos para apenas **6 campos essenciais**:

1. **Vencimento** (due_date)
2. **Vínculo** (vinculo)
3. **Centro de Custo** (centro_custo)
4. **Descrição** (description)
5. **Número de Parcelas** (installment_total)
6. **Valor da Parcela** (valor por parcela)

---

## 📊 ANÁLISE DE IMPACTO

### Campos a MANTER:
- ✅ `due_date` - Vencimento
- ✅ `vinculo` - Vínculo
- ✅ `centro_custo` - Centro de Custo
- ✅ `description` - Descrição
- ✅ `installment_total` - Número de parcelas
- ✅ `code` - Código (gerado automaticamente)
- ✅ `original_value` - Será calculado (parcelas × valor_parcela)
- ✅ `remaining_value` - Valor restante (gerenciado pelo sistema)
- ✅ `status` - Status (gerenciado automaticamente)
- ✅ `registration_date` - Data de cadastro (automático)
- ✅ `created_at`, `updated_at` - Timestamps (automáticos)

### Campos a REMOVER:
- ❌ `counterparty` - Contraparte/Fornecedor
- ❌ `person_id` - Vínculo com pessoa
- ❌ `company_id` - Vínculo com empresa
- ❌ `contract_id` - Vínculo com contrato
- ❌ `installment_current` - Parcela atual (será calculado automaticamente)
- ❌ `notes` - Observações

---

## 🗂️ ARQUIVOS AFETADOS

### 1. Banco de Dados
- `supabase/migrations/` - Nova migration para alterar tabela

### 2. Server Actions
- `app/actions/payables.ts` - Atualizar schemas e lógica de criação

### 3. Components - Formulários
- `components/financial/account-form-dialog.tsx` - Simplificar formulário de criação
- `components/financial/edit-payable-dialog.tsx` - Simplificar formulário de edição

### 4. Components - Visualização
- `components/financial/accounts-payable-table.tsx` - Remover colunas desnecessárias
- `components/financial/delete-account-dialog.tsx` - Atualizar informações exibidas

### 5. Types
- `lib/types.ts` - Atualizar interface AccountPayable

---

## 🔧 ROTEIRO DE IMPLEMENTAÇÃO

### **ETAPA 1: Backup e Preparação** ⏱️ 15 min

#### 1.1. Backup do Banco de Dados
```bash
# Exportar dados existentes (se houver)
```

#### 1.2. Verificar Estado Atual
- [ ] Confirmar que não há contas a pagar cadastradas (já verificado: 0 registros)
- [ ] Listar todas as migrations existentes
- [ ] Documentar estrutura atual

---

### **ETAPA 2: Migração do Banco de Dados** ⏱️ 30 min

#### 2.1. Criar Migration para Remover Campos

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_simplify_accounts_payable.sql`

```sql
-- =====================================================
-- MIGRATION: Simplificar Contas a Pagar
-- Data: 06/01/2026
-- Descrição: Remove campos desnecessários e adiciona 
--            campo valor_parcela
-- =====================================================

-- 1. Adicionar novo campo valor_parcela
ALTER TABLE public.accounts_payable
ADD COLUMN IF NOT EXISTS installment_value NUMERIC(12,2);

-- 2. Tornar campos opcionais (nullable) antes de remover
ALTER TABLE public.accounts_payable
ALTER COLUMN counterparty DROP NOT NULL;

-- 3. Remover foreign keys relacionadas
ALTER TABLE public.accounts_payable
DROP CONSTRAINT IF EXISTS accounts_payable_person_id_fkey;

ALTER TABLE public.accounts_payable
DROP CONSTRAINT IF EXISTS accounts_payable_company_id_fkey;

ALTER TABLE public.accounts_payable
DROP CONSTRAINT IF EXISTS accounts_payable_contract_id_fkey;

-- 4. Remover colunas desnecessárias
ALTER TABLE public.accounts_payable
DROP COLUMN IF EXISTS counterparty,
DROP COLUMN IF EXISTS person_id,
DROP COLUMN IF EXISTS company_id,
DROP COLUMN IF EXISTS contract_id,
DROP COLUMN IF EXISTS installment_current,
DROP COLUMN IF EXISTS notes;

-- 5. Adicionar comentários explicativos
COMMENT ON COLUMN public.accounts_payable.installment_value IS 'Valor de cada parcela (original_value será calculado como installment_total × installment_value)';

-- 6. Atualizar função de criação de parcelas (se necessário)
-- A lógica de parcelamento agora será:
-- - installment_total: quantas parcelas
-- - installment_value: valor de cada parcela
-- - original_value = installment_total × installment_value
-- - due_date incrementado mensalmente para cada parcela

```

#### 2.2. Executar Migration
```bash
# Aplicar via MCP do Supabase ou Supabase CLI
supabase db push
```

#### 2.3. Validar Migration
- [ ] Verificar estrutura da tabela
- [ ] Confirmar que triggers ainda funcionam
- [ ] Testar geração de código automático

---

### **ETAPA 3: Atualizar Types TypeScript** ⏱️ 15 min

#### 3.1. Atualizar Interface AccountPayable

**Arquivo:** `lib/types.ts`

**ANTES:**
```typescript
export interface AccountPayable {
  id: string
  code: string
  contract_id?: string | null
  person_id?: string | null
  company_id?: string | null
  description: string
  counterparty: string
  original_value: number
  remaining_value: number
  due_date: string | Date
  registration_date: string | Date
  status: 'em_aberto' | 'vencido' | 'parcialmente_pago' | 'quitado' | 'cancelado'
  vinculo: string
  centro_custo: string
  installment_current?: number | null
  installment_total?: number | null
  notes?: string | null
  created_by?: string
  created_at: string
  updated_at: string
}
```

**DEPOIS:**
```typescript
export interface AccountPayable {
  id: string
  code: string // Gerado automaticamente: CP-AANNNN
  description: string
  original_value: number // Calculado: installment_total × installment_value
  remaining_value: number // Gerenciado automaticamente
  due_date: string | Date
  registration_date: string | Date
  status: 'em_aberto' | 'vencido' | 'parcialmente_pago' | 'quitado' | 'cancelado'
  vinculo: string
  centro_custo: string
  installment_total?: number | null // Número de parcelas
  installment_value?: number | null // Valor de cada parcela
  created_by?: string
  created_at: string
  updated_at: string
}
```

---

### **ETAPA 4: Atualizar Server Actions** ⏱️ 45 min

#### 4.1. Atualizar Schema de Validação

**Arquivo:** `app/actions/payables.ts`

**ANTES:**
```typescript
const accountPayableSchema = z.object({
  contract_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  counterparty: z.string().min(3, 'Contraparte deve ter no mínimo 3 caracteres'),
  original_value: z.number().positive('Valor deve ser maior que zero'),
  due_date: z.string().or(z.date()),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  installment_current: z.number().int().positive().optional().nullable(),
  installment_total: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})
```

**DEPOIS:**
```typescript
const accountPayableSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  installment_value: z.number().positive('Valor da parcela deve ser maior que zero'),
  due_date: z.string().or(z.date()),
  vinculo: z.string().min(1, 'Vínculo é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  installment_total: z.number().int().positive('Número de parcelas deve ser maior que zero').default(1),
})
```

#### 4.2. Atualizar Lógica de Criação de Conta

**Arquivo:** `app/actions/payables.ts` - Função `createAccountPayable`

```typescript
export async function createAccountPayable(
  data: AccountPayableFormData
): Promise<ActionResult> {
  try {
    const validatedData = accountPayableSchema.parse(data)
    const supabase = await createClient()

    // Autenticação e permissões (manter)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return { success: false, error: 'Sem permissão para criar contas a pagar' }
    }

    // NOVA LÓGICA: Calcular valor total
    const originalValue = validatedData.installment_value * validatedData.installment_total

    // Criar conta única ou múltiplas parcelas
    if (validatedData.installment_total === 1) {
      // CONTA ÚNICA
      const { data: account, error } = await supabase
        .from('accounts_payable')
        .insert({
          description: validatedData.description,
          original_value: originalValue,
          remaining_value: originalValue,
          due_date: validatedData.due_date,
          vinculo: validatedData.vinculo,
          centro_custo: validatedData.centro_custo,
          installment_total: 1,
          installment_value: validatedData.installment_value,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar conta:', error)
        return { success: false, error: 'Erro ao criar conta a pagar' }
      }

      revalidatePath('/financeiro/contas-pagar')
      return { success: true, data: account }
    } else {
      // MÚLTIPLAS PARCELAS
      const accounts = []
      const baseDate = new Date(validatedData.due_date)

      for (let i = 0; i < validatedData.installment_total; i++) {
        const dueDate = new Date(baseDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        accounts.push({
          description: `${validatedData.description} - Parcela ${i + 1}/${validatedData.installment_total}`,
          original_value: validatedData.installment_value,
          remaining_value: validatedData.installment_value,
          due_date: dueDate.toISOString().split('T')[0],
          vinculo: validatedData.vinculo,
          centro_custo: validatedData.centro_custo,
          installment_total: validatedData.installment_total,
          installment_value: validatedData.installment_value,
          created_by: user.id,
        })
      }

      const { data: createdAccounts, error } = await supabase
        .from('accounts_payable')
        .insert(accounts)
        .select()

      if (error) {
        console.error('Erro ao criar parcelas:', error)
        return { success: false, error: 'Erro ao criar parcelas' }
      }

      revalidatePath('/financeiro/contas-pagar')
      return { 
        success: true, 
        data: createdAccounts,
        message: `${validatedData.installment_total} parcelas criadas com sucesso`
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos',
        fieldErrors: formatZodError(error),
      }
    }
    console.error('Erro ao criar conta:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}
```

#### 4.3. Atualizar Função de Edição

**Arquivo:** `app/actions/payables.ts` - Função `updateAccountPayable`

- Remover campos `counterparty`, `person_id`, `company_id`, `notes` da validação
- Manter apenas: `description`, `due_date`, `vinculo`, `centro_custo`
- Não permitir editar `installment_value` ou `installment_total` após criação

---

### **ETAPA 5: Atualizar Componente de Criação** ⏱️ 45 min

#### 5.1. Simplificar Formulário de Criação

**Arquivo:** `components/financial/account-form-dialog.tsx`

**Remover:**
- Seleção de pessoa/empresa (counterparty)
- Campo de observações (notes)
- Campo `installment_current`

**Manter/Adicionar:**
- Descrição
- Valor da Parcela (novo campo)
- Vencimento da 1ª Parcela
- Vínculo
- Centro de Custo
- Número de Parcelas (default: 1)

**Novo Formulário:**
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Descrição */}
  <div className="space-y-2">
    <Label htmlFor="description">Descrição *</Label>
    <Textarea
      id="description"
      placeholder="Ex: Fornecimento de Material de Construção"
      required
      value={formData.description}
      onChange={(e) => handleChange("description", e.target.value)}
      rows={2}
    />
  </div>

  {/* Vencimento */}
  <div className="space-y-2">
    <Label htmlFor="due_date">Vencimento da 1ª Parcela *</Label>
    <Input
      id="due_date"
      type="date"
      required
      value={formData.due_date}
      onChange={(e) => handleChange("due_date", e.target.value)}
    />
  </div>

  {/* Vínculo e Centro de Custo */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="vinculo">Vínculo *</Label>
      <Select 
        value={formData.vinculo} 
        onValueChange={(value) => handleChange("vinculo", value)} 
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecionar vínculo" />
        </SelectTrigger>
        <SelectContent>
          {mockVinculos.map((vinculo) => (
            <SelectItem key={vinculo} value={vinculo}>
              {vinculo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="centro_custo">Centro de Custo *</Label>
      <Select 
        value={formData.centro_custo} 
        onValueChange={(value) => handleChange("centro_custo", value)} 
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecionar centro de custo" />
        </SelectTrigger>
        <SelectContent>
          {mockCentrosCusto.map((centro) => (
            <SelectItem key={centro} value={centro}>
              {centro}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Número de Parcelas e Valor */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="installment_total">Número de Parcelas *</Label>
      <Input
        id="installment_total"
        type="number"
        min="1"
        required
        value={formData.installment_total || 1}
        onChange={(e) => handleChange("installment_total", parseInt(e.target.value) || 1)}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="installment_value">Valor da Parcela (R$) *</Label>
      <Input
        id="installment_value"
        type="number"
        step="0.01"
        min="0.01"
        required
        value={formData.installment_value || ""}
        onChange={(e) => handleChange("installment_value", parseFloat(e.target.value) || 0)}
      />
    </div>
  </div>

  {/* Exibir Valor Total Calculado */}
  <div className="rounded-lg bg-muted p-3 space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">Valor Total:</span>
      <span className="font-semibold">
        {formatCurrency((formData.installment_total || 1) * (formData.installment_value || 0))}
      </span>
    </div>
    {formData.installment_total > 1 && (
      <p className="text-xs text-muted-foreground">
        {formData.installment_total} parcelas de {formatCurrency(formData.installment_value || 0)}
      </p>
    )}
  </div>

  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Cancelar
    </Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? "Criando..." : "Criar Conta"}
    </Button>
  </DialogFooter>
</form>
```

---

### **ETAPA 6: Atualizar Componente de Edição** ⏱️ 30 min

#### 6.1. Simplificar Formulário de Edição

**Arquivo:** `components/financial/edit-payable-dialog.tsx`

**Permitir editar apenas:**
- Descrição
- Vencimento
- Vínculo
- Centro de Custo

**NÃO permitir editar:**
- Código (gerado automaticamente)
- Valor da Parcela (fixo após criação)
- Número de Parcelas (fixo após criação)

---

### **ETAPA 7: Atualizar Tabela de Visualização** ⏱️ 20 min

#### 7.1. Ajustar Colunas da Tabela

**Arquivo:** `components/financial/accounts-payable-table.tsx`

**Colunas a manter:**
1. Código
2. Vencimento
3. Vínculo
4. Centro de Custo
5. Descrição
6. Valor Restante
7. Status (badge)
8. Ações

**Remover:**
- Coluna "Data de Registro"
- Referências a counterparty

---

### **ETAPA 8: Corrigir Dialogs de Pagamento** ⏱️ 30 min

#### 8.1. Corrigir PayDialog

**Arquivo:** `components/financial/pay-dialog.tsx`

**Substituir:**
```typescript
// ANTES
<Input value={formatCurrency(account.value)} disabled />

// DEPOIS
<Input value={formatCurrency(account.remaining_value)} disabled />
```

#### 8.2. Corrigir PartialPayDialog

**Arquivo:** `components/financial/partial-pay-dialog.tsx`

**Substituir todas as 6 ocorrências de `account.value` por `account.remaining_value`**

---

### **ETAPA 9: Testes** ⏱️ 45 min

#### 9.1. Testes de Criação
- [ ] Criar conta com 1 parcela
- [ ] Criar conta com 3 parcelas
- [ ] Criar conta com 12 parcelas
- [ ] Verificar códigos gerados (CP-260001, CP-260002...)
- [ ] Verificar cálculo de valor total
- [ ] Verificar vencimentos incrementados mensalmente

#### 9.2. Testes de Edição
- [ ] Editar descrição
- [ ] Editar vencimento
- [ ] Editar vínculo e centro de custo
- [ ] Confirmar que código não pode ser alterado

#### 9.3. Testes de Pagamento
- [ ] Pagar conta integral
- [ ] Pagar conta parcialmente
- [ ] Verificar atualização de remaining_value
- [ ] Verificar mudança de status automática
- [ ] Verificar criação de transação no caixa

#### 9.4. Testes de Filtros
- [ ] Filtrar por vencimento
- [ ] Filtrar por status
- [ ] Filtrar por vínculo
- [ ] Filtrar por centro de custo
- [ ] Buscar por descrição

---

### **ETAPA 10: Validação Final e Deploy** ⏱️ 30 min

#### 10.1. Checklist Final
- [ ] Todos os testes passaram
- [ ] Não há erros no console
- [ ] Triggers funcionando corretamente
- [ ] Performance OK (verificar queries)
- [ ] Documentação atualizada

#### 10.2. Deploy
- [ ] Commit das alterações
- [ ] Push para repositório
- [ ] Deploy em produção
- [ ] Monitorar logs por 24h

---

## ⚠️ PONTOS DE ATENÇÃO

### Possíveis Problemas:

1. **Trigger de Atualização de Status**
   - Verificar se continua funcionando após remover campos
   - Testar trigger `update_payable_remaining_value`

2. **Relacionamentos Existentes**
   - Se houver dados em produção, criar script de migração de dados
   - Manter backup antes de remover foreign keys

3. **Integração com Caixa**
   - Verificar que transações de pagamento continuam funcionando
   - Validar que saldo bancário é verificado corretamente

4. **Parcelamento**
   - Garantir que vencimentos são incrementados corretamente
   - Validar que códigos únicos são gerados para cada parcela

---

## 📝 RESUMO DAS MUDANÇAS

### Antes: 12 campos obrigatórios
```
1. Código (automático)
2. Descrição
3. Contraparte (pessoa/empresa)
4. Valor Total
5. Vencimento
6. Vínculo
7. Centro de Custo
8. Data de Registro
9. Status
10. Parcela Atual
11. Total de Parcelas
12. Observações
```

### Depois: 6 campos de entrada
```
1. Descrição
2. Vencimento da 1ª Parcela
3. Vínculo
4. Centro de Custo
5. Número de Parcelas
6. Valor da Parcela

Campos automáticos:
- Código (CP-AANNNN)
- Valor Total (calculado)
- Valor Restante (gerenciado)
- Status (automático)
- Data de Registro (automático)
```

---

## 🎯 CRITÉRIOS DE SUCESSO

- ✅ Formulário com apenas 6 campos de entrada
- ✅ Cálculo automático de valor total
- ✅ Parcelamento funcionando (1 a N parcelas)
- ✅ Vencimentos incrementados mensalmente
- ✅ Triggers de atualização funcionando
- ✅ Pagamentos (total e parcial) operacionais
- ✅ Performance mantida ou melhorada
- ✅ Zero erros de validação no TypeScript

---

## 📞 SUPORTE

Em caso de dúvidas durante a implementação:
1. Consultar este roteiro
2. Verificar logs do Supabase
3. Testar em ambiente de desenvolvimento primeiro
4. Criar backup antes de cada etapa crítica

---

**FIM DO ROTEIRO**
