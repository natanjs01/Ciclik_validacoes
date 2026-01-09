-- =========================================================
-- SCRIPT PARA DELETAR USUÁRIO DO SUPABASE
-- =========================================================
-- Data: 09 de Janeiro de 2026
-- Usuário: Natanael Bernardo da Silva
-- Email: natanjd01@gmail.com
-- UUID: c5de6aa5-5e4a-4c25-8086-aa53a5cff226
-- CPF: 068.701.614-29
-- =========================================================

-- ⚠️ ATENÇÃO: Este script deleta PERMANENTEMENTE um usuário e TODOS os seus dados!
-- Execute com MUITO CUIDADO em produção!

-- =========================================================
-- PASSO 1: Definir o UUID do usuário
-- =========================================================
DO $$
DECLARE
    v_user_id UUID := 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';
    v_email TEXT := 'natanjd01@gmail.com';
BEGIN
    RAISE NOTICE '🗑️ Iniciando deleção do usuário: %', v_email;
    RAISE NOTICE '📋 UUID: %', v_user_id;

    -- =========================================================
    -- PASSO 2: Deletar dados relacionados (CASCADE)
    -- =========================================================
    
    -- Deletar pontos mensais
    DELETE FROM pontos_mensais WHERE id_user = v_user_id;
    RAISE NOTICE '✅ Pontos mensais deletados';

    -- Deletar missões de usuário
    DELETE FROM user_missions WHERE id_user = v_user_id;
    RAISE NOTICE '✅ Missões de usuário deletadas';

    -- Deletar entregas de recicláveis
    DELETE FROM entregas_reciclaveis WHERE id_user = v_user_id;
    RAISE NOTICE '✅ Entregas de recicláveis deletadas';

    -- Deletar materiais coletados detalhado
    DELETE FROM materiais_coletados_detalhado 
    WHERE id_entrega IN (
        SELECT id FROM entregas_reciclaveis WHERE id_user = v_user_id
    );
    RAISE NOTICE '✅ Materiais coletados deletados';

    -- Deletar materiais do usuário
    DELETE FROM materiais WHERE id_user = v_user_id;
    RAISE NOTICE '✅ Materiais do usuário deletados';

    -- Deletar cupons do usuário
    DELETE FROM user_coupons WHERE id_user = v_user_id;
    RAISE NOTICE '✅ Cupons do usuário deletados';

    -- Deletar indicações (como indicador)
    DELETE FROM indicacoes WHERE id_indicador = v_user_id;
    RAISE NOTICE '✅ Indicações deletadas';

    -- Deletar metas do usuário
    DELETE FROM user_goals WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Metas do usuário deletadas';

    -- Deletar histórico de ações
    DELETE FROM user_actions WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Histórico de ações deletado';

    -- Deletar notificações
    DELETE FROM notifications WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Notificações deletadas';

    -- =========================================================
    -- PASSO 3: Deletar profile do usuário
    -- =========================================================
    DELETE FROM profiles WHERE id = v_user_id;
    RAISE NOTICE '✅ Profile deletado';

    -- =========================================================
    -- PASSO 4: Deletar roles do usuário
    -- =========================================================
    DELETE FROM user_roles WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Roles deletadas';

    -- =========================================================
    -- PASSO 5: Deletar usuário do auth.users (Supabase Auth)
    -- =========================================================
    -- ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE '✅ Usuário deletado do auth.users';

    RAISE NOTICE '✅✅✅ DELEÇÃO COMPLETA! Usuário % removido com sucesso!', v_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ ERRO ao deletar usuário: %', SQLERRM;
END $$;


-- =========================================================
-- VERIFICAÇÃO (Execute separadamente para confirmar)
-- =========================================================
-- Verificar se o usuário foi deletado:
SELECT 
    'auth.users' as tabela,
    COUNT(*) as registros
FROM auth.users 
WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226'

UNION ALL

SELECT 
    'profiles' as tabela,
    COUNT(*) as registros
FROM profiles 
WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226'

UNION ALL

SELECT 
    'user_roles' as tabela,
    COUNT(*) as registros
FROM user_roles 
WHERE user_id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';

-- Se todos retornarem 0, a deleção foi bem-sucedida! ✅


-- =========================================================
-- ALTERNATIVA: Script mais seguro com ROLLBACK opcional
-- =========================================================
/*
BEGIN;

-- Execute todas as deleções aqui...

-- Se quiser DESFAZER, execute:
-- ROLLBACK;

-- Se quiser CONFIRMAR, execute:
-- COMMIT;
*/


-- =========================================================
-- SCRIPT GENÉRICO (para usar com qualquer usuário)
-- =========================================================
-- Para deletar outro usuário, substitua o UUID abaixo:
/*
DO $$
DECLARE
    v_user_id UUID := 'COLE_O_UUID_AQUI';
BEGIN
    -- Deletar relacionamentos
    DELETE FROM pontos_mensais WHERE id_user = v_user_id;
    DELETE FROM user_missions WHERE id_user = v_user_id;
    DELETE FROM materiais_coletados_detalhado 
    WHERE id_entrega IN (SELECT id FROM entregas_reciclaveis WHERE id_user = v_user_id);
    DELETE FROM entregas_reciclaveis WHERE id_user = v_user_id;
    DELETE FROM materiais WHERE id_user = v_user_id;
    DELETE FROM user_coupons WHERE id_user = v_user_id;
    DELETE FROM indicacoes WHERE id_indicador = v_user_id;
    DELETE FROM user_goals WHERE user_id = v_user_id;
    DELETE FROM user_actions WHERE user_id = v_user_id;
    DELETE FROM notifications WHERE user_id = v_user_id;
    
    -- Deletar profile e roles
    DELETE FROM profiles WHERE id = v_user_id;
    DELETE FROM user_roles WHERE user_id = v_user_id;
    
    -- Deletar do auth
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário deletado com sucesso!';
END $$;
*/
