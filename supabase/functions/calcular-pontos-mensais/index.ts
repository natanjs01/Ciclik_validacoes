import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId } = await req.json();

    console.log('[calcular-pontos-mensais] Calculando pontos mensais para usuário:', userId);

    // Buscar pontos mensais já armazenados na tabela pontos_mensais_usuarios
    // Estes são os pontos DEFINITIVOS que foram concedidos e não devem ser recalculados
    const mesAtual = new Date();
    mesAtual.setDate(1);
    mesAtual.setHours(0, 0, 0, 0);
    const mesAtualStr = mesAtual.toISOString().split('T')[0];

    const { data: pontosMensais } = await supabaseClient
      .from('pontos_mensais_usuarios')
      .select('pontos_acumulados')
      .eq('id_usuario', userId)
      .eq('mes_referencia', mesAtualStr)
      .maybeSingle();

    // Se existir registro de pontos mensais, usar esse valor (mais confiável)
    if (pontosMensais) {
      console.log('[calcular-pontos-mensais] Usando pontos armazenados:', pontosMensais.pontos_acumulados);
      
      // Subtrair pontos gastos em resgates neste mês
      const { data: resgates } = await supabaseClient
        .from('cupons_resgates')
        .select('pontos_utilizados, data_resgate')
        .eq('id_usuario', userId)
        .gte('data_resgate', mesAtual.toISOString());

      let pontosGastos = 0;
      if (resgates && resgates.length > 0) {
        pontosGastos = resgates.reduce((sum, r) => sum + (r.pontos_utilizados || 0), 0);
        console.log(`Cupons resgatados: -${pontosGastos} pontos`);
      }

      const totalFinal = pontosMensais.pontos_acumulados - pontosGastos;
      
      return new Response(
        JSON.stringify({
          success: true,
          pontos_mensais: Math.max(0, totalFinal)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Fallback: calcular pontos baseado no score_verde do perfil
    // Este é o valor definitivo que foi atualizado pelos triggers
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('score_verde')
      .eq('id', userId)
      .single();

    const scoreVerde = profile?.score_verde || 0;
    
    // Subtrair pontos gastos em resgates (total histórico)
    const { data: resgatesTotal } = await supabaseClient
      .from('cupons_resgates')
      .select('pontos_utilizados')
      .eq('id_usuario', userId);

    let pontosGastosTotal = 0;
    if (resgatesTotal && resgatesTotal.length > 0) {
      pontosGastosTotal = resgatesTotal.reduce((sum, r) => sum + (r.pontos_utilizados || 0), 0);
    }

    // O score_verde já foi subtraído quando o usuário resgatou cupons
    // Então não precisamos subtrair novamente
    console.log('[calcular-pontos-mensais] Usando score_verde do perfil:', scoreVerde);

    return new Response(
      JSON.stringify({
        success: true,
        pontos_mensais: Math.max(0, scoreVerde)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[calcular-pontos-mensais] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
