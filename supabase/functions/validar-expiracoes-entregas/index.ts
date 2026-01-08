import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Tratar requisição OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando validação de expirações de promessas de entrega...');

    // Buscar entregas com mais de 24 horas no status_promessa 'ativa'
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 24);

    const { data: entregasExpiradas, error: selectError } = await supabase
      .from('entregas_reciclaveis')
      .select('id, qrcode_id, id_usuario, itens_vinculados')
      .eq('status_promessa', 'ativa')
      .lt('data_geracao', dataLimite.toISOString());

    if (selectError) {
      console.error('Erro ao buscar entregas:', selectError);
      throw selectError;
    }

    console.log(`Encontradas ${entregasExpiradas?.length || 0} promessas expiradas`);

    if (entregasExpiradas && entregasExpiradas.length > 0) {
      const idsExpirados = entregasExpiradas.map(e => e.id);
      
      // Atualizar status_promessa para 'expirada' (não altera status da entrega)
      const { error: updateError } = await supabase
        .from('entregas_reciclaveis')
        .update({ status_promessa: 'expirada' })
        .in('id', idsExpirados);

      if (updateError) {
        console.error('Erro ao atualizar status_promessa:', updateError);
        throw updateError;
      }

      console.log(`${idsExpirados.length} promessas marcadas como expiradas`);

      // Retornar materiais para status 'disponivel'
      let totalMateriaisLiberados = 0;
      for (const entrega of entregasExpiradas) {
        if (entrega.itens_vinculados && Array.isArray(entrega.itens_vinculados)) {
          const { error: materiaisError } = await supabase
            .from('materiais_reciclaveis_usuario')
            .update({ 
              status: 'disponivel',
              id_entrega: null 
            })
            .in('id', entrega.itens_vinculados)
            .eq('status', 'em_entrega');

          if (materiaisError) {
            console.error('Erro ao liberar materiais:', materiaisError);
          } else {
            totalMateriaisLiberados += entrega.itens_vinculados.length;
          }
        }
      }

      console.log(`${totalMateriaisLiberados} materiais retornados para área de entregas`);

      // Criar notificações para os usuários
      const notificacoes = entregasExpiradas.map(entrega => ({
        id_usuario: entrega.id_usuario,
        tipo: 'entrega_expirada',
        mensagem: `Sua promessa de entrega expirou após 24 horas. Os materiais retornaram para sua área de entregas disponíveis. Gere um novo QR Code quando estiver pronto.`,
        lida: false
      }));

      const { error: notifError } = await supabase
        .from('notificacoes')
        .insert(notificacoes);

      if (notifError) {
        console.error('Erro ao criar notificações:', notifError);
      } else {
        console.log(`${notificacoes.length} notificações criadas`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expiradas: entregasExpiradas?.length || 0,
        message: `${entregasExpiradas?.length || 0} promessas marcadas como expiradas`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na validação de expirações:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retorna status 200 mesmo em erro para evitar problemas de CORS
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        expiradas: 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
