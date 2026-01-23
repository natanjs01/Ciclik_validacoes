import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from './useUserPoints';

interface MetasConfig {
  missoes_semanal: number;
  missoes_mensal: number;
  notas_semanal: number;
  notas_mensal: number;
  entregas_semanal: number;
  entregas_mensal: number;
  indicacoes_semanal: number;
  indicacoes_mensal: number;
}

interface ProgressoAtividade {
  atual: number;
  metaSemanal: number;
  metaMensal: number;
  progressoSemanal: number;
  progressoMensal: number;
}

interface GamificationProgress {
  missoes: ProgressoAtividade;
  notas: ProgressoAtividade;
  entregas: ProgressoAtividade;
  indicacoes: ProgressoAtividade;
  pontosMes: number;
  nivel: string;
  proximoNivel: string;
  pontosParaProximoNivel: number;
  progressoNivel: number;
  diasRestantesSemana: number;
  diasRestantesMes: number;
  mensagemIncentivo: string;
  expressaoAssistente: 'feliz' | 'animado' | 'preocupado' | 'celebrando';
  metaEmRisco: string | null;
  metaProxima: string | null;
}

const defaultProgress: GamificationProgress = {
  missoes: { atual: 0, metaSemanal: 3, metaMensal: 10, progressoSemanal: 0, progressoMensal: 0 },
  notas: { atual: 0, metaSemanal: 1, metaMensal: 4, progressoSemanal: 0, progressoMensal: 0 },
  entregas: { atual: 0, metaSemanal: 1, metaMensal: 4, progressoSemanal: 0, progressoMensal: 0 },
  indicacoes: { atual: 0, metaSemanal: 1, metaMensal: 3, progressoSemanal: 0, progressoMensal: 0 },
  pontosMes: 0,
  nivel: 'Iniciante',
  proximoNivel: 'Protetor Ciclik',
  pontosParaProximoNivel: 500,
  progressoNivel: 0,
  diasRestantesSemana: 7,
  diasRestantesMes: 30,
  mensagemIncentivo: 'Bem-vindo! Vamos começar sua jornada sustentável! 🌱',
  expressaoAssistente: 'feliz',
  metaEmRisco: null,
  metaProxima: null,
};

export function useGamificationProgress(): GamificationProgress & { loading: boolean; refetch: () => Promise<void> } {
  const { user, profile } = useAuth();
  const { pontos: pontosMes } = useUserPoints();
  const [progress, setProgress] = useState<GamificationProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);

  const getNivelConfig = (nivel: string): 'basico' | 'intermediario' | 'avancado' => {
    switch (nivel) {
      case 'Iniciante': return 'basico';
      case 'Ativo': return 'intermediario';
      case 'Guardiao Verde': return 'avancado';
      default: return 'basico';
    }
  };

  const calcularDiasRestantes = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diasRestantesSemana = diaSemana === 0 ? 0 : 7 - diaSemana;
    
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const diasRestantesMes = ultimoDiaMes.getDate() - hoje.getDate();
    
    return { diasRestantesSemana, diasRestantesMes };
  };

  const gerarMensagemIncentivo = (
    progressData: Partial<GamificationProgress>,
    diasSemana: number,
    diasMes: number
  ): { mensagem: string; expressao: 'feliz' | 'animado' | 'preocupado' | 'celebrando'; metaEmRisco: string | null; metaProxima: string | null } => {
    
    const atividades = [
      { nome: 'missões', dados: progressData.missoes, emoji: '📚' },
      { nome: 'notas fiscais', dados: progressData.notas, emoji: '📝' },
      { nome: 'entregas', dados: progressData.entregas, emoji: '♻️' },
      { nome: 'indicações', dados: progressData.indicacoes, emoji: '👥' },
    ];

    // Verificar metas completadas
    const metasSemanaisCompletas = atividades.filter(a => a.dados && a.dados.progressoSemanal >= 100);
    const metasMensaisCompletas = atividades.filter(a => a.dados && a.dados.progressoMensal >= 100);

    if (metasSemanaisCompletas.length === 4) {
      return {
        mensagem: '🎉 Incrível! Você bateu TODAS as metas da semana! Continue assim!',
        expressao: 'celebrando',
        metaEmRisco: null,
        metaProxima: null,
      };
    }

    // Verificar meta próxima de ser atingida (>= 80%)
    const metaQuaseAtingida = atividades.find(a => 
      a.dados && a.dados.progressoSemanal >= 80 && a.dados.progressoSemanal < 100
    );
    if (metaQuaseAtingida) {
      const falta = metaQuaseAtingida.dados!.metaSemanal - metaQuaseAtingida.dados!.atual;
      return {
        mensagem: `${metaQuaseAtingida.emoji} Falta só ${falta} ${metaQuaseAtingida.nome} para bater sua meta semanal! Vamos lá? 🎯`,
        expressao: 'animado',
        metaEmRisco: null,
        metaProxima: metaQuaseAtingida.nome,
      };
    }

    // Verificar metas em risco (pouco tempo + pouco progresso)
    if (diasSemana <= 2) {
      const metaEmRisco = atividades.find(a => 
        a.dados && a.dados.progressoSemanal < 50
      );
      if (metaEmRisco) {
        return {
          mensagem: `⏰ O final da semana está chegando! Complete mais ${metaEmRisco.nome} para garantir sua meta. 💪`,
          expressao: 'preocupado',
          metaEmRisco: metaEmRisco.nome,
          metaProxima: null,
        };
      }
    }

    // Mensagem sobre próximo nível
    if (progressData.pontosParaProximoNivel && progressData.pontosParaProximoNivel <= 100) {
      return {
        mensagem: `🚀 Você está a apenas ${progressData.pontosParaProximoNivel} pontos de subir para ${progressData.proximoNivel}!`,
        expressao: 'animado',
        metaEmRisco: null,
        metaProxima: null,
      };
    }

    // Sugerir atividade com menor progresso
    const menorProgresso = atividades
      .filter(a => a.dados && a.dados.progressoSemanal < 100)
      .sort((a, b) => (a.dados?.progressoSemanal || 0) - (b.dados?.progressoSemanal || 0))[0];

    if (menorProgresso && menorProgresso.dados) {
      const sugestoes = {
        missões: 'Que tal aprender algo novo com uma aula educacional?',
        'notas fiscais': 'Escaneie suas notas fiscais para catalogar embalagens!',
        entregas: 'Separe seus recicláveis e agende uma entrega!',
        indicações: 'Convide amigos para o Ciclik e ganhe pontos extras!',
      };
      return {
        mensagem: `${menorProgresso.emoji} ${sugestoes[menorProgresso.nome as keyof typeof sugestoes]}`,
        expressao: 'feliz',
        metaEmRisco: null,
        metaProxima: null,
      };
    }

    return {
      mensagem: 'Continue sua jornada sustentável! Cada ação faz a diferença 🌍',
      expressao: 'feliz',
      metaEmRisco: null,
      metaProxima: null,
    };
  };

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cache de 45 segundos para evitar múltiplas consultas em mobile
    const cacheKey = `gamification_cache_${user.id}`;
    const lastFetchKey = `gamification_last_fetch_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    const lastFetch = sessionStorage.getItem(lastFetchKey);
    
    if (cached && lastFetch) {
      const cacheAge = Date.now() - parseInt(lastFetch);
      if (cacheAge < 45000) { // 45 segundos
        const cachedData = JSON.parse(cached);
        setProgress(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const nivelConfig = getNivelConfig(profile?.nivel || 'Iniciante');
      
      // Buscar configurações de metas
      const { data: configs } = await supabase
        .from('configuracoes_sistema')
        .select('chave, valor')
        .or(`chave.like.meta_semanal_%_${nivelConfig},chave.like.meta_mensal_%_${nivelConfig}`);

      const metas: MetasConfig = {
        missoes_semanal: 3,
        missoes_mensal: 10,
        notas_semanal: 1,
        notas_mensal: 4,
        entregas_semanal: 1,
        entregas_mensal: 4,
        indicacoes_semanal: 1,
        indicacoes_mensal: 3,
      };

      configs?.forEach(c => {
        if (c.chave.includes('missoes') && c.chave.includes('semanal')) metas.missoes_semanal = parseInt(c.valor);
        if (c.chave.includes('missoes') && c.chave.includes('mensal')) metas.missoes_mensal = parseInt(c.valor);
        if (c.chave.includes('notas') && c.chave.includes('semanal')) metas.notas_semanal = parseInt(c.valor);
        if (c.chave.includes('notas') && c.chave.includes('mensal')) metas.notas_mensal = parseInt(c.valor);
        if (c.chave.includes('entregas') && c.chave.includes('semanal')) metas.entregas_semanal = parseInt(c.valor);
        if (c.chave.includes('entregas') && c.chave.includes('mensal')) metas.entregas_mensal = parseInt(c.valor);
        if (c.chave.includes('indicacoes') && c.chave.includes('semanal')) metas.indicacoes_semanal = parseInt(c.valor);
        if (c.chave.includes('indicacoes') && c.chave.includes('mensal')) metas.indicacoes_mensal = parseInt(c.valor);
      });

      // Datas da semana e mês
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Buscar progresso real das atividades (em paralelo)
      const [missoesSemana, missoesMes, notasSemana, notasMes, entregasSemana, entregasMes, indicacoesSemana, indicacoesMes] = await Promise.all([
        supabase.from('missoes_usuarios').select('id', { count: 'exact' }).eq('id_usuario', user.id).gte('data_conclusao', inicioSemana.toISOString()),
        supabase.from('missoes_usuarios').select('id', { count: 'exact' }).eq('id_usuario', user.id).gte('data_conclusao', inicioMes.toISOString()),
        supabase.from('notas_fiscais').select('id', { count: 'exact' }).eq('id_usuario', user.id).eq('status_validacao', 'validada').gte('data_envio', inicioSemana.toISOString()),
        supabase.from('notas_fiscais').select('id', { count: 'exact' }).eq('id_usuario', user.id).eq('status_validacao', 'validada').gte('data_envio', inicioMes.toISOString()),
        supabase.from('entregas_reciclaveis').select('id', { count: 'exact' }).eq('id_usuario', user.id).eq('status', 'validada').gte('data_validacao', inicioSemana.toISOString()),
        supabase.from('entregas_reciclaveis').select('id', { count: 'exact' }).eq('id_usuario', user.id).eq('status', 'validada').gte('data_validacao', inicioMes.toISOString()),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('id_indicador', user.id).gte('data_indicacao', inicioSemana.toISOString()),
        supabase.from('indicacoes').select('id', { count: 'exact' }).eq('id_indicador', user.id).gte('data_indicacao', inicioMes.toISOString()),
      ]);

      const calcularProgresso = (atual: number, meta: number) => Math.min((atual / meta) * 100, 100);

      const missoesSemanaCount = missoesSemana.count || 0;
      const missoesMesCount = missoesMes.count || 0;
      const notasSemanaCount = notasSemana.count || 0;
      const notasMesCount = notasMes.count || 0;
      const entregasSemanaCount = entregasSemana.count || 0;
      const entregasMesCount = entregasMes.count || 0;
      const indicacoesSemanaCount = indicacoesSemana.count || 0;
      const indicacoesMesCount = indicacoesMes.count || 0;

      const progressData: Partial<GamificationProgress> = {
        missoes: {
          atual: missoesMesCount,
          metaSemanal: metas.missoes_semanal,
          metaMensal: metas.missoes_mensal,
          progressoSemanal: calcularProgresso(missoesSemanaCount, metas.missoes_semanal),
          progressoMensal: calcularProgresso(missoesMesCount, metas.missoes_mensal),
        },
        notas: {
          atual: notasMesCount,
          metaSemanal: metas.notas_semanal,
          metaMensal: metas.notas_mensal,
          progressoSemanal: calcularProgresso(notasSemanaCount, metas.notas_semanal),
          progressoMensal: calcularProgresso(notasMesCount, metas.notas_mensal),
        },
        entregas: {
          atual: entregasMesCount,
          metaSemanal: metas.entregas_semanal,
          metaMensal: metas.entregas_mensal,
          progressoSemanal: calcularProgresso(entregasSemanaCount, metas.entregas_semanal),
          progressoMensal: calcularProgresso(entregasMesCount, metas.entregas_mensal),
        },
        indicacoes: {
          atual: indicacoesMesCount,
          metaSemanal: metas.indicacoes_semanal,
          metaMensal: metas.indicacoes_mensal,
          progressoSemanal: calcularProgresso(indicacoesSemanaCount, metas.indicacoes_semanal),
          progressoMensal: calcularProgresso(indicacoesMesCount, metas.indicacoes_mensal),
        },
      };

      // Calcular nível e progresso
      const nivel = profile?.nivel || 'Iniciante';
      let proximoNivel = 'Protetor Ciclik';
      let pontosParaProximoNivel = 501 - pontosMes;
      let progressoNivel = (pontosMes / 500) * 100;

      if (pontosMes > 500 && pontosMes <= 1000) {
        proximoNivel = 'Guardião Ciclik';
        pontosParaProximoNivel = 1001 - pontosMes;
        progressoNivel = ((pontosMes - 500) / 500) * 100;
      } else if (pontosMes > 1000) {
        proximoNivel = 'Nível Máximo';
        pontosParaProximoNivel = 0;
        progressoNivel = 100;
      }

      const { diasRestantesSemana, diasRestantesMes } = calcularDiasRestantes();
      const { mensagem, expressao, metaEmRisco, metaProxima } = gerarMensagemIncentivo(
        { ...progressData, pontosParaProximoNivel, proximoNivel },
        diasRestantesSemana,
        diasRestantesMes
      );

      const finalProgress = {
        ...progressData as GamificationProgress,
        pontosMes,
        nivel,
        proximoNivel,
        pontosParaProximoNivel: Math.max(0, pontosParaProximoNivel),
        progressoNivel: Math.min(progressoNivel, 100),
        diasRestantesSemana,
        diasRestantesMes,
        mensagemIncentivo: mensagem,
        expressaoAssistente: expressao,
        metaEmRisco,
        metaProxima,
      };

      setProgress(finalProgress);
      
      // Salvar no cache
      if (user) {
        const cacheKey = `gamification_cache_${user.id}`;
        const lastFetchKey = `gamification_last_fetch_${user.id}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(finalProgress));
        sessionStorage.setItem(lastFetchKey, Date.now().toString());
      }

    } catch (error) {
      console.error('Erro ao buscar progresso de gamificação:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.id, pontosMes]); // ✅ CORRIGIDO: user.id e profile.id ao invés dos objetos inteiros

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.id, pontosMes]); // ✅ CORRIGIDO: Não depender de fetchProgress

  return { ...progress, loading, refetch: fetchProgress };
}
