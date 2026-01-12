# Implementação de Periodicidade e Novo Sistema de Códigos - Contas a Pagar

## Resumo das Mudanças

Implementação completa de um novo sistema de parcelamento com periodicidade personalizável e novo formato de códigos para contas a pagar.

## ✅ Mudanças Implementadas

### 1. **Banco de Dados**

#### 1.1 Novos Campos
- `periodicity`: Campo ENUM com valores 'semanal', 'mensal', 'anual'
- `installment_group_id`: UUID para vincular parcelas do mesmo grupo

```sql
ALTER TABLE accounts_payable 
  ADD COLUMN periodicity TEXT CHECK (periodicity IN ('semanal', 'mensal', 'anual')),
  ADD COLUMN installment_group_id UUID;

CREATE INDEX idx_accounts_payable_installment_group ON accounts_payable(installment_group_id);
```

#### 1.2 Novo Formato de Código

**Formato Antigo:** `CP-AANNNN` (CP + Ano + Sequencial)
- Exemplo: CP-250001, CP-250002

**Novo Formato:** `CP-00001.N` (CP + Sequencial de 5 dígitos + Número da Parcela)
- Exemplo: CP-00001.1, CP-00001.2, CP-00001.3
- Escalável além de CP-99999
- Parcelas do mesmo grupo compartilham o mesmo número base
- Número após o ponto indica a parcela

#### 1.3 Trigger de Geração de Código

Novo trigger `set_payable_code()`:
- Gera código base sequencial para novo grupo de parcelas
- Mantém mesmo código base para parcelas do mesmo grupo
- Incrementa apenas o número após o ponto (.1, .2, .3, etc.)
- Conta avulsa (sem grupo) recebe código com .1

#### 1.4 Trigger de Deleção em Cascata

Novo trigger `delete_installment_group_trigger`:
- Ao deletar qualquer parcela de um grupo, todas as outras são deletadas automaticamente
- Usa `AFTER DELETE` para evitar recursão
- Baseado no `installment_group_id`

### 2. **TypeScript Types**

Atualização em `lib/types.ts`:

```typescript
export interface AccountPayable {
  // ... campos existentes
  periodicity?: 'semanal' | 'mensal' | 'anual' | null
  installment_group_id?: string | null
}
```

### 3. **Schema de Validação (Zod)**

Atualização em `app/actions/payables.ts`:

```typescript
const accountPayableSchema = z.object({
  // ... campos existentes
  periodicity: z.enum(['semanal', 'mensal', 'anual']).default('mensal'),
})
```

### 4. **Lógica de Criação**

#### 4.1 Conta Única (1 parcela)
- Cria apenas 1 registro
- Recebe código no formato CP-00001.1
- Não usa `installment_group_id`
- Periodicidade é salva mas não afeta criação

#### 4.2 Múltiplas Parcelas
- Gera um UUID único para `installment_group_id`
- Aplica periodicidade no cálculo das datas:
  - **Semanal**: +7 dias entre parcelas
  - **Mensal**: +1 mês entre parcelas
  - **Anual**: +1 ano entre parcelas
- Todas as parcelas compartilham o mesmo código base
- Parcelas são numeradas sequencialmente (.1, .2, .3, etc.)

```typescript
for (let i = 0; i < validatedData.installment_total; i++) {
  const dueDate = new Date(baseDate)
  
  switch (validatedData.periodicity) {
    case 'semanal':
      dueDate.setDate(dueDate.getDate() + (i * 7))
      break
    case 'mensal':
      dueDate.setMonth(dueDate.getMonth() + i)
      break
    case 'anual':
      dueDate.setFullYear(dueDate.getFullYear() + i)
      break
  }
  
  // ... criação da parcela com installment_group_id
}
```

### 5. **Interface do Usuário**

Atualização em `components/financial/account-form-dialog.tsx`:

#### 5.1 Novo Campo de Periodicidade
- Aparece **apenas quando** `installment_total > 1`
- Seletor com 3 opções:
  - Semanal (a cada 7 dias)
  - Mensal (a cada 30 dias)
  - Anual (a cada 12 meses)
- Valor padrão: "mensal"

```tsx
{formData.installment_total > 1 && (
  <div className="space-y-2">
    <Label htmlFor="periodicity">Periodicidade *</Label>
    <Select 
      value={formData.periodicity} 
      onValueChange={(value) => handleChange("periodicity", value as 'semanal' | 'mensal' | 'anual')}
    >
      <SelectItem value="semanal">Semanal (a cada 7 dias)</SelectItem>
      <SelectItem value="mensal">Mensal (a cada 30 dias)</SelectItem>
      <SelectItem value="anual">Anual (a cada 12 meses)</SelectItem>
    </Select>
  </div>
)}
```

## 📊 Exemplos de Uso

### Exemplo 1: Conta Única
```
Input:
- Descrição: Fornecimento de Material
- Valor: R$ 500,00
- Parcelas: 1
- Vencimento: 15/01/2026

Output:
- Código: CP-00001.1
- Periodicidade: mensal (salvo mas não usado)
- installment_group_id: NULL
```

### Exemplo 2: 3 Parcelas Mensais
```
Input:
- Descrição: Compra de Equipamentos
- Valor por parcela: R$ 200,00
- Parcelas: 3
- Periodicidade: Mensal
- Vencimento 1ª parcela: 15/01/2026

Output:
3 contas criadas:
1. CP-00002.1 - R$ 200 - Venc: 15/01/2026
2. CP-00002.2 - R$ 200 - Venc: 15/02/2026
3. CP-00002.3 - R$ 200 - Venc: 15/03/2026

Todas com mesmo installment_group_id
```

### Exemplo 3: 4 Parcelas Semanais
```
Input:
- Descrição: Aluguel de Equipamento
- Valor por parcela: R$ 150,00
- Parcelas: 4
- Periodicidade: Semanal
- Vencimento 1ª parcela: 15/01/2026

Output:
4 contas criadas:
1. CP-00003.1 - R$ 150 - Venc: 15/01/2026
2. CP-00003.2 - R$ 150 - Venc: 22/01/2026
3. CP-00003.3 - R$ 150 - Venc: 29/01/2026
4. CP-00003.4 - R$ 150 - Venc: 05/02/2026

Todas com mesmo installment_group_id
```

### Exemplo 4: 2 Parcelas Anuais
```
Input:
- Descrição: Licença Anual de Software
- Valor por parcela: R$ 1.200,00
- Parcelas: 2
- Periodicidade: Anual
- Vencimento 1ª parcela: 01/03/2026

Output:
2 contas criadas:
1. CP-00004.1 - R$ 1.200 - Venc: 01/03/2026
2. CP-00004.2 - R$ 1.200 - Venc: 01/03/2027

Todas com mesmo installment_group_id
```

## 🗑️ Deleção em Cascata

### Comportamento
Ao deletar **qualquer** parcela de um grupo:
- Todas as outras parcelas do mesmo grupo são automaticamente deletadas
- Baseado no `installment_group_id`
- Executado via trigger `AFTER DELETE`

### Exemplo
```
Estado Inicial:
- CP-00001.1
- CP-00001.2
- CP-00001.3

Ação: DELETE FROM accounts_payable WHERE code = 'CP-00001.2'

Estado Final:
- (todas as parcelas deletadas)
```

## 🔄 Escalabilidade

O novo sistema de códigos suporta:
- **Base numérica**: CP-00001 até CP-99999 (99.999 grupos)
- **Parcelas por grupo**: Ilimitadas (.1, .2, .3, ..., .999, etc.)
- **Total de contas**: Potencialmente milhões

Se necessário expandir além de CP-99999:
- Modificar `LPAD((max_base_number + 1)::TEXT, 5, '0')` para usar 6 ou mais dígitos
- Exemplo: `LPAD(..., 6, '0')` → CP-000001.1 até CP-999999.1

## ✅ Testes Realizados

### 1. Geração de Código
- ✅ Grupo de 3 parcelas: CP-00001.1, CP-00001.2, CP-00001.3
- ✅ Códigos sequenciais para múltiplos grupos
- ✅ Conta única recebe formato correto com .1

### 2. Periodicidade
- ✅ Semanal: +7 dias entre parcelas
- ✅ Mensal: +1 mês entre parcelas
- ✅ Anual: +1 ano entre parcelas

### 3. Deleção em Cascata
- ✅ Deletar parcela 2 remove todas as parcelas do grupo
- ✅ Sem loop infinito
- ✅ Trigger AFTER DELETE funciona corretamente

## 📝 Migrations Aplicadas

1. `add_periodicity_and_installment_group` - Adiciona novos campos
2. `recreate_payable_code_trigger_new_format_v2` - Novo sistema de códigos
3. `fix_payable_code_trigger_group_by` - Correção de erro GROUP BY
4. `fix_cascade_delete_trigger` - Trigger de deleção sem recursão

## 🚀 Próximos Passos (Opcional)

1. Adicionar filtro de periodicidade na listagem de contas
2. Exibir indicador visual de grupo de parcelas
3. Permitir edição de periodicidade (recriar parcelas)
4. Relatório de parcelas agrupadas
5. Migração de dados antigos (CP-AANNNN → CP-00001.1)

## 📌 Notas Importantes

- **Contas antigas** com formato CP-AANNNN continuam funcionando normalmente
- **Novas contas** sempre usam o novo formato CP-00001.N
- O sistema detecta automaticamente o formato pelo regex `^CP-[0-9]+\.[0-9]+$`
- Periodicidade é **obrigatória** apenas quando `installment_total > 1`
- Valor padrão de periodicidade: `'mensal'`

---

**Data de Implementação:** 07/01/2026  
**Desenvolvedor:** GitHub Copilot  
**Status:** ✅ Concluído e Testado
