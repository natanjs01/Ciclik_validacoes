-- 🔍 DESCOBRIR COMO A SENHA FOI ALTERADA
-- Execute este SQL no Dashboard Supabase > SQL Editor

-- ============================================
-- 1️⃣ VERIFICAR MEMBROS DA EQUIPE NO SUPABASE
-- ============================================
-- Não há como fazer via SQL, mas você pode verificar manualmente:
-- Dashboard → Settings → Team → Ver quem tem acesso
-- Se a pessoa está listada lá, ela usou o Dashboard (método mais comum)

-- ============================================
-- 2️⃣ VERIFICAR LOGS DE ALTERAÇÃO (últimos 7 dias)
-- ============================================
SELECT 
  created_at as quando,
  ip_address as de_onde,
  payload->>'action' as acao,
  payload->>'actor_id' as quem_fez,
  payload->>'actor_username' as usuario,
  payload as detalhes_completos
FROM auth.audit_log_entries 
WHERE instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
  AND created_at > NOW() - INTERVAL '7 days'
  AND (
    payload->>'action' = 'user_updated' OR
    payload->>'action' = 'user_recovery_requested' OR
    payload->>'action' = 'password_recovery'
  )
ORDER BY created_at DESC;

-- 📊 INTERPRETAÇÃO DOS RESULTADOS:
/*
SE RETORNAR LINHAS:
  - action = 'user_recovery_requested' → Usou resetPasswordForEmail()
  - action = 'user_updated' → Usou API/SDK com service_role_key
  - actor_id presente → Mostra quem fez (se logado)
  - ip_address → De onde foi feito

SE NÃO RETORNAR NADA:
  ✅ Foi feito via Dashboard Supabase OU SQL Editor direto
  ✅ Estes métodos NÃO geram logs no audit_log_entries
  ✅ É a forma mais comum de admins alterarem senhas
*/

-- ============================================
-- 3️⃣ VERIFICAR ÚLTIMO UPDATE DO USUÁRIO ADMIN
-- ============================================
SELECT 
  email,
  updated_at as ultima_alteracao,
  last_sign_in_at as ultimo_login,
  CASE 
    WHEN updated_at > last_sign_in_at 
      THEN '⚠️ Senha foi alterada SEM fazer login depois'
    WHEN last_sign_in_at > updated_at 
      THEN '✅ Já fez login com a nova senha'
    ELSE '⚠️ Verificar manualmente'
  END as status,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@ciclik.com.br';

-- ============================================
-- 4️⃣ VERIFICAR IPs QUE ACESSARAM O ADMIN (últimos 30 dias)
-- ============================================
SELECT DISTINCT
  ip_address as ip,
  COUNT(*) as num_acessos,
  MIN(created_at) as primeiro_acesso,
  MAX(created_at) as ultimo_acesso,
  array_agg(DISTINCT payload->>'action') as acoes_realizadas
FROM auth.audit_log_entries 
WHERE instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY ip_address
ORDER BY ultimo_acesso DESC;

-- ============================================
-- 5️⃣ VERIFICAR SE HOUVE ACESSO VIA API COM SERVICE_ROLE_KEY
-- ============================================
-- Logs de ações via service_role geralmente têm características específicas

SELECT 
  created_at,
  ip_address,
  payload->>'action' as acao,
  payload->>'actor_id' as ator,
  CASE 
    WHEN payload->>'actor_id' IS NULL 
      THEN '⚠️ Provável: Service Role Key ou Dashboard'
    ELSE '👤 Ação de usuário logado'
  END as tipo_acesso,
  payload
FROM auth.audit_log_entries 
WHERE instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 📊 RESUMO: COMO IDENTIFICAR O MÉTODO
-- ============================================
/*
┌─────────────────────────────────────────────────────────────┐
│ MÉTODO                    │ COMO IDENTIFICAR                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Dashboard Supabase     │ • SEM logs no audit_log          │
│    (90% dos casos)        │ • Pessoa tem acesso ao Dashboard │
│                           │ • Forma mais simples e comum     │
├─────────────────────────────────────────────────────────────┤
│ 2. SQL Editor             │ • SEM logs no audit_log          │
│                           │ • Pessoa tem conhecimento SQL    │
│                           │ • Precisa acesso ao Dashboard    │
├─────────────────────────────────────────────────────────────┤
│ 3. Service Role Key       │ • PODE ter logs (user_updated)   │
│                           │ • actor_id = NULL                │
│                           │ • Via código/script              │
├─────────────────────────────────────────────────────────────┤
│ 4. Token de Reset         │ • TEM logs (password_recovery)   │
│                           │ • Mostra recovery_requested      │
│                           │ • Muito improvável               │
└─────────────────────────────────────────────────────────────┘

CONCLUSÃO MAIS PROVÁVEL:
Se os SQLs acima NÃO retornarem logs de alteração, então:
✅ Foi feito via Dashboard do Supabase
✅ É a forma oficial e mais comum de admins alterarem senhas
✅ Não é hack, é funcionalidade administrativa normal
*/

-- ============================================
-- 🎯 PERGUNTAS PARA A PESSOA QUE ALTEROU
-- ============================================
/*
Pergunte para a pessoa:

1. "Você tem acesso ao Dashboard do Supabase?"
   Se SIM → Provavelmente usou: Dashboard → Authentication → Users → Reset Password

2. "Como você descobriu que precisava alterar a senha?"
   - Alguém pediu?
   - Você percebeu sozinho?
   - Foi um alerta de segurança?

3. "Você lembra como fez?"
   - Pelo site do Supabase (Dashboard)? ← MAIS PROVÁVEL
   - Por código/script?
   - Por SQL direto?

4. "Quando você fez isso?"
   - Compare com os horários dos logs acima

5. "De qual computador/IP você estava?"
   - Compare com os IPs dos logs acima
*/

-- ============================================
-- ✅ CHECKLIST DE INVESTIGAÇÃO
-- ============================================
/*
[ ] Executei este SQL e verifiquei os logs
[ ] Verifiquei membros da equipe no Dashboard (Settings → Team)
[ ] Perguntei para a pessoa como ela fez
[ ] Comparei horários da alteração com atividades dela
[ ] Verifiquei os IPs de acesso
[ ] Confirmei que foi uma ação legítima (não foi invasão)
[ ] Documentei o método usado para referência futura
[ ] Implementei medidas preventivas (MFA, logs, etc)

RESULTADO DA INVESTIGAÇÃO:
Método usado: _______________________
Justificativa: _______________________
Foi legítimo? [ ] Sim [ ] Não
Ações tomadas: _______________________
*/
