import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Missao {
  id: string;
  titulo: string;
  duracao_minutos: number;
  video_url: string | null;
}

interface MissaoUsuario {
  id: string;
  id_usuario: string;
  id_missao: string;
  data_conclusao: string;
  missoes: Missao;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎓 Iniciando processamento de histórico de educação para impacto_bruto...');

    // Buscar todas as missões concluídas
    const { data: missoesUsuarios, error: fetchError } = await supabase
      .from('missoes_usuarios')
      .select(`
        id,
        id_usuario,
        id_missao,
        data_conclusao,
        missoes (
          id,
          titulo,
          duracao_minutos,
          video_url
        )
      `)
      .returns<MissaoUsuario[]>();

    if (fetchError) {
      console.error('Erro ao buscar missões de usuários:', fetchError);
      throw fetchError;
    }

    console.log(`📚 Encontradas ${missoesUsuarios?.length || 0} missões concluídas`);

    let registrados = 0;
    let pulados = 0; // Já atribuídos no sistema legado
    let erros = 0;
    const resultados = [];

    for (const missaoUsuario of missoesUsuarios || []) {
      // NOVA VERIFICAÇÃO: Checar se esta educação já foi atribuída no sistema legado
      const { data: estoqueLegado, error: estoqueError } = await supabase
        .from('estoque_educacao')
        .select('id, status')
        .eq('id_usuario', missaoUsuario.id_usuario)
        .eq('id_missao', missaoUsuario.id_missao)
        .maybeSingle();

      if (estoqueError) {
        console.error(`Erro ao verificar estoque legado:`, estoqueError);
      }

      // Se já atribuído no sistema legado, PULAR - não migrar
      if (estoqueLegado?.status === 'atribuido') {
        console.log(`⏭️ Pulando missão ${missaoUsuario.id_missao} para usuário ${missaoUsuario.id_usuario} - já atribuída no sistema legado`);
        pulados++;
        continue;
      }

      // Verificar se já existe registro no impacto_bruto
      const { data: existente } = await supabase
        .from('impacto_bruto')
        .select('id')
        .eq('id_usuario', missaoUsuario.id_usuario)
        .eq('id_missao', missaoUsuario.id_missao)
        .eq('tipo', 'educacao')
        .maybeSingle();

      if (existente) {
        console.log(`⏭️ Missão ${missaoUsuario.id_missao} já registrada no impacto_bruto para usuário ${missaoUsuario.id_usuario}`);
        continue;
      }

      // Extrair video_id da URL do YouTube se existir
      let videoId = null;
      if (missaoUsuario.missoes?.video_url) {
        const urlMatch = missaoUsuario.missoes.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        videoId = urlMatch ? urlMatch[1] : null;
      }

      // Inserir no impacto_bruto
      const { error: insertError } = await supabase
        .from('impacto_bruto')
        .insert({
          tipo: 'educacao',
          valor_bruto: missaoUsuario.missoes?.duracao_minutos || 10,
          id_usuario: missaoUsuario.id_usuario,
          id_missao: missaoUsuario.id_missao,
          video_id: videoId,
          data_hora: missaoUsuario.data_conclusao,
          descricao_origem: `Migração histórica - ${missaoUsuario.missoes?.titulo || 'Missão educacional'}`,
          processado: false
        });

      if (insertError) {
        console.error(`❌ Erro ao registrar missão ${missaoUsuario.id_missao}:`, insertError);
        erros++;
        resultados.push({
          id_usuario: missaoUsuario.id_usuario,
          id_missao: missaoUsuario.id_missao,
          status: 'erro',
          erro: insertError.message
        });
      } else {
        console.log(`✅ Registrada missão ${missaoUsuario.id_missao} para usuário ${missaoUsuario.id_usuario}`);
        registrados++;
        resultados.push({
          id_usuario: missaoUsuario.id_usuario,
          id_missao: missaoUsuario.id_missao,
          status: 'sucesso'
        });
      }
    }

    console.log(`🎯 Processamento concluído:`);
    console.log(`  ✅ ${registrados} registrados em impacto_bruto`);
    console.log(`  ⏭️ ${pulados} pulados (já atribuídos no sistema legado)`);
    console.log(`  ❌ ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        total_missoes: missoesUsuarios?.length || 0,
        registrados,
        pulados,
        erros,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
