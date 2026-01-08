// Edge Function para registrar usuário completo (auth + profile + role)
// Usa service_role key para ignorar RLS e ter permissões totais

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface RegisterUserRequest {
  email: string
  password: string
  userData: {
    nome: string
    telefone: string
    tipo_pessoa: 'PF' | 'PJ'
    tipo_pj?: string | null
    cpf?: string | null
    cnpj?: string | null
    cep: string
    logradouro: string
    bairro: string
    cidade: string
    uf: string
    numero: string
    complemento?: string
    codigo_indicador?: string | null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { email, password, userData }: RegisterUserRequest = await req.json()

    console.log('📝 [REGISTER] Iniciando cadastro para:', email)

    // Validações básicas
    if (!email || !password || !userData.nome) {
      throw new Error('Dados obrigatórios faltando: email, password, nome')
    }

    // Criar cliente Supabase com service_role (permissões totais)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔐 [REGISTER] Criando usuário no auth.users...')

    // 1. Criar usuário no auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email confirmation habilitado - usuário precisa confirmar email
      user_metadata: {
        nome: userData.nome,
        tipo_pessoa: userData.tipo_pessoa,
        role: 'usuario'
      }
    })

    if (authError) {
      console.error('❌ [REGISTER] Erro ao criar usuário:', authError)
      throw new Error(`Erro ao criar usuário: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado')
    }

    const userId = authData.user.id
    console.log('✅ [REGISTER] Usuário criado com ID:', userId)

    // 2. Criar profile na tabela profiles
    console.log('👤 [REGISTER] Criando profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        nome: userData.nome,
        email: email,
        telefone: userData.telefone,
        tipo_pessoa: userData.tipo_pessoa,
        tipo_pj: userData.tipo_pj || null,
        cpf: userData.cpf || null,
        cnpj: userData.cnpj || null,
        cep: userData.cep,
        logradouro: userData.logradouro,
        bairro: userData.bairro,
        cidade: userData.cidade,
        uf: userData.uf,
        numero: userData.numero,
        complemento: userData.complemento || '',
        codigo_indicador: userData.codigo_indicador || null,
      })

    if (profileError) {
      console.error('❌ [REGISTER] Erro ao criar profile:', profileError)
      
      // Rollback: deletar usuário criado
      console.log('🔄 [REGISTER] Fazendo rollback do usuário...')
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      throw new Error(`Erro ao criar profile: ${profileError.message}`)
    }

    console.log('✅ [REGISTER] Profile criado com sucesso')

    // 3. Criar role na tabela user_roles
    console.log('🎭 [REGISTER] Criando role...')
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'usuario',
      })

    if (roleError) {
      console.error('❌ [REGISTER] Erro ao criar role:', roleError)
      
      // Rollback: deletar profile e usuário
      console.log('🔄 [REGISTER] Fazendo rollback completo...')
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      throw new Error(`Erro ao criar role: ${roleError.message}`)
    }

    console.log('✅ [REGISTER] Role criada com sucesso')

    // 4. Processar código de indicação (se existir)
    if (userData.codigo_indicador) {
      console.log('🎁 [REGISTER] Processando código de indicação:', userData.codigo_indicador)
      
      // Buscar indicador pelo código
      const { data: indicadorData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('codigo_indicador', userData.codigo_indicador)
        .single()

      if (indicadorData) {
        // Registrar indicação
        await supabaseAdmin
          .from('indicacoes')
          .insert({
            id_indicador: indicadorData.id,
            id_indicado: userId,
            codigo_usado: userData.codigo_indicador,
          })
        
        console.log('✅ [REGISTER] Indicação registrada')
      } else {
        console.log('⚠️ [REGISTER] Código de indicação não encontrado')
      }
    }

    console.log('🎉 [REGISTER] Cadastro completo realizado com sucesso!')

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: authData.user.email,
          nome: userData.nome,
        },
        message: 'Usuário cadastrado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 [REGISTER] Erro geral:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao registrar usuário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
