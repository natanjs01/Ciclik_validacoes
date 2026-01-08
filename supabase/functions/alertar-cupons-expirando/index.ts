import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Cupom {
  id: string;
  marketplace: string;
  codigo: string;
  valor_reais: number;
  pontos_necessarios: number;
  data_validade: string;
  quantidade_disponivel: number;
}

interface Profile {
  id: string;
  nome: string;
  score_verde: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Iniciando verificação de cupons expirando...');

    // Calcular datas: hoje e daqui a 3 dias
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const daquiTresDias = new Date();
    daquiTresDias.setDate(daquiTresDias.getDate() + 3);
    daquiTresDias.setHours(23, 59, 59, 999);

    // Buscar cupons que expiram nos próximos 3 dias
    const { data: cuponsExpirando, error: cuponsError } = await supabase
      .from('cupons')
      .select('id, marketplace, codigo, valor_reais, pontos_necessarios, data_validade, quantidade_disponivel')
      .eq('status', 'disponivel')
      .eq('ativo', true)
      .gt('quantidade_disponivel', 0)
      .gte('data_validade', hoje.toISOString().split('T')[0])
      .lte('data_validade', daquiTresDias.toISOString().split('T')[0]);

    if (cuponsError) {
      console.error('Erro ao buscar cupons:', cuponsError);
      throw cuponsError;
    }

    if (!cuponsExpirando || cuponsExpirando.length === 0) {
      console.log('Nenhum cupom expirando nos próximos 3 dias');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum cupom expirando',
          cuponsVerificados: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontrados ${cuponsExpirando.length} cupons expirando`);

    // Buscar todos os usuários (pessoas físicas)
    const { data: usuarios, error: usuariosError } = await supabase
      .from('profiles')
      .select('id, nome, score_verde')
      .eq('tipo_pessoa', 'PF');

    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError);
      throw usuariosError;
    }

    console.log(`Encontrados ${usuarios?.length || 0} usuários`);

    let notificacoesEnviadas = 0;
    const notificacoes: any[] = [];

    // Para cada cupom, verificar quais usuários têm pontos suficientes
    for (const cupom of cuponsExpirando as Cupom[]) {
      const diasRestantes = Math.ceil(
        (new Date(cupom.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      const usuariosElegiveis = usuarios?.filter(
        (usuario: Profile) => usuario.score_verde >= cupom.pontos_necessarios
      ) || [];

      console.log(
        `Cupom ${cupom.marketplace} (${cupom.pontos_necessarios} pts): ${usuariosElegiveis.length} usuários elegíveis`
      );

      for (const usuario of usuariosElegiveis) {
        const mensagem = diasRestantes === 0
          ? `⏰ ÚLTIMO DIA! Cupom ${cupom.marketplace} de R$ ${cupom.valor_reais.toFixed(2)} expira HOJE! Você tem ${usuario.score_verde} pontos (necessário: ${cupom.pontos_necessarios}). Resgate agora! 🎁`
          : `⏰ Atenção! Cupom ${cupom.marketplace} de R$ ${cupom.valor_reais.toFixed(2)} expira em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}! Você tem pontos suficientes para resgatar (${cupom.pontos_necessarios} pts). 🎁`;

        notificacoes.push({
          id_usuario: usuario.id,
          tipo: 'cupom_expirando',
          mensagem: mensagem
        });
      }
    }

    // Inserir todas as notificações de uma vez
    if (notificacoes.length > 0) {
      const { error: notifError } = await supabase
        .from('notificacoes')
        .insert(notificacoes);

      if (notifError) {
        console.error('Erro ao inserir notificações:', notifError);
        throw notifError;
      }

      notificacoesEnviadas = notificacoes.length;
      console.log(`${notificacoesEnviadas} notificações enviadas com sucesso`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cuponsExpirando: cuponsExpirando.length,
        notificacoesEnviadas: notificacoesEnviadas,
        detalhes: cuponsExpirando.map((c: Cupom) => ({
          marketplace: c.marketplace,
          valor: c.valor_reais,
          expira_em: c.data_validade
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Erro na função alertar-cupons-expirando:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
