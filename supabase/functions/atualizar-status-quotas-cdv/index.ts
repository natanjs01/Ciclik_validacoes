import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Iniciando atualização automática de status de quotas CDV...')

    // Executar função que atualiza status_maturacao de todas as quotas
    const { data: resultStatus, error: errorStatus } = await supabaseClient
      .rpc('atualizar_status_maturacao_cdv_quotas')

    if (errorStatus) {
      console.error('❌ Erro ao atualizar status:', errorStatus)
      throw errorStatus
    }

    console.log(`✅ Status atualizado para ${resultStatus} quotas`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Status de ${resultStatus} quotas atualizado com sucesso`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erro na edge function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Falha ao atualizar status das quotas CDV'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})