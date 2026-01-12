// 🔐 SCRIPT DE ALTERAÇÃO DE SENHA DO ADMIN
// Este provavelmente foi o método usado

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://[seu-projeto].supabase.co'
const supabaseAnonKey = '[sua-anon-key]'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function alterarSenhaAdmin() {
  console.log('🔐 Iniciando alteração de senha do admin...')
  
  // 1. Fazer login com a senha antiga
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
  
  // 2. Alterar para nova senha forte
  console.log('2️⃣ Alterando senha...')
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: 'Nova_Senha_Forte_Aqui_123!@#'
  })
  
  if (updateError) {
    console.error('❌ Erro ao alterar senha:', updateError.message)
    return
  }
  
  console.log('✅ Senha alterada com sucesso!')
  console.log('📧 Nova senha: Nova_Senha_Forte_Aqui_123!@#')
  console.log('⚠️ Guarde esta senha em local seguro!')
  
  // 3. Fazer logout
  await supabase.auth.signOut()
  console.log('🚪 Logout realizado')
}

// Executar
alterarSenhaAdmin()
  .then(() => console.log('✅ Processo concluído!'))
  .catch(err => console.error('❌ Erro:', err))

/* 
CARACTERÍSTICAS DESTE MÉTODO:
- Login registrado em last_sign_in_at ✅
- Alteração imediata (milissegundos) ✅
- Sem necessidade de interface gráfica ✅
- Pode ser rodado de qualquer lugar ✅
- Explica os timestamps idênticos ✅

COMO RODAR:
1. Salvar como: alterar-senha-admin.js
2. npm install @supabase/supabase-js
3. node alterar-senha-admin.js

OU VIA PYTHON:
1. pip install supabase
2. python alterar_senha_admin.py
*/
