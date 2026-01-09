-- =========================================================
-- SCRIPT CORRETO - UUID REAL DO USUÁRIO NATANAEL
-- =========================================================
-- UUID CORRETO: c5de6aa3-5e4a-4c25-8086-aa63e5cff226
-- (O UUID anterior estava ERRADO!)
-- =========================================================

-- UUID do usuário a ser deletado
-- Natanael Bernardo da Silva - natanjs01@gmail.com
-- CPF: 068.701.614-29

-- 1. Deletar interesses/funcionalidades do usuário
DELETE FROM interesses_funcionalidades WHERE id_usuario = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226';

-- 2. Deletar profile do usuário (CASCADE vai deletar tudo relacionado)
DELETE FROM profiles WHERE id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226';

-- 3. Deletar roles do usuário
DELETE FROM user_roles WHERE user_id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226';

-- 4. Deletar usuário do auth.users (Supabase Auth)
-- ⚠️ ÚLTIMA ETAPA - IRREVERSÍVEL!
DELETE FROM auth.users WHERE id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226';

-- =========================================================
-- VERIFICAÇÃO
-- =========================================================

SELECT 
    'auth.users' as tabela,
    COUNT(*) as registros
FROM auth.users 
WHERE id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226'

UNION ALL

SELECT 
    'profiles' as tabela,
    COUNT(*) as registros
FROM profiles 
WHERE id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226'

UNION ALL

SELECT 
    'user_roles' as tabela,
    COUNT(*) as registros
FROM user_roles 
WHERE user_id = 'c5de6aa3-5e4a-4c25-8086-aa63e5cff226';

-- ✅ Se todas as contagens retornarem 0, a deleção foi bem-sucedida!
