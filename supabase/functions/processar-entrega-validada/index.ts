import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessarEntregaRequest {
  entrega_id: string;
  peso_validado: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { entrega_id, peso_validado }: ProcessarEntregaRequest = await req.json();

    console.log(`Processando entrega validada: ${entrega_id}`);

    // 1. Buscar a entrega e seus itens vinculados
    const { data: entrega, error: entregaError } = await supabaseClient
      .from('entregas_reciclaveis')
      .select('*, id_usuario, itens_vinculados')
      .eq('id', entrega_id)
      .single();

    if (entregaError || !entrega) {
      throw new Error(`Erro ao buscar entrega: ${entregaError?.message}`);
    }

    const itensVinculados = entrega.itens_vinculados as string[] || [];
    
    if (itensVinculados.length === 0) {
      console.log('Nenhum item vinculado encontrado');
      return new Response(
        JSON.stringify({ success: true, message: 'Entrega sem itens vinculados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Atualizando ${itensVinculados.length} itens vinculados`);

    // 2. Atualizar status de todos os itens vinculados para 'entregue'
    const { error: updateError } = await supabaseClient
      .from('materiais_reciclaveis_usuario')
      .update({
        status: 'entregue',
        data_entrega: new Date().toISOString(),
        id_entrega: entrega_id
      })
      .in('id', itensVinculados);

    if (updateError) {
      throw new Error(`Erro ao atualizar materiais: ${updateError.message}`);
    }

    // 3. Criar notificação para o usuário
    const { error: notifError } = await supabaseClient
      .from('notificacoes')
      .insert({
        id_usuario: entrega.id_usuario,
        tipo: 'entrega_validada',
        mensagem: `Sua entrega de ${itensVinculados.length} item(ns) foi validada com sucesso! Peso total: ${peso_validado}kg. Você ganhou pontos!`
      });

    if (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

    console.log(`Entrega ${entrega_id} processada com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        itens_atualizados: itensVinculados.length,
        peso_validado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao processar entrega:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});