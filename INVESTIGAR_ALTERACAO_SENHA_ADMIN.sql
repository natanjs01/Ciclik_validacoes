-- 🔍 INVESTIGAÇÃO: Como a senha do admin foi alterada?
-- Execute este SQL no Dashboard Supabase > SQL Editor

-- ============================================
-- 1️⃣ VERIFICAR LOGS DE AUDITORIA DO USUÁRIO ADMIN
-- ============================================
SELECT 
  id,
  created_at,
  ip_address,
  payload->>'action' as action,
  payload->>'actor_username' as actor,
  payload 
FROM auth.audit_log_entries 
WHERE instance_id = (
  SELECT id FROM auth.users 
  WHERE email LIKE '%admin%' OR raw_user_meta_data->>'role' = 'admin'
  LIMIT 1
)
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- 2️⃣ VERIFICAR TODAS AS ALTERAÇÕES RECENTES EM AUTH.USERS
-- ============================================
SELECT 
  created_at,
  ip_address,
  payload->>'action' as action,
  payload->>'email' as email_afetado,
  payload
FROM auth.audit_log_entries 
WHERE payload->>'action' IN (
  'user_updated', 
  'user_recovery_requested',
  'password_recovery',
  'token_refreshed',
  'user_signedup'
)
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 3️⃣ VERIFICAR ÚLTIMO UPDATE NA TABELA AUTH.USERS
-- ============================================
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  updated_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%admin%' 
   OR raw_user_meta_data->>'role' = 'admin'
ORDER BY updated_at DESC;

-- ============================================
-- 4️⃣ VERIFICAR TENTATIVAS DE LOGIN DO ADMIN
-- ============================================
SELECT 
  created_at,
  ip_address,
  payload->>'action' as action,
  payload->>'error' as error_message,
  payload
FROM auth.audit_log_entries 
WHERE payload->>'email' LIKE '%admin%'
   OR payload->>'actor_username' LIKE '%admin%'
ORDER BY created_at DESC
LIMIT 30;

-- ============================================
-- 5️⃣ VERIFICAR TOKENS DE RECUPERAÇÃO GERADOS
-- ============================================
-- Nota: Tokens são temporários e podem não estar mais disponíveis
SELECT 
  created_at,
  ip_address,
  payload->>'action' as action,
  payload->>'email' as email,
  payload->>'token_hash' as token_info
FROM auth.audit_log_entries 
WHERE payload->>'action' = 'user_recovery_requested'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 6️⃣ VERIFICAR IPs QUE ACESSARAM O SISTEMA RECENTEMENTE
-- ============================================
SELECT 
  DISTINCT ip_address,
  COUNT(*) as tentativas,
  MIN(created_at) as primeira_tentativa,
  MAX(created_at) as ultima_tentativa,
  array_agg(DISTINCT payload->>'action') as acoes
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY ip_address
ORDER BY ultima_tentativa DESC;

-- ============================================
-- 7️⃣ VERIFICAR SE HOUVE ALTERAÇÃO DIRETA NO BANCO
-- ============================================
-- Nota: Se não houver registro nos audit_logs, foi alteração direta via:
-- - Dashboard Supabase
-- - SQL Editor
-- - Service Role Key

-- Verificar dados atuais do admin:
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  last_sign_in_at,
  updated_at,
  created_at,
  raw_user_meta_data,
  CASE 
    WHEN updated_at > last_sign_in_at THEN 'SENHA ALTERADA RECENTEMENTE (sem login)'
    WHEN last_sign_in_at > updated_at THEN 'Login após última alteração'
    ELSE 'Verificar manualmente'
  END as status_seguranca
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
   OR email LIKE '%admin%';

-- ============================================
-- 📊 ANÁLISE DE SEGURANÇA
-- ============================================
COMMENT ON TABLE auth.audit_log_entries IS 
'Se NÃO houver registros de password_recovery ou user_updated para o admin,
a alteração foi feita DIRETAMENTE via:
1. Dashboard Supabase (não gera audit log)
2. SQL Editor direto
3. Service Role Key com admin.updateUserById()';

-- ============================================
-- 🚨 AÇÕES RECOMENDADAS APÓS INVESTIGAÇÃO
-- ============================================
/*
1. Rotacionar todas as chaves (anon_key, service_role_key)
2. Revisar quem tem acesso ao projeto Supabase
3. Implementar MFA no Dashboard Supabase
4. Trocar email do admin para um real (com controle)
5. Implementar log de auditoria customizado para ações críticas
6. Adicionar alertas de segurança (via webhook)
*/
