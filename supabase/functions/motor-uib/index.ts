import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface SaldoParcial {
  tipo: string;
  saldo_decimal: number;
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Motor UIB iniciado...');

    const tiposImpacto = ['residuo', 'educacao', 'produto'];
    const resultados = {
      residuo: { processados: 0, uibsGeradas: 0 },
      educacao: { processados: 0, uibsGeradas: 0 },
      produto: { processados: 0, uibsGeradas: 0 },
    };

    for (const tipo of tiposImpacto) {
      console.log(`\n📊 Processando tipo: ${tipo}`);

      // 1. Buscar impactos brutos não processados
      const { data: impactosBrutos, error: impactosError } = await supabase
        .from('impacto_bruto')
        .select('*')
        .eq('tipo', tipo)
        .eq('processado', false)
        .order('data_hora', { ascending: true });

      if (impactosError) {
        console.error(`Erro ao buscar impactos ${tipo}:`, impactosError);
        continue;
      }

      if (!impactosBrutos || impactosBrutos.length === 0) {
        console.log(`Nenhum impacto bruto pendente para ${tipo}`);
        continue;
      }

      console.log(`Encontrados ${impactosBrutos.length} impactos brutos para ${tipo}`);

      // 2. Buscar saldo parcial atual
      const { data: saldoData, error: saldoError } = await supabase
        .from('saldo_parcial')
        .select('*')
        .eq('tipo', tipo)
        .single();

      let saldoAtual = saldoData?.saldo_decimal || 0;
      console.log(`Saldo parcial atual para ${tipo}: ${saldoAtual}`);

      // 3. Somar todos os valores brutos
      let totalValorBruto = 0;
      const idsOrigem: string[] = [];
      
      for (const impacto of impactosBrutos) {
        totalValorBruto += Number(impacto.valor_bruto);
        idsOrigem.push(impacto.id);
      }

      console.log(`Total valor bruto: ${totalValorBruto}`);

      // 4. Calcular UIBs a gerar (cada UIB = 1 unidade)
      const totalComSaldo = saldoAtual + totalValorBruto;
      const uibsNovas = Math.floor(totalComSaldo);
      const novoSaldo = totalComSaldo - uibsNovas;

      console.log(`Total com saldo: ${totalComSaldo}, UIBs a gerar: ${uibsNovas}, Novo saldo: ${novoSaldo}`);

      // 5. Gerar UIBs (em lotes para não sobrecarregar)
      if (uibsNovas > 0) {
        const uibsToInsert = [];
        let idsUsados = 0;
        let valorAcumulado = 0;

        // Distribuir ids_origem entre as UIBs de forma FIFO
        for (let i = 0; i < uibsNovas; i++) {
          const idsParaEstaUIB: string[] = [];
          
          // Encontrar quais impactos formam esta UIB (valor >= 1)
          while (valorAcumulado < (i + 1) && idsUsados < idsOrigem.length) {
            idsParaEstaUIB.push(idsOrigem[idsUsados]);
            valorAcumulado += Number(impactosBrutos[idsUsados].valor_bruto);
            idsUsados++;
          }

          uibsToInsert.push({
            tipo: tipo,
            ids_origem: idsParaEstaUIB.length > 0 ? idsParaEstaUIB : [idsOrigem[Math.min(i, idsOrigem.length - 1)]],
            status: 'disponivel',
          });
        }

        // Inserir em lotes de 100
        const batchSize = 100;
        for (let i = 0; i < uibsToInsert.length; i += batchSize) {
          const batch = uibsToInsert.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('uib')
            .insert(batch);

          if (insertError) {
            console.error(`Erro ao inserir UIBs ${tipo}:`, insertError);
          }
        }

        resultados[tipo as keyof typeof resultados].uibsGeradas = uibsNovas;
        console.log(`✅ ${uibsNovas} UIBs geradas para ${tipo}`);
      }

      // 6. Atualizar saldo parcial
      const { error: updateSaldoError } = await supabase
        .from('saldo_parcial')
        .upsert({
          tipo: tipo,
          saldo_decimal: novoSaldo,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tipo' });

      if (updateSaldoError) {
        console.error(`Erro ao atualizar saldo ${tipo}:`, updateSaldoError);
      }

      // 7. Marcar impactos como processados
      const { error: updateImpactosError } = await supabase
        .from('impacto_bruto')
        .update({ processado: true })
        .in('id', idsOrigem);

      if (updateImpactosError) {
        console.error(`Erro ao marcar impactos ${tipo} como processados:`, updateImpactosError);
      }

      resultados[tipo as keyof typeof resultados].processados = idsOrigem.length;
    }

    // Resumo final
    const totalUIBs = resultados.residuo.uibsGeradas + resultados.educacao.uibsGeradas + resultados.produto.uibsGeradas;
    const totalProcessados = resultados.residuo.processados + resultados.educacao.processados + resultados.produto.processados;

    console.log(`\n🎯 Motor UIB finalizado:`);
    console.log(`   - Impactos processados: ${totalProcessados}`);
    console.log(`   - UIBs geradas: ${totalUIBs}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Motor UIB executado com sucesso',
        resultados,
        totais: {
          impactos_processados: totalProcessados,
          uibs_geradas: totalUIBs
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro no Motor UIB:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
