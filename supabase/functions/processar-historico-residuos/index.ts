import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface MaterialColetado {
  id: string;
  id_entrega: string;
  id_cooperativa: string;
  tipo_material: string;
  subtipo_material: string;
  peso_kg: number;
  registrado_em: string;
}

interface EntregaFinalizada {
  id: string;
  id_usuario: string;
  id_cooperativa: string;
  data_validacao: string;
  status_promessa: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[processar-historico-residuos] Iniciando processamento para impacto_bruto...');

    // Buscar todas as entregas finalizadas
    const { data: entregas, error: entregasError } = await supabase
      .from('entregas_reciclaveis')
      .select('id, id_usuario, id_cooperativa, data_validacao, status_promessa')
      .eq('status_promessa', 'finalizada')
      .order('data_validacao', { ascending: true });

    if (entregasError) {
      console.error('[processar-historico-residuos] Erro ao buscar entregas:', entregasError);
      throw entregasError;
    }

    console.log(`[processar-historico-residuos] ${entregas?.length || 0} entregas finalizadas encontradas`);

    let impactosRegistrados = 0;
    let impactosPulados = 0; // Já atribuídos no sistema legado
    let erros = 0;
    const resultados = [];

    for (const entrega of (entregas || [])) {
      try {
        // Buscar materiais coletados desta entrega (excluindo REJEITO)
        const { data: materiais, error: materiaisError } = await supabase
          .from('materiais_coletados_detalhado')
          .select('id, tipo_material, subtipo_material, peso_kg, registrado_em, id_cooperativa')
          .eq('id_entrega', entrega.id)
          .neq('subtipo_material', 'REJEITO');

        if (materiaisError) {
          console.error(`[processar-historico-residuos] Erro ao buscar materiais da entrega ${entrega.id}:`, materiaisError);
          erros++;
          continue;
        }

        if (!materiais || materiais.length === 0) {
          console.log(`[processar-historico-residuos] Entrega ${entrega.id} sem materiais coletados`);
          continue;
        }

        // Para cada material, verificar status no sistema legado e se já existe no impacto_bruto
        for (const material of materiais) {
          // NOVA VERIFICAÇÃO: Checar se este impacto já foi atribuído no sistema legado
          const { data: estoqueLegado, error: estoqueError } = await supabase
            .from('estoque_residuos')
            .select('id, status')
            .eq('id_entrega', entrega.id)
            .eq('submaterial', material.subtipo_material)
            .maybeSingle();

          if (estoqueError) {
            console.error(`[processar-historico-residuos] Erro ao verificar estoque legado:`, estoqueError);
          }

          // Se já atribuído no sistema legado, PULAR - não migrar
          if (estoqueLegado?.status === 'atribuido') {
            console.log(`[processar-historico-residuos] ⏭️ Pulando ${material.subtipo_material} ${material.peso_kg}kg - já atribuído no sistema legado`);
            impactosPulados++;
            continue;
          }

          // Verificar se já existe no impacto_bruto
          const { data: existente, error: checkError } = await supabase
            .from('impacto_bruto')
            .select('id')
            .eq('id_entrega', entrega.id)
            .eq('submaterial', material.subtipo_material)
            .eq('valor_bruto', material.peso_kg)
            .eq('tipo', 'residuo')
            .maybeSingle();

          if (checkError) {
            console.error(`[processar-historico-residuos] Erro ao verificar existência:`, checkError);
            continue;
          }

          // Se não existe, inserir no impacto_bruto
          if (!existente) {
            const { error: insertError } = await supabase
              .from('impacto_bruto')
              .insert({
                tipo: 'residuo',
                valor_bruto: material.peso_kg,
                id_usuario: entrega.id_usuario,
                id_cooperativa: entrega.id_cooperativa || material.id_cooperativa,
                id_entrega: entrega.id,
                submaterial: material.subtipo_material,
                data_hora: entrega.data_validacao || material.registrado_em,
                descricao_origem: `Migração histórica - ${material.tipo_material}/${material.subtipo_material}`,
                processado: false
              });

            if (insertError) {
              console.error(`[processar-historico-residuos] Erro ao inserir impacto:`, insertError);
              erros++;
            } else {
              impactosRegistrados++;
              console.log(`[processar-historico-residuos] ✅ Impacto registrado: ${material.subtipo_material} - ${material.peso_kg}kg`);
            }
          }
        }

        resultados.push({
          id_entrega: entrega.id,
          materiais_processados: materiais.length,
          status: 'processado'
        });

      } catch (error) {
        console.error(`[processar-historico-residuos] Erro ao processar entrega ${entrega.id}:`, error);
        erros++;
        resultados.push({
          id_entrega: entrega.id,
          status: 'erro',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`[processar-historico-residuos] Processamento concluído:`);
    console.log(`  ✅ ${impactosRegistrados} impactos registrados em impacto_bruto`);
    console.log(`  ⏭️ ${impactosPulados} impactos pulados (já atribuídos no sistema legado)`);
    console.log(`  ❌ ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        entregas_processadas: entregas?.length || 0,
        impactos_registrados: impactosRegistrados,
        impactos_pulados: impactosPulados,
        erros,
        resultados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[processar-historico-residuos] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
