-- =========================================================
-- SCRIPT ULTRA SIMPLIFICADO - DELETAR APENAS PROFILE
-- =========================================================
-- Execute este script direto no SQL Editor do Supabase Dashboard
-- =========================================================

-- UUID do usuário a ser deletado
-- Natanael Bernardo da Silva - natanjd01@gmail.com

-- 1. Deletar profile do usuário
-- Isso vai disparar CASCADE e deletar automaticamente todos os registros relacionados
DELETE FROM profiles WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';

-- 2. Deletar roles do usuário
DELETE FROM user_roles WHERE user_id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';

-- 3. Deletar usuário do auth.users (Supabase Auth)
-- ⚠️ ÚLTIMA ETAPA - IRREVERSÍVEL!
DELETE FROM auth.users WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';

-- =========================================================
-- VERIFICAÇÃO
-- =========================================================
-- Execute esta query para confirmar que o usuário foi deletado:

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

-- ✅ Se todas as contagens retornarem 0, a deleção foi bem-sucedida!
