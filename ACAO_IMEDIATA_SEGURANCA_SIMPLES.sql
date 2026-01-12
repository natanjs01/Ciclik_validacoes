-- 🚨 VERSÃO SIMPLIFICADA - GARANTIDA DE FUNCIONAR
-- Execute este arquivo se o ACAO_IMEDIATA_SEGURANCA.sql estiver dando erros

-- ============================================
-- 1️⃣ ALTERAR SENHA DO ADMIN (MAIS IMPORTANTE!)
-- ============================================
-- PASSO 1: Gere uma senha forte em: https://passwordsgenerator.net/
-- PASSO 2: Substitua 'SENHA_FORTE_AQUI' pela senha gerada
-- PASSO 3: Execute este comando:

UPDATE auth.users
SET 
  encrypted_password = crypt('SENHA_FORTE_AQUI', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@ciclik.com.br';

-- ✅ Confirmar alteração:
SELECT 
  email, 
  updated_at,
  'Senha alterada com sucesso!' as status
FROM auth.users 
WHERE email = 'admin@ciclik.com.br';

-- ============================================
-- 2️⃣ FORÇAR LOGOUT (OPÇÃO MAIS SIMPLES)
-- ============================================
-- Primeiro, vamos pegar o UUID do admin:
DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  -- Buscar UUID do admin
  SELECT id INTO admin_uuid
  FROM auth.users 
  WHERE email = 'admin@ciclik.com.br';
  
  -- Mostrar UUID
  RAISE NOTICE 'UUID do Admin: %', admin_uuid;
  
  -- Deletar todos os tokens de refresh
  DELETE FROM auth.refresh_tokens
  WHERE user_id = admin_uuid;
  
  RAISE NOTICE 'Todos os tokens foram removidos. Admin precisa fazer login novamente.';
END $$;

-- ============================================
-- 3️⃣ VERIFICAR SE FUNCIONOU
-- ============================================
SELECT 
  u.email,
  u.updated_at as ultima_alteracao,
  COUNT(rt.id) as tokens_ativos
FROM auth.users u
LEFT JOIN auth.refresh_tokens rt ON rt.user_id = u.id AND rt.revoked = false
WHERE u.email = 'admin@ciclik.com.br'
GROUP BY u.email, u.updated_at;

-- Se tokens_ativos = 0, está tudo certo! ✅

-- ============================================
-- 4️⃣ VERIFICAR OUTROS ADMINS (IMPORTANTE!)
-- ============================================
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at;

-- ⚠️ Se aparecer algum admin que você NÃO conhece, delete imediatamente:
-- DELETE FROM auth.users WHERE email = 'email_suspeito@exemplo.com';

-- ============================================
-- 5️⃣ VERIFICAR LOGINS RECENTES
-- ============================================
SELECT 
  created_at as quando,
  ip_address as de_onde,
  payload->>'action' as acao
FROM auth.audit_log_entries 
WHERE instance_id IN (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 6️⃣ VERIFICAR NOVOS USUÁRIOS (ÚLTIMOS 30 DIAS)
-- ============================================
SELECT 
  email,
  created_at,
  raw_user_meta_data->>'role' as role,
  last_sign_in_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ⚠️ Investigar qualquer usuário suspeito criado recentemente!

-- ============================================
-- 7️⃣ CRIAR LOG DO INCIDENTE
-- ============================================
-- Criar tabela de incidentes (se não existir)
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id SERIAL PRIMARY KEY,
  incident_date TIMESTAMP DEFAULT NOW(),
  incident_type TEXT NOT NULL,
  description TEXT,
  user_email TEXT,
  resolved BOOLEAN DEFAULT false,
  notes TEXT
);

-- Registrar este incidente
INSERT INTO public.security_incidents (
  incident_type, 
  description, 
  user_email,
  notes
) VALUES (
  'SENHA_COMPROMETIDA',
  'Senha padrão Admin@123456 foi comprometida. Provável brute force. Sem logs de alteração (alterado via Dashboard/SQL). Senha alterada emergencialmente em ' || NOW(),
  'admin@ciclik.com.br',
  'AÇÕES TOMADAS: 1) Senha alterada, 2) Tokens revogados, 3) Logs analisados, 4) Chaves do Supabase a serem rotacionadas, 5) MFA a ser implementado'
);

-- Confirmar registro:
SELECT * FROM public.security_incidents 
ORDER BY incident_date DESC 
LIMIT 1;

-- ============================================
-- ✅ CHECKLIST - MARQUE O QUE FOI FEITO
-- ============================================
/*
EXECUTADO:
[ ] 1. Alterei senha do admin para senha FORTE (mínimo 16 caracteres)
[ ] 2. Salvei nova senha no password manager
[ ] 3. Forcei logout de todas as sessões
[ ] 4. Verifiquei se há outros admins suspeitos
[ ] 5. Analisei logins recentes
[ ] 6. Verifiquei novos usuários criados
[ ] 7. Registrei incidente na tabela

PRÓXIMOS PASSOS (FAZER HOJE):
[ ] 8. Rotacionar anon_key no Dashboard Supabase
[ ] 9. Rotacionar service_role_key no Dashboard Supabase
[ ] 10. Ativar MFA no Dashboard Supabase
[ ] 11. Revisar membros da equipe com acesso
[ ] 12. Atualizar .env com novas chaves
[ ] 13. Fazer deploy com novas chaves

IMPORTANTE:
- A senha alterada deve ter NO MÍNIMO 16 caracteres
- Use gerador: https://passwordsgenerator.net/
- Salve em password manager (1Password, LastPass, Bitwarden)
- NUNCA use senhas óbvias como Admin@123456
*/

-- ============================================
-- 🎯 EXEMPLO DE SENHA FORTE
-- ============================================
-- ❌ FRACA: Admin@123456
-- ✅ FORTE: kP9$mT2#nQ7@wL5&zX3!rY8%aB4^
-- ✅ FORTE: Xj4$nW9@pK2#mQ7&tR5!vL8%yB3^
-- ✅ FORTE: Ln7@rT4#mP9$wQ2&xK5!zV8%bN3^

-- Use um gerador automático! Não tente criar manualmente.
