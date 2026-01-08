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

    console.log('[calcular-pontos-esperados] Calculando pontos para usuário:', userId);

    // Buscar configurações de pontos
    const { data: configs } = await supabaseClient
      .from('configuracoes_sistema')
      .select('chave, valor')
      .in('chave', [
        'pontos_missao_completa',
        'pontos_material_cadastro_nota',
        'pontos_material_cadastro_manual',
        'pontos_nota_fiscal_validada',
        'pontos_indicacao_cadastro',
        'pontos_indicacao_primeira_missao'
      ]);

    const configMap = configs?.reduce((acc, c) => {
      acc[c.chave] = parseInt(c.valor);
      return acc;
    }, {} as Record<string, number>) || {};

    let totalPontos = 0;
    const detalhes: any[] = [];

    // 1. Pontos de missões concluídas
    const { data: missoes, count: missoesCount } = await supabaseClient
      .from('missoes_usuarios')
      .select('*', { count: 'exact' })
      .eq('id_usuario', userId);

    if (missoesCount) {
      const pontosMissoes = missoesCount * (configMap.pontos_missao_completa || 5);
      totalPontos += pontosMissoes;
      detalhes.push({
        tipo: 'missoes_concluidas',
        quantidade: missoesCount,
        pontos_unitarios: configMap.pontos_missao_completa || 5,
        pontos_totais: pontosMissoes
      });
    }

    // 2. Pontos de notas fiscais validadas
    const { data: notas, count: notasCount } = await supabaseClient
      .from('notas_fiscais')
      .select('*', { count: 'exact' })
      .eq('id_usuario', userId)
      .eq('status_validacao', 'validada');

    if (notasCount) {
      const pontosNotas = notasCount * (configMap.pontos_nota_fiscal_validada || 50);
      totalPontos += pontosNotas;
      detalhes.push({
        tipo: 'notas_fiscais_validadas',
        quantidade: notasCount,
        pontos_unitarios: configMap.pontos_nota_fiscal_validada || 50,
        pontos_totais: pontosNotas
      });
    }

    // 3. Pontos de materiais cadastrados
    const { data: materiais } = await supabaseClient
      .from('materiais_reciclaveis_usuario')
      .select('origem_cadastro')
      .eq('id_usuario', userId);

    if (materiais && materiais.length > 0) {
      const materiaisNota = materiais.filter(m => m.origem_cadastro === 'nota_fiscal').length;
      const materiaisManual = materiais.filter(m => m.origem_cadastro === 'manual').length;

      if (materiaisNota > 0) {
        const pontosMateriais = materiaisNota * (configMap.pontos_material_cadastro_nota || 5);
        totalPontos += pontosMateriais;
        detalhes.push({
          tipo: 'materiais_cadastro_nota',
          quantidade: materiaisNota,
          pontos_unitarios: configMap.pontos_material_cadastro_nota || 5,
          pontos_totais: pontosMateriais
        });
      }

      if (materiaisManual > 0) {
        const pontosMateriais = materiaisManual * (configMap.pontos_material_cadastro_manual || 1);
        totalPontos += pontosMateriais;
        detalhes.push({
          tipo: 'materiais_cadastro_manual',
          quantidade: materiaisManual,
          pontos_unitarios: configMap.pontos_material_cadastro_manual || 1,
          pontos_totais: pontosMateriais
        });
      }
    }

    // 4. Pontos de entregas validadas (variacoes_peso_entrega)
    const { data: entregas } = await supabaseClient
      .from('variacoes_peso_entrega')
      .select('pontos_aplicados')
      .eq('id_usuario', userId);

    if (entregas && entregas.length > 0) {
      const pontosEntregas = entregas.reduce((sum, e) => sum + (e.pontos_aplicados || 0), 0);
      totalPontos += pontosEntregas;
      detalhes.push({
        tipo: 'entregas_validadas',
        quantidade: entregas.length,
        pontos_totais: pontosEntregas
      });
    }

    // 5. Pontos como indicador (quem indicou outros)
    const { data: indicacoes } = await supabaseClient
      .from('indicacoes')
      .select('pontos_cadastro_concedidos, pontos_primeira_missao_concedidos')
      .eq('id_indicador', userId);

    if (indicacoes && indicacoes.length > 0) {
      const pontosCadastro = indicacoes.filter(i => i.pontos_cadastro_concedidos).length * 
        (configMap.pontos_indicacao_cadastro || 40);
      const pontosPrimeiraMissao = indicacoes.filter(i => i.pontos_primeira_missao_concedidos).length * 
        (configMap.pontos_indicacao_primeira_missao || 20);
      
      const pontosIndicacoes = pontosCadastro + pontosPrimeiraMissao;
      totalPontos += pontosIndicacoes;
      
      if (pontosIndicacoes > 0) {
        detalhes.push({
          tipo: 'indicacoes',
          quantidade: indicacoes.length,
          pontos_totais: pontosIndicacoes,
          detalhamento: {
            pontos_cadastro: pontosCadastro,
            pontos_primeira_missao: pontosPrimeiraMissao
          }
        });
      }
    }

    // 6. Subtrair pontos gastos em resgates de cupons
    const { data: resgates } = await supabaseClient
      .from('cupons_resgates')
      .select('pontos_utilizados')
      .eq('id_usuario', userId);

    let pontosGastos = 0;
    if (resgates && resgates.length > 0) {
      pontosGastos = resgates.reduce((sum, r) => sum + (r.pontos_utilizados || 0), 0);
      totalPontos -= pontosGastos;
      detalhes.push({
        tipo: 'cupons_resgatados',
        quantidade: resgates.length,
        pontos_totais: -pontosGastos
      });
    }

    console.log('[calcular-pontos-esperados] Pontos calculados:', totalPontos);

    return new Response(
      JSON.stringify({
        success: true,
        pontos_esperados: totalPontos,
        detalhes
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[calcular-pontos-esperados] Erro:', error);
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
