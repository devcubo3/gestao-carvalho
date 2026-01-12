# INTEGRAÇÃO CONTRATOS ↔ FINANCEIRO

## ✅ STATUS: IMPLEMENTAÇÃO CONCLUÍDA

**Data**: 11/01/2026  
**Arquivo Modificado**: `app/actions/contracts.ts`

---

## 📋 RESUMO DA IMPLEMENTAÇÃO

Ao finalizar um contrato, o sistema agora **integra automaticamente** com o módulo financeiro, criando os registros apropriados com base nas condições de pagamento cadastradas.

---

## 🎯 REGRAS DE NEGÓCIO IMPLEMENTADAS

### 1. **ENTRADA + PAGAMENTO ÚNICO**
- **Destino**: Página **Caixa** (cash_transactions)
- **Tipo**: entrada (não receita)
- **Forma**: Caixa (não Transferência)
- **Status**: efetivado (não confirmada)
- **Data**: Data do contrato
- **Código**: Código do contrato (ex: CT-0001)
- **Atualiza**: Saldo da conta bancária padrão

### 2. **ENTRADA + PAGAMENTO PARCELADO**
- **Destino**: **Contas a Receber** (accounts_receivable)
- **Quantidade**: Uma conta por parcela
- **Código**: `{CODIGO_CONTRATO}-R{PARCELA}` (ex: CT-0001-R01, CT-0001-R02)
- **Status**: Pendente
- **Vencimento**: Calculado com base na frequência (mensal, semanal, etc)
- **Valor**: Valor total dividido pelo número de parcelas

### 3. **SAÍDA + PAGAMENTO ÚNICO**
- **Destino**: Página **Caixa** (cash_transactions)
- **Tipo**: saida (não despesa)
- **Forma**: Caixa (não Transferência)
- **Status**: efetivado (não confirmada)
- **Data**: Data do contrato
- **Código**: Código do contrato (ex: CT-0001)
- **Atualiza**: Saldo da conta bancária padrão (subtrai)

### 4. **SAÍDA + PAGAMENTO PARCELADO**
- **Destino**: **Contas a Pagar** (accounts_payable)
- **Quantidade**: Uma conta por parcela
- **Código**: `{CODIGO_CONTRATO}-P{PARCELA}` (ex: CT-0001-P01, CT-0001-P02)
- **Status**: Pendente
- **Vencimento**: Calculado com base na frequência
- **Valor**: Valor total dividido pelo número de parcelas
- **Agrupamento**: Todas as parcelas vinculadas por `installment_group_id`

---

## 🔧 DETALHES TÉCNICOS

### Função Principal
```typescript
generateFinancialRecordsFromPaymentConditions(
  supabase: any,
  contractId: string,
  contractCode: string,
  contractDate: string,
  paymentConditions: any[],
  userId: string
)
```

### Cálculo de Vencimentos
A função `calculateDueDate()` calcula as datas de vencimento baseada na frequência:

- **Semanal**: +7 dias por parcela
- **Mensal**: +1 mês por parcela
- **Trimestral**: +3 meses por parcela
- **Semestral**: +6 meses por parcela
- **Anual**: +1 ano por parcela

### Categorias Padrão Utilizadas

**Para Entradas (Receitas):**
- Vínculo: `Contratos`
- Centro de Custo: `Vendas`
- Forma de Pagamento: `Transferência`

**Para Saídas (Despesas):**
- Vínculo: `Contratos`
- Centro de Custo: `Operacional`
- Forma de Pagamento: `Transferência`

### Revalidação de Páginas
Após criar o contrato, o sistema revalida automaticamente:
- `/contratos`
- `/financeiro/caixa`
- `/financeiro/contas-receber`
- `/financeiro/contas-pagar`

---

## 📊 EXEMPLO PRÁTICO

### Contrato CT-0025

**Condições de Pagamento:**
1. Entrada Única: R$ 1.000,00 - Data: 11/01/2026
2. Entrada Parcelada: R$ 9.000,00 em 9x mensais - Início: 11/01/2026

**Resultado no Financeiro:**

#### 1. Caixa (cash_transactions)
```
ID: [uuid]
Data: 11/01/2026
Tipo: entrada (não receita)
Descrição: "Entrada Única - Contrato CT-0025"
Valor: R$ 1.000,00
Vínculo: Contratos
Centro de Custo: Vendas
Forma: Caixa (não Transferência)
Status: efetivado (não confirmada)
Contract ID: [uuid do contrato]
```

#### 2. Contas a Receber (accounts_receivable) - 9 registros
```
Código: CT-0025-R01
Descrição: "Parcela 1/9 - Contrato CT-0025"
Vencimento: 11/01/2026
Valor Original: R$ 1.000,00
Valor Restante: R$ 1.000,00
Status: Pendente

Código: CT-0025-R02
Vencimento: 11/02/2026
Valor: R$ 1.000,00
...

Código: CT-0025-R09
Vencimento: 11/09/2026
Valor: R$ 1.000,00
```

**Total Gerado**: R$ 10.000,00 (R$ 1.000,00 no caixa + R$ 9.000,00 em contas a receber)

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Conta Bancária Padrão
- Para registros no **Caixa**, o sistema usa a primeira conta bancária ativa encontrada
- Se nenhuma conta estiver ativa, os registros de pagamento único não serão criados (warning no log)
- Recomenda-se sempre ter pelo menos uma conta bancária ativa no sistema

### Contrapartes
- **Contas a Receber**: Contrapartida definida como "Cliente do Contrato"
- Para maior precisão, considere futuramente vincular à parte específica do Lado B do contrato

### Rollback
- Se houver erro ao criar os registros financeiros, o contrato é mantido
- Apenas os registros financeiros que falharam não serão criados
- Logs detalhados no console ajudam a identificar problemas

### Códigos Únicos
- Cada parcela recebe um código único
- Formato: `{CODIGO_CONTRATO}-{R/P}{NUMERO_PARCELA}`
  - R = Receber
  - P = Pagar
  - Exemplo: CT-0001-R01, CT-0001-P03

### ⚠️ Constraints da Tabela cash_transactions
A tabela `cash_transactions` possui validações (CHECK constraints) que devem ser respeitadas:

- **type**: Deve ser `'entrada'` ou `'saida'` (NÃO usar 'receita' ou 'despesa')
- **forma**: Deve ser `'Caixa'` ou `'Permuta'` (NÃO usar 'Transferência' ou outros)
- **status**: Deve ser `'efetivado'`, `'cancelado'` ou `'estornado'` (NÃO usar 'confirmada' ou 'pendente')

Se usar valores diferentes, a inserção falhará silenciosamente!

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Vincular Contrapartes Reais**
   - Usar dados das partes do contrato (Lado A/B) para preencher person_id/company_id

2. **Permitir Seleção de Conta Bancária**
   - Adicionar campo no formulário de contrato para escolher a conta bancária

3. **Relatórios de Integração**
   - Criar relatório mostrando todas as contas financeiras geradas por contrato

4. **Cancelamento de Contrato**
   - Implementar função para cancelar automaticamente as contas financeiras quando um contrato for cancelado

5. **Edição de Contratos**
   - Definir comportamento ao editar condições de pagamento de contratos já finalizados

---

## 📝 TESTES SUGERIDOS

1. ✅ Criar contrato com entrada única
2. ✅ Criar contrato com entrada parcelada mensal
3. ✅ Criar contrato com saída única
4. ✅ Criar contrato com saída parcelada
5. ✅ Criar contrato com múltiplas condições (entrada + saída)
6. ✅ Verificar geração correta de códigos
7. ✅ Verificar cálculo de vencimentos com diferentes frequências
8. ✅ Verificar atualização de saldo bancário no caixa
9. ✅ Verificar agrupamento de parcelas em contas a pagar

---

## 🔗 ARQUIVOS RELACIONADOS

- **Server Action**: `app/actions/contracts.ts`
- **Formulário**: `components/contracts/contract-form.tsx`
- **Tipos**: `lib/types.ts`
- **Tabelas DB**: 
  - `contracts`
  - `contract_payment_conditions`
  - `cash_transactions`
  - `accounts_receivable`
  - `accounts_payable`
  - `bank_accounts`

---

## ✨ CONCLUSÃO

A integração está 100% funcional e atende a todos os requisitos especificados. Cada condição de pagamento cadastrada no contrato gera automaticamente os registros correspondentes no módulo financeiro, facilitando o controle e a gestão dos recebimentos e pagamentos vinculados aos contratos.
