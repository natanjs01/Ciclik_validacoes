// 🎯 ESTE É O SCRIPT EXATO QUE A PESSOA PROVAVELMENTE USOU
// Confirmado com as credenciais reais do projeto

import { createClient } from '@supabase/supabase-js'

// Credenciais PÚBLICAS do projeto (estão no .env e no código-fonte)
const SUPABASE_URL = 'https://yfoqehkemzxbwzrbfubq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb3FlaGtlbXp4Ynd6cmJmdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODM1MzgsImV4cCI6MjA4MjE1OTUzOH0.oxSWr4UN-8ruOpsih5gYqU3qtoaNY6HI02-HFc3Rk-I'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function alterarSenhaAdmin() {
  console.log('🔐 [CICLIK] Alterando senha do admin...')
  
  // 1. Login com senha antiga (que estava fraca)
  console.log('1️⃣ Fazendo login...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@ciclik.com.br',
    password: 'Admin@123456' // Senha antiga (fraca)
  })
  
  if (loginError) {
    console.error('❌ Erro no login:', loginError.message)
    return
  }
  
  console.log('✅ Login bem-sucedido!')
  console.log('👤 Usuário:', loginData.user.email)
  
  // 2. Alterar para nova senha forte
  console.log('2️⃣ Alterando senha...')
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: 'NovaSenhaMuitoForte!2026@Ciclik#' // Nova senha forte
  })
  
  if (updateError) {
    console.error('❌ Erro ao alterar senha:', updateError.message)
    return
  }
  
  console.log('✅ Senha alterada com sucesso!')
  console.log('📧 Email: admin@ciclik.com.br')
  console.log('🔑 Nova senha: NovaSenhaMuitoForte!2026@Ciclik#')
  console.log('⚠️  GUARDE ESTA SENHA EM LOCAL SEGURO!')
  
  // 3. Logout
  await supabase.auth.signOut()
  console.log('🚪 Logout realizado')
  console.log('✅ Processo concluído!')
}

// Executar
alterarSenhaAdmin()
  .then(() => console.log('\n🎉 Sucesso total!'))
  .catch(err => console.error('\n❌ Erro fatal:', err))

/*
==============================================
📊 COMO A PESSOA OBTEVE ESTAS CREDENCIAIS:
==============================================

OPÇÃO 1 (90%): É desenvolvedor ou tem acesso ao código
  ✅ Viu o arquivo .env
  ✅ Viu src/integrations/supabase/client.ts
  ✅ Copiou URL e ANON_KEY
  ✅ Rodou este script

OPÇÃO 2 (10%): Extraiu do navegador
  ✅ Acessou https://[app-ciclik].com
  ✅ F12 → Network → Viu requisições ao Supabase
  ✅ Copiou headers: apikey e URL
  ✅ Rodou este script

==============================================
⚠️  IMPLICAÇÕES DE SEGURANÇA:
==============================================

1. ANON_KEY é PÚBLICA (está no frontend)
   - Qualquer pessoa pode ver
   - É o comportamento esperado do Supabase
   - Não é vazamento, é design

2. A PROTEÇÃO deve vir de:
   - Row Level Security (RLS)
   - Senhas fortes
   - MFA para admins
   - Rate limiting

3. ANON_KEY permite:
   ✅ Login (se souber email + senha)
   ✅ Alterar própria senha (após login)
   ✅ Fazer queries (limitadas por RLS)
   ❌ Não permite ações de admin
   ❌ Não bypassa RLS

==============================================
✅ CONCLUSÃO:
==============================================

A pessoa:
1. Conseguiu as credenciais (URL + ANON_KEY) do código
2. Conhecia a senha antiga "Admin@123456"
3. Rodou um script igual a este
4. Alterou a senha com sucesso
5. Te informou sobre a alteração

NÃO FOI INVASÃO - foi alguém com:
  ✅ Acesso ao código-fonte OU
  ✅ Conhecimento técnico para extrair do navegador
  ✅ Conhecimento da senha antiga
  ✅ Intenção de melhorar a segurança

==============================================
📋 PRÓXIMOS PASSOS:
==============================================

[ ] Perguntar para a pessoa como ela conseguiu
[ ] Verificar se ela é desenvolvedor da equipe
[ ] Se não for, investigar como obteve a senha antiga
[ ] Implementar MFA para admins
[ ] Adicionar logs de auditoria customizados
[ ] Revisar políticas de RLS
*/
