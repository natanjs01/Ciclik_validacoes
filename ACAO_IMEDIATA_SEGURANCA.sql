-- 🚨 AÇÃO IMEDIATA DE SEGURANÇA
-- Execute AGORA no Dashboard Supabase > SQL Editor

-- ============================================
-- 1️⃣ ALTERAR SENHA DO ADMIN IMEDIATAMENTE
-- ============================================
-- IMPORTANTE: Gere uma senha FORTE antes de executar!
-- Sugestão: Use gerador de senhas (mínimo 20 caracteres)
-- Exemplo: https://passwordsgenerator.net/

-- SUBSTITUA 'NOVA_SENHA_SUPER_FORTE_AQUI' por uma senha gerada:
UPDATE auth.users
SET 
  encrypted_password = crypt('NOVA_SENHA_SUPER_FORTE_AQUI', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@ciclik.com.br';

-- ============================================
-- 2️⃣ VERIFICAR SE HÁ OUTROS ADMINS SUSPEITOS
-- ============================================
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at;

-- ⚠️ Se houver admins que você NÃO reconhece, delete imediatamente!

-- ============================================
-- 3️⃣ VERIFICAR LOGINS RECENTES DO ADMIN
-- ============================================
SELECT 
  created_at,
  ip_address,
  payload->>'action' as action
FROM auth.audit_log_entries 
WHERE instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 4️⃣ FORÇAR LOGOUT DE TODAS AS SESSÕES
-- ============================================
-- Isso invalida todos os tokens de acesso do admin

-- OPÇÃO 1: Forçar logout (preferencial)
UPDATE auth.refresh_tokens
SET revoked = true
WHERE user_id = (SELECT id::uuid FROM auth.users WHERE email = 'admin@ciclik.com.br');

-- OPÇÃO 2: Se a OPÇÃO 1 der erro, use esta (deletar tokens diretamente)
-- DELETE FROM auth.refresh_tokens
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br');

-- ============================================
-- 5️⃣ VERIFICAR SE HOUVE CRIAÇÃO DE NOVOS USUÁRIOS
-- ============================================
-- Ver se o invasor criou backdoors (outros admins)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data,
  ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

-- ⚠️ Verifique cada usuário criado recentemente!

-- ============================================
-- 6️⃣ VERIFICAR ALTERAÇÕES NAS TABELAS CRÍTICAS
-- ============================================
-- Verificar se alteraram configurações, cooperativas, etc.

-- Cooperativas criadas recentemente:
SELECT * FROM cooperativas 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Alterações em user_roles:
SELECT * FROM user_roles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- 7️⃣ CRIAR LOG DE AUDITORIA EMERGENCIAL
-- ============================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  incident_type TEXT NOT NULL,
  description TEXT,
  user_email TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);

-- Registrar este incidente:
INSERT INTO security_incidents (incident_type, description, user_email)
VALUES (
  'SENHA_COMPROMETIDA',
  'Senha padrão Admin@123456 foi comprometida. Sem logs de alteração (via Dashboard ou SQL direto). Senha alterada emergencialmente.',
  'admin@ciclik.com.br'
);

-- ============================================
-- 8️⃣ IMPLEMENTAR POLÍTICA DE SENHA FORTE
-- ============================================
-- Função para validar força de senha (usar no app também)
CREATE OR REPLACE FUNCTION validar_senha_forte(senha TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mínimo 12 caracteres
  IF length(senha) < 12 THEN
    RETURN FALSE;
  END IF;
  
  -- Deve ter letra maiúscula
  IF senha !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Deve ter letra minúscula
  IF senha !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Deve ter número
  IF senha !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Deve ter caractere especial
  IF senha !~ '[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]' THEN
    RETURN FALSE;
  END IF;
  
  -- Não pode conter sequências óbvias
  IF senha ~* '(123456|password|admin|qwerty|abc123)' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 📊 CHECKLIST EXECUTADO
-- ============================================
/*
Após executar este script, você deve ter:

✅ 1. Alterado senha do admin
✅ 2. Verificado outros admins
✅ 3. Analisado logins recentes
✅ 4. Forçado logout de todas as sessões
✅ 5. Verificado novos usuários criados
✅ 6. Checado alterações em tabelas críticas
✅ 7. Registrado incidente
✅ 8. Implementado validação de senha forte

PRÓXIMOS PASSOS URGENTES:
- [ ] Rotacionar anon_key e service_role_key
- [ ] Ativar MFA no Dashboard Supabase
- [ ] Revisar membros da equipe com acesso
- [ ] Implementar alertas de segurança
- [ ] Mudar TODAS as senhas padrão do sistema
- [ ] Fazer varredura completa de código (procurar senhas hardcoded)
*/

-- ============================================
-- 🔍 ANÁLISE FORENSE
-- ============================================
-- Como NÃO há logs, provável que foi:
-- 1. Brute force via login normal (senha fraca)
-- 2. Alguém da equipe que conhecia a senha padrão
-- 3. Senha estava exposta em algum lugar (código, docs, chat)

-- INVESTIGAR:
-- [ ] Quem mais conhece/conhecia esta senha?
-- [ ] A senha estava em alguma documentação?
-- [ ] Verificar histórico de commits (git log)
-- [ ] Verificar backups de código
-- [ ] Perguntar à equipe se compartilharam
