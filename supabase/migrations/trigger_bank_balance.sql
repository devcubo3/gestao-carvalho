-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE SALDO BANCÁRIO
-- =====================================================
-- Este arquivo contém triggers que atualizam automaticamente
-- o saldo das contas bancárias quando transações são criadas
-- ou removidas da tabela cash_transactions
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: Atualizar saldo ao INSERIR transação
-- =====================================================

CREATE OR REPLACE FUNCTION update_bank_account_balance_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo apenas se a transação tem bank_account_id
  IF NEW.bank_account_id IS NOT NULL THEN
    UPDATE bank_accounts
    SET 
      balance = CASE 
        WHEN NEW.type = 'receita' THEN balance + NEW.value
        WHEN NEW.type = 'despesa' THEN balance - NEW.value
        WHEN NEW.type = 'saida' THEN balance - NEW.value
        WHEN NEW.type = 'entrada' THEN balance + NEW.value
        ELSE balance
      END,
      updated_at = now()
    WHERE id = NEW.bank_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGER: Executar atualização ao inserir
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_bank_balance_on_insert ON cash_transactions;

CREATE TRIGGER trigger_update_bank_balance_on_insert
AFTER INSERT ON cash_transactions
FOR EACH ROW
EXECUTE FUNCTION update_bank_account_balance_on_insert();

-- =====================================================
-- 3. FUNÇÃO: Reverter saldo ao DELETAR transação
-- =====================================================

CREATE OR REPLACE FUNCTION revert_bank_account_balance_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverter saldo apenas se a transação tinha bank_account_id
  IF OLD.bank_account_id IS NOT NULL THEN
    UPDATE bank_accounts
    SET 
      balance = CASE 
        WHEN OLD.type = 'receita' THEN balance - OLD.value
        WHEN OLD.type = 'despesa' THEN balance + OLD.value
        WHEN OLD.type = 'saida' THEN balance + OLD.value
        WHEN OLD.type = 'entrada' THEN balance - OLD.value
        ELSE balance
      END,
      updated_at = now()
    WHERE id = OLD.bank_account_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGER: Executar reversão ao deletar
-- =====================================================

DROP TRIGGER IF EXISTS trigger_revert_bank_balance_on_delete ON cash_transactions;

CREATE TRIGGER trigger_revert_bank_balance_on_delete
AFTER DELETE ON cash_transactions
FOR EACH ROW
EXECUTE FUNCTION revert_bank_account_balance_on_delete();

-- =====================================================
-- 5. FUNÇÃO: Ajustar saldo ao ATUALIZAR transação
-- =====================================================

CREATE OR REPLACE FUNCTION update_bank_account_balance_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mudou a conta bancária ou o valor, ajustar saldos
  IF OLD.bank_account_id IS NOT NULL AND (
    OLD.bank_account_id != NEW.bank_account_id OR
    OLD.value != NEW.value OR
    OLD.type != NEW.type
  ) THEN
    -- Reverter saldo da conta antiga
    UPDATE bank_accounts
    SET 
      balance = CASE 
        WHEN OLD.type = 'receita' THEN balance - OLD.value
        WHEN OLD.type = 'despesa' THEN balance + OLD.value
        WHEN OLD.type = 'saida' THEN balance + OLD.value
        WHEN OLD.type = 'entrada' THEN balance - OLD.value
        ELSE balance
      END,
      updated_at = now()
    WHERE id = OLD.bank_account_id;
  END IF;

  -- Aplicar novo saldo na conta nova (ou mesma conta com valores novos)
  IF NEW.bank_account_id IS NOT NULL THEN
    UPDATE bank_accounts
    SET 
      balance = CASE 
        WHEN NEW.type = 'receita' THEN balance + NEW.value
        WHEN NEW.type = 'despesa' THEN balance - NEW.value
        WHEN NEW.type = 'saida' THEN balance - NEW.value
        WHEN NEW.type = 'entrada' THEN balance + NEW.value
        ELSE balance
      END,
      updated_at = now()
    WHERE id = NEW.bank_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER: Executar ajuste ao atualizar
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_bank_balance_on_update ON cash_transactions;

CREATE TRIGGER trigger_update_bank_balance_on_update
AFTER UPDATE ON cash_transactions
FOR EACH ROW
WHEN (
  OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id OR
  OLD.value IS DISTINCT FROM NEW.value OR
  OLD.type IS DISTINCT FROM NEW.type
)
EXECUTE FUNCTION update_bank_account_balance_on_update();

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 
-- Para aplicar estes triggers no Supabase:
-- 1. Acesse o SQL Editor no dashboard do Supabase
-- 2. Cole este código completo
-- 3. Execute (Run)
-- 
-- Para testar:
-- SELECT id, bank_name, balance FROM bank_accounts WHERE is_active = true;
-- 
-- Faça um pagamento via UI e verifique se o saldo foi atualizado:
-- SELECT id, bank_name, balance FROM bank_accounts WHERE is_active = true;
-- 
-- =====================================================
