-- ========================================
-- PASSO 1: Adicionar 'investidor' ao enum app_role
-- ========================================
-- IMPORTANTE: Execute isso PRIMEIRO antes de qualquer UPDATE

-- Adicionar o valor 'investidor' ao enum app_role se não existir
DO $$ 
BEGIN
    -- Verificar se o valor já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'investidor' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'app_role'
        )
    ) THEN
        -- Adicionar o valor
        ALTER TYPE app_role ADD VALUE 'investidor';
        RAISE NOTICE '✅ Valor investidor adicionado ao enum app_role';
    ELSE
        RAISE NOTICE 'ℹ️  Valor investidor já existe no enum app_role';
    END IF;
END $$;

-- Verificar valores do enum app_role
SELECT 
    enumlabel as valor_enum,
    enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
ORDER BY enumsortorder;

-- ========================================
-- PASSO 2: Corrigir role do usuário Mário
-- ========================================

-- Atualizar role de 'usuario' para 'investidor'
UPDATE user_roles
SET role = 'investidor'::app_role
WHERE user_id = '1aa8ada4-e194-43a4-be86-0cdd01352d77'
  AND role = 'usuario'::app_role;

-- ========================================
-- PASSO 3: Verificar se foi atualizado
-- ========================================

SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    p.nome,
    p.email
FROM user_roles ur
LEFT JOIN profiles p ON p.id = ur.user_id
WHERE ur.user_id = '1aa8ada4-e194-43a4-be86-0cdd01352d77';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Deve mostrar apenas 1 linha:
-- role = 'investidor'
-- nome = 'Mário'
-- email = 'tiagofreitasdelacerda@outlook.com'
