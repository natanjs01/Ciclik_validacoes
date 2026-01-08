import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração fixa do CDV
const CDV_CONFIG = {
  uib_residuos: 250,
  uib_educacao: 5,
  uib_produtos: 1,
  total_uib: 256
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { id_quota, id_projeto } = await req.json();

    if (!id_quota || !id_projeto) {
      return new Response(
        JSON.stringify({ success: false, error: 'id_quota e id_projeto são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🎯 Gerando CDV manual para quota ${id_quota} do projeto ${id_projeto}`);

    // 1. Verificar disponibilidade de UIBs
    const { data: uibsResiduos, error: errRes } = await supabase
      .from('uib')
      .select('id')
      .eq('tipo', 'residuo')
      .eq('status', 'disponivel')
      .order('numero_sequencial', { ascending: true })
      .limit(CDV_CONFIG.uib_residuos);

    const { data: uibsEducacao, error: errEdu } = await supabase
      .from('uib')
      .select('id')
      .eq('tipo', 'educacao')
      .eq('status', 'disponivel')
      .order('numero_sequencial', { ascending: true })
      .limit(CDV_CONFIG.uib_educacao);

    const { data: uibsProdutos, error: errProd } = await supabase
      .from('uib')
      .select('id')
      .eq('tipo', 'produto')
      .eq('status', 'disponivel')
      .order('numero_sequencial', { ascending: true })
      .limit(CDV_CONFIG.uib_produtos);

    // Validar disponibilidade
    const residuosDisponiveis = uibsResiduos?.length || 0;
    const educacaoDisponiveis = uibsEducacao?.length || 0;
    const produtosDisponiveis = uibsProdutos?.length || 0;

    if (residuosDisponiveis < CDV_CONFIG.uib_residuos) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `UIBs de resíduo insuficientes. Necessário: ${CDV_CONFIG.uib_residuos}, Disponível: ${residuosDisponiveis}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (educacaoDisponiveis < CDV_CONFIG.uib_educacao) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `UIBs de educação insuficientes. Necessário: ${CDV_CONFIG.uib_educacao}, Disponível: ${educacaoDisponiveis}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (produtosDisponiveis < CDV_CONFIG.uib_produtos) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `UIBs de produto insuficientes. Necessário: ${CDV_CONFIG.uib_produtos}, Disponível: ${produtosDisponiveis}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 2. Gerar número do CDV
    const ano = new Date().getFullYear();
    const { data: ultimoCdv } = await supabase
      .from('cdv_novo')
      .select('numero_cdv')
      .ilike('numero_cdv', `CDV-${ano}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequencial = 1;
    if (ultimoCdv?.numero_cdv) {
      const match = ultimoCdv.numero_cdv.match(/CDV-\d{4}-(\d+)/);
      if (match) {
        sequencial = parseInt(match[1]) + 1;
      }
    }
    const numeroCdv = `CDV-${ano}-${String(sequencial).padStart(6, '0')}`;

    // 3. Gerar hash de validação
    const hashValidacao = crypto.randomUUID().replace(/-/g, '').substring(0, 32).toUpperCase();

    // 4. Extrair IDs das UIBs
    const uibResiduosIds = uibsResiduos!.map(u => u.id);
    const uibEducacaoIds = uibsEducacao!.map(u => u.id);
    const uibProdutosIds = uibsProdutos!.map(u => u.id);

    // 5. Criar CDV
    const { data: cdvNovo, error: cdvError } = await supabase
      .from('cdv_novo')
      .insert({
        id_projeto,
        id_quota,
        numero_cdv: numeroCdv,
        uib_residuos_ids: uibResiduosIds,
        uib_educacao_ids: uibEducacaoIds,
        uib_produtos_ids: uibProdutosIds,
        total_uib_residuos: CDV_CONFIG.uib_residuos,
        total_uib_educacao: CDV_CONFIG.uib_educacao,
        total_uib_produtos: CDV_CONFIG.uib_produtos,
        total_uib: CDV_CONFIG.total_uib,
        status: 'completo',
        data_completo: new Date().toISOString(),
        hash_validacao: hashValidacao
      })
      .select()
      .single();

    if (cdvError) {
      console.error('Erro ao criar CDV:', cdvError);
      throw cdvError;
    }

    console.log(`✅ CDV ${numeroCdv} criado com sucesso`);

    // 6. Atualizar UIBs para status 'atribuida'
    const todasUibs = [...uibResiduosIds, ...uibEducacaoIds, ...uibProdutosIds];
    
    const { error: updateUibError } = await supabase
      .from('uib')
      .update({ 
        status: 'atribuida',
        id_cdv_novo: cdvNovo.id,
        id_projeto: id_projeto,
        data_atribuicao: new Date().toISOString()
      })
      .in('id', todasUibs);

    if (updateUibError) {
      console.error('Erro ao atualizar UIBs:', updateUibError);
    }

    // 7. Atualizar quota com referência ao CDV
    const { error: quotaError } = await supabase
      .from('cdv_quotas')
      .update({ 
        id_cdv_novo: cdvNovo.id,
        status: 'pronto',
        kg_conciliados: CDV_CONFIG.uib_residuos,
        horas_conciliadas: CDV_CONFIG.uib_educacao,
        embalagens_conciliadas: CDV_CONFIG.uib_produtos
      })
      .eq('id', id_quota);

    if (quotaError) {
      console.error('Erro ao atualizar quota:', quotaError);
    }

    console.log(`🎉 CDV ${numeroCdv} vinculado à quota ${id_quota}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `CDV ${numeroCdv} gerado e vinculado com sucesso`,
        cdv: {
          id: cdvNovo.id,
          numero_cdv: numeroCdv,
          hash_validacao: hashValidacao,
          total_uib: CDV_CONFIG.total_uib,
          uib_residuos: CDV_CONFIG.uib_residuos,
          uib_educacao: CDV_CONFIG.uib_educacao,
          uib_produtos: CDV_CONFIG.uib_produtos
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao gerar CDV manual:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
