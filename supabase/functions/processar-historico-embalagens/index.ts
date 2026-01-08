import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ItemNotaFiscal {
  gtin?: string;
  nome?: string;
  descricao?: string;
  tipo_embalagem?: string;
  percentual_reciclabilidade?: number;
  produto_cadastrado?: boolean;
  produto_ciclik?: {
    id: string;
    tipo_embalagem: string;
    percentual_reciclabilidade: number;
  };
}

interface NotaFiscal {
  id: string;
  id_usuario: string;
  itens_enriquecidos: ItemNotaFiscal[];
  data_envio: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[processar-historico-embalagens] Iniciando processamento para impacto_bruto...');

    // Buscar todas as notas fiscais com itens enriquecidos
    const { data: notas, error: notasError } = await supabase
      .from('notas_fiscais')
      .select('id, id_usuario, itens_enriquecidos, data_envio')
      .not('itens_enriquecidos', 'is', null)
      .order('data_envio', { ascending: true });

    if (notasError) {
      console.error('[processar-historico-embalagens] Erro ao buscar notas fiscais:', notasError);
      throw notasError;
    }

    console.log(`[processar-historico-embalagens] ${notas?.length || 0} notas fiscais encontradas`);

    let impactosRegistrados = 0;
    let impactosPulados = 0; // Já atribuídos no sistema legado
    let erros = 0;
    const resultados = [];

    for (const nota of (notas || []) as NotaFiscal[]) {
      try {
        const itens = nota.itens_enriquecidos as ItemNotaFiscal[];
        
        if (!Array.isArray(itens) || itens.length === 0) {
          console.log(`[processar-historico-embalagens] Nota ${nota.id} sem itens`);
          continue;
        }

        // Filtrar apenas itens com produto cadastrado e GTIN
        const itensCadastrados = itens.filter(
          (item) => item.produto_cadastrado && item.gtin
        );

        if (itensCadastrados.length === 0) {
          console.log(`[processar-historico-embalagens] Nota ${nota.id} sem produtos cadastrados com GTIN`);
          continue;
        }

        // Para cada item cadastrado, verificar status no sistema legado e se já existe no impacto_bruto
        for (const item of itensCadastrados) {
          // NOVA VERIFICAÇÃO: Checar se este produto já foi atribuído no sistema legado
          const { data: estoqueLegado, error: estoqueError } = await supabase
            .from('estoque_embalagens')
            .select('id, status')
            .eq('gtin', item.gtin)
            .maybeSingle();

          if (estoqueError) {
            console.error(`[processar-historico-embalagens] Erro ao verificar estoque legado:`, estoqueError);
          }

          // Se já atribuído no sistema legado, PULAR - não migrar
          if (estoqueLegado?.status === 'atribuido') {
            console.log(`[processar-historico-embalagens] ⏭️ Pulando ${item.gtin} - já atribuído no sistema legado`);
            impactosPulados++;
            continue;
          }

          const { data: existente, error: checkError } = await supabase
            .from('impacto_bruto')
            .select('id')
            .eq('gtin', item.gtin)
            .eq('id_nota_fiscal', nota.id)
            .eq('tipo', 'produto')
            .maybeSingle();

          if (checkError) {
            console.error(`[processar-historico-embalagens] Erro ao verificar existência:`, checkError);
            continue;
          }

          // Se não existe, inserir no impacto_bruto (1 UIB por produto catalogado)
          if (!existente) {
            const { error: insertError } = await supabase
              .from('impacto_bruto')
              .insert({
                tipo: 'produto',
                valor_bruto: 1, // Sempre 1 UIB por produto catalogado
                id_usuario: nota.id_usuario,
                id_nota_fiscal: nota.id,
                gtin: item.gtin,
                data_hora: nota.data_envio,
                descricao_origem: `Migração histórica - ${item.nome || item.descricao || 'Produto'} (${item.gtin})`,
                processado: false
              });

            if (insertError) {
              console.error(`[processar-historico-embalagens] Erro ao inserir impacto:`, insertError);
              erros++;
            } else {
              impactosRegistrados++;
              console.log(`[processar-historico-embalagens] ✅ Impacto registrado: ${item.gtin} - ${item.nome || item.descricao}`);
            }
          }
        }

        resultados.push({
          id_nota: nota.id,
          itens_processados: itensCadastrados.length,
          status: 'processado'
        });

      } catch (error) {
        console.error(`[processar-historico-embalagens] Erro ao processar nota ${nota.id}:`, error);
        erros++;
        resultados.push({
          id_nota: nota.id,
          status: 'erro',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`[processar-historico-embalagens] Processamento concluído:`);
    console.log(`  ✅ ${impactosRegistrados} impactos registrados em impacto_bruto`);
    console.log(`  ⏭️ ${impactosPulados} impactos pulados (já atribuídos no sistema legado)`);
    console.log(`  ❌ ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        notas_processadas: notas?.length || 0,
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
    console.error('[processar-historico-embalagens] Erro geral:', error);
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
