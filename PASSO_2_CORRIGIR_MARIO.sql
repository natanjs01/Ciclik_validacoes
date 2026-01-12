-- ========================================
-- PASSO 2: Corrigir role do usuário Mário
-- ========================================
-- ⚠️ IMPORTANTE: Só execute DEPOIS do PASSO 1 ter sido executado com sucesso!
-- ⚠️ UUID: 1aa8ada4-e194-43a4-be86-0cdd01352d77
-- ⚠️ Email: tiagofreitasdelacerda@outlook.com

-- Atualizar role de 'usuario' para 'investidor'
UPDATE user_roles
SET role = 'investidor'::app_role
WHERE user_id = '1aa8ada4-e194-43a4-be86-0cdd01352d77'
  AND role = 'usuario'::app_role;

-- Verificar se foi atualizado corretamente
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
-- Deve mostrar:
-- role = 'investidor'
-- nome = 'Mário'
-- email = 'tiagofreitasdelacerda@outlook.com'
--
-- ✅ Após isso:
-- 1. Usuário Mário faz logout
-- 2. Faz login novamente
-- 3. Será redirecionado para /cdv/investor
