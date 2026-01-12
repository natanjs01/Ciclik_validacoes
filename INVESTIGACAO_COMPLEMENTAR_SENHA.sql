-- 🔍 INVESTIGAÇÃO COMPLEMENTAR - Descobrir se foi via App ou Dashboard
-- Execute este SQL para mais detalhes

-- ============================================
-- 1️⃣ VERIFICAR O TIPO DE LOGIN (App vs Dashboard)
-- ============================================
SELECT 
  created_at as horario,
  ip_address as ip,
  payload->>'action' as acao,
  payload->>'user_agent' as navegador,
  payload->>'request_id' as request_id,
  payload as detalhes_completos
FROM auth.audit_log_entries 
WHERE instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
  AND created_at BETWEEN '2026-01-09 20:48:00' AND '2026-01-09 20:49:00'
ORDER BY created_at DESC;

-- 📊 INTERPRETAÇÃO:
/*
Se aparecer:
- user_agent = "Mozilla/5.0..." → Login via navegador (pode ser App OU Dashboard)
- request_id presente → Login via API do Supabase
- Sem logs específicos → Alteração direta no banco
*/

-- ============================================
-- 2️⃣ VERIFICAR SE HÁ FUNÇÃO DE ALTERAR SENHA NO APP
-- ============================================
-- Este é um comentário de verificação manual:
/*
VERIFICAR NO CÓDIGO DO APP:
1. Existe página de "Alterar Senha" / "Change Password"?
   Caminho provável: src/pages/Profile.tsx ou similar

2. Usa qual método para alterar?
   - supabase.auth.updateUser({ password: ... })
   - Outro método?

3. Tem proteção de senha antiga?
   - Pede senha atual antes de alterar?
*/

-- ============================================
-- 3️⃣ VERIFICAR TODOS OS EVENTOS PRÓXIMOS AO HORÁRIO
-- ============================================
SELECT 
  created_at as quando,
  ip_address as ip,
  payload->>'action' as acao,
  payload->>'email' as email_afetado,
  CASE 
    WHEN payload->>'action' = 'user_signedin' THEN '🔓 Login'
    WHEN payload->>'action' = 'user_updated' THEN '✏️ Senha alterada'
    WHEN payload->>'action' = 'token_refreshed' THEN '🔄 Token renovado'
    WHEN payload->>'action' = 'user_signedout' THEN '🚪 Logout'
    ELSE '❓ ' || payload->>'action'
  END as descricao,
  payload
FROM auth.audit_log_entries 
WHERE created_at BETWEEN '2026-01-09 20:45:00' AND '2026-01-09 20:55:00'
  AND (
    payload->>'email' = 'admin@ciclik.com.br' OR
    payload->>'actor_username' = 'admin@ciclik.com.br' OR
    instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
  )
ORDER BY created_at;

-- ============================================
-- 4️⃣ VERIFICAR IP DE ONDE FOI FEITO
-- ============================================
SELECT DISTINCT
  ip_address as ip_origem,
  COUNT(*) as atividades,
  array_agg(DISTINCT payload->>'action') as acoes
FROM auth.audit_log_entries 
WHERE created_at BETWEEN '2026-01-09 20:48:00' AND '2026-01-09 20:49:00'
  AND instance_id = (SELECT id FROM auth.users WHERE email = 'admin@ciclik.com.br')
GROUP BY ip_address;

-- ============================================
-- 📊 RESUMO DA ANÁLISE
-- ============================================
/*
BASEADO NOS TIMESTAMPS:
- Login:    2026-01-09 20:48:27.777841
- Alteração: 2026-01-09 20:48:27.781264
- Diferença: 0.003423 segundos (3.4 milissegundos)

ISSO SIGNIFICA:
✅ Foi uma ação IMEDIATA após o login
✅ Provavelmente script automatizado OU
✅ Função automática do sistema OU
✅ Alteração muito rápida pelo usuário

POSSIBILIDADES:
1. 🤖 Script que fez login + alterou senha automaticamente
2. 👤 Pessoa logou e MUITO RAPIDAMENTE alterou (improvável em 3ms)
3. 🔧 Trigger ou função do banco que alterou após login
4. 📱 App tem função "forçar trocar senha no primeiro login"

PARA DESCOBRIR COM CERTEZA:
- Executar os SQLs acima para ver user_agent e IPs
- Verificar se existe código no app que força troca de senha
- Perguntar para a pessoa: "Como você alterou? Pelo sistema ou pelo Dashboard?"
*/

-- ============================================
-- 🎯 CONCLUSÃO TÉCNICA
-- ============================================
/*
A pessoa CONHECIA a senha antiga "Admin@123456"
Conseguiu fazer login com sucesso
Alterou a senha IMEDIATAMENTE (em 3ms)

MÉTODOS POSSÍVEIS:
1. Via código/script com supabase.auth.updateUser()
2. Via Dashboard Supabase (mas teria login separado)
3. Via página de perfil do app (se existir)

PRÓXIMO PASSO:
Pergunte diretamente: "Como você alterou a senha? Pelo sistema ou manualmente?"
*/
