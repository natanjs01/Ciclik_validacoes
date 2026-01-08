import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tipo, payload } = await req.json();

    console.log('Processando notificação:', { tipo, payload });

    switch (tipo) {
      case 'promessa_criada':
        await criarNotificacaoPromessaCriada(supabase, payload);
        break;
      
      case 'promessa_expirando':
        await verificarPromessasExpirando(supabase);
        break;
      
      case 'coleta_iniciada':
        await criarNotificacaoColetaIniciada(supabase, payload);
        break;
      
      case 'coleta_finalizada':
        await criarNotificacaoColetaFinalizada(supabase, payload);
        break;
      
      default:
        throw new Error(`Tipo de notificação desconhecido: ${tipo}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao processar notificação:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function criarNotificacaoPromessaCriada(supabase: any, payload: any) {
  const { id_usuario, id_entrega, peso_estimado } = payload;

  await supabase
    .from('notificacoes')
    .insert({
      id_usuario,
      tipo: 'promessa_criada',
      mensagem: `Promessa de entrega criada! Peso estimado: ${peso_estimado?.toFixed(2)}kg. Válida por 24h.`
    });
}

async function verificarPromessasExpirando(supabase: any) {
  const agora = new Date();
  const limite = new Date(agora.getTime() + 2 * 60 * 60 * 1000); // 2 horas

  const { data: entregas } = await supabase
    .from('entregas_reciclaveis')
    .select('id, id_usuario, id_cooperativa, data_geracao')
    .eq('status_promessa', 'ativa')
    .lt('data_geracao', limite.toISOString());

  if (entregas) {
    for (const entrega of entregas) {
      // Notificar usuário
      await supabase
        .from('notificacoes')
        .insert({
          id_usuario: entrega.id_usuario,
          tipo: 'promessa_expirando',
          mensagem: 'Atenção! Sua promessa de entrega expira em breve. Não esqueça de entregar!'
        });

      // Notificar cooperativa
      const { data: coop } = await supabase
        .from('cooperativas')
        .select('id_user')
        .eq('id', entrega.id_cooperativa)
        .single();

      if (coop) {
        await supabase
          .from('notificacoes')
          .insert({
            id_usuario: coop.id_user,
            tipo: 'promessa_expirando',
            mensagem: 'Uma promessa de entrega está prestes a expirar.'
          });
      }
    }
  }
}

async function criarNotificacaoColetaIniciada(supabase: any, payload: any) {
  const { id_usuario, id_entrega } = payload;

  await supabase
    .from('notificacoes')
    .insert({
      id_usuario,
      tipo: 'coleta_iniciada',
      mensagem: 'A cooperativa iniciou o processamento da sua entrega!'
    });
}

async function criarNotificacaoColetaFinalizada(supabase: any, payload: any) {
  const { id_usuario, peso_validado, peso_rejeito, pontos } = payload;

  const mensagem = `Entrega finalizada! ` +
    `Peso aceito: ${peso_validado?.toFixed(2)}kg | ` +
    `${peso_rejeito > 0 ? `Rejeito: ${peso_rejeito?.toFixed(2)}kg | ` : ''}` +
    `Pontos ganhos: +${pontos}`;

  await supabase
    .from('notificacoes')
    .insert({
      id_usuario,
      tipo: 'coleta_finalizada',
      mensagem
    });
}
