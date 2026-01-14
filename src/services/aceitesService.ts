/**
 * Serviço para gerenciamento de Aceites de Termos
 * Responsável por registrar e consultar aceites de usuários
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AceiteTermo,
  DadosAceite,
  TermoUso,
  TermosPendentes,
  TermoParaExibicao,
  EstatisticasAceite,
  RelatorioAceite,
  TipoTermo
} from '@/types/termos';
import { LABELS_TIPO_TERMO } from '@/types/termos';

/**
 * Busca termos pendentes de aceite para um usuário
 * Usa a função do banco que já filtra por role e aceites existentes
 */
export async function buscarTermosPendentes(userId: string): Promise<TermosPendentes> {
  try {
    // Chamar função do banco que retorna termos pendentes
    const { data, error } = await supabase.rpc('buscar_termos_pendentes', {
      p_user_id: userId
    });

    if (error) {
      console.error('Erro ao buscar termos pendentes:', error);
      throw new Error('Não foi possível carregar os termos pendentes');
    }

    // Formatar termos para exibição
    const termosFormatados: TermoParaExibicao[] = (data || []).map((termo: TermoUso) => ({
      id: termo.id,
      tipo: termo.tipo,
      tipoLabel: LABELS_TIPO_TERMO[termo.tipo],
      versao: termo.versao,
      titulo: termo.titulo,
      pdf_url: termo.pdf_url,
      conteudo_html: termo.conteudo_html,
      resumo: termo.resumo,
      obrigatorio: termo.obrigatorio,
      aceito: false
    }));

    return {
      termos: termosFormatados,
      total: termosFormatados.length,
      todos_aceitos: termosFormatados.length === 0
    };
  } catch (error) {
    console.error('Erro em buscarTermosPendentes:', error);
    throw error;
  }
}

/**
 * Verifica se um usuário tem termos pendentes
 * Retorna boolean simples para uso em guards/checks rápidos
 */
export async function temTermosPendentes(userId: string): Promise<boolean> {
  try {
    // Chamar função do banco
    const { data, error } = await supabase.rpc('tem_termos_pendentes', {
      p_user_id: userId
    });

    if (error) {
      console.error('Erro ao verificar termos pendentes:', error);
      return false; // Em caso de erro, assume que não há pendentes
    }

    return data === true;
  } catch (error) {
    console.error('Erro em temTermosPendentes:', error);
    return false;
  }
}

/**
 * Captura o IP do usuário (melhor esforço)
 * Nota: IP pode não estar disponível dependendo do ambiente
 */
async function capturarIP(): Promise<string | null> {
  try {
    // Tentar obter IP de serviço público
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
  } catch (error) {
    console.warn('Não foi possível capturar IP:', error);
  }
  
  return null;
}

/**
 * Captura o User Agent do navegador
 */
function capturarUserAgent(): string | null {
  return navigator.userAgent || null;
}

/**
 * Registra o aceite de um ou múltiplos termos
 * Captura automaticamente IP e User Agent
 */
export async function registrarAceites(
  userId: string,
  termosIds: string[]
): Promise<void> {
  try {
    // Validar entrada
    if (!userId || termosIds.length === 0) {
      throw new Error('userId e termosIds são obrigatórios');
    }

    // Capturar dados de contexto
    const ip_aceite = await capturarIP();
    const user_agent = capturarUserAgent();

    // Buscar dados dos termos
    const { data: termos, error: termosError } = await supabase
      .from('termos_uso')
      .select('id, tipo, versao')
      .in('id', termosIds);

    if (termosError) {
      console.error('Erro ao buscar dados dos termos:', termosError);
      throw new Error('Não foi possível buscar informações dos termos');
    }

    if (!termos || termos.length === 0) {
      throw new Error('Nenhum termo válido encontrado');
    }

    // Preparar registros de aceite
    const aceites = termos.map(termo => ({
      user_id: userId,
      termo_id: termo.id,
      tipo_termo: termo.tipo,
      versao_aceita: termo.versao,
      ip_aceite,
      user_agent
    }));

    // Inserir aceites (RLS garante que apenas o próprio usuário pode inserir)
    const { error: insertError } = await supabase
      .from('aceites_termos')
      .insert(aceites);

    if (insertError) {
      console.error('Erro ao registrar aceites:', insertError);
      
      if (insertError.code === '23505') {
        throw new Error('Um ou mais termos já foram aceitos anteriormente');
      }
      
      throw new Error('Não foi possível registrar os aceites');
    }

    console.log(`✅ ${aceites.length} aceite(s) registrado(s) com sucesso`);
  } catch (error) {
    console.error('Erro em registrarAceites:', error);
    throw error;
  }
}

/**
 * Registra aceite de um único termo (wrapper do registrarAceites)
 */
export async function registrarAceite(
  userId: string,
  termoId: string
): Promise<void> {
  return registrarAceites(userId, [termoId]);
}

/**
 * Busca todos os aceites de um usuário
 * Retorna histórico completo ordenado por data
 */
export async function buscarAceitesUsuario(userId: string): Promise<AceiteTermo[]> {
  try {
    const { data, error } = await supabase
      .from('aceites_termos')
      .select('*')
      .eq('user_id', userId)
      .order('aceito_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar aceites:', error);
      throw new Error('Não foi possível carregar o histórico de aceites');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarAceitesUsuario:', error);
    throw error;
  }
}

/**
 * Verifica se um usuário aceitou um termo específico
 */
export async function verificarAceite(
  userId: string,
  termoId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('aceites_termos')
      .select('id')
      .eq('user_id', userId)
      .eq('termo_id', termoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Não encontrado = não aceitou
      }
      console.error('Erro ao verificar aceite:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Erro em verificarAceite:', error);
    return false;
  }
}

/**
 * Busca aceites de um termo específico (admin only)
 * Útil para ver quem aceitou um termo
 */
export async function buscarAceitesTermo(
  termoId: string,
  pagina: number = 1,
  porPagina: number = 50
): Promise<{
  aceites: AceiteTermo[];
  total: number;
  pagina: number;
  totalPaginas: number;
}> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem visualizar aceites de termos');
    }

    // Buscar aceites com contagem
    const inicio = (pagina - 1) * porPagina;
    const { data, error, count } = await supabase
      .from('aceites_termos')
      .select('*', { count: 'exact' })
      .eq('termo_id', termoId)
      .order('aceito_em', { ascending: false })
      .range(inicio, inicio + porPagina - 1);

    if (error) {
      console.error('Erro ao buscar aceites do termo:', error);
      throw new Error('Não foi possível carregar os aceites');
    }

    return {
      aceites: data || [],
      total: count || 0,
      pagina,
      totalPaginas: Math.ceil((count || 0) / porPagina)
    };
  } catch (error) {
    console.error('Erro em buscarAceitesTermo:', error);
    throw error;
  }
}

/**
 * Busca estatísticas de aceites de um termo (admin only)
 * Usa função do banco para calcular totais
 */
export async function buscarEstatisticasAceites(
  termoId: string
): Promise<EstatisticasAceite> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem visualizar estatísticas');
    }

    // Chamar função do banco
    const { data, error } = await supabase.rpc('estatisticas_aceites_termo', {
      p_termo_id: termoId
    });

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Não foi possível carregar as estatísticas');
    }

    // A função retorna array com 1 item
    const stats = data && data.length > 0 ? data[0] : null;

    if (!stats) {
      return {
        total_usuarios: 0,
        total_aceites: 0,
        percentual_aceites: 0,
        pendentes: 0
      };
    }

    return {
      total_usuarios: stats.total_usuarios || 0,
      total_aceites: stats.total_aceites || 0,
      percentual_aceites: stats.percentual_aceites || 0,
      pendentes: stats.pendentes || 0
    };
  } catch (error) {
    console.error('Erro em buscarEstatisticasAceites:', error);
    throw error;
  }
}

/**
 * Gera relatório completo de aceites (admin only)
 * Inclui dados do usuário e do termo para export
 */
export async function gerarRelatorioAceites(
  filtros?: {
    tipo?: TipoTermo;
    dataInicio?: string;
    dataFim?: string;
  }
): Promise<RelatorioAceite[]> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem gerar relatórios');
    }

    // Construir query complexa com joins
    let query = supabase
      .from('aceites_termos')
      .select(`
        user_id,
        tipo_termo,
        versao_aceita,
        aceito_em,
        ip_aceite,
        termos_uso!inner (
          tipo,
          versao,
          titulo
        ),
        profiles!inner (
          nome,
          email
        ),
        user_roles!inner (
          role
        )
      `);

    // Aplicar filtros
    if (filtros?.tipo) {
      query = query.eq('tipo_termo', filtros.tipo);
    }

    if (filtros?.dataInicio) {
      query = query.gte('aceito_em', filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      query = query.lte('aceito_em', filtros.dataFim);
    }

    query = query.order('aceito_em', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error('Não foi possível gerar o relatório');
    }

    // Formatar dados para o relatório
    return (data || []).map((item: any) => ({
      usuario_id: item.user_id,
      usuario_nome: item.profiles?.nome || 'N/A',
      usuario_email: item.profiles?.email || 'N/A',
      usuario_role: item.user_roles?.role || 'N/A',
      termo_tipo: item.tipo_termo,
      termo_versao: item.versao_aceita,
      termo_titulo: item.termos_uso?.titulo || 'N/A',
      aceito_em: item.aceito_em,
      ip_aceite: item.ip_aceite
    }));
  } catch (error) {
    console.error('Erro em gerarRelatorioAceites:', error);
    throw error;
  }
}

/**
 * Deleta aceites de um usuário (apenas para testes - USAR COM CUIDADO)
 * Em produção, aceites NUNCA devem ser deletados por questões legais
 */
export async function deletarAceitesUsuario(userId: string): Promise<void> {
  try {
    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole.role !== 'admin') {
      throw new Error('Apenas administradores podem deletar aceites');
    }

    // AVISO: Esta operação deve ser usada apenas em ambiente de testes
    console.warn('⚠️ DELETANDO ACEITES - Usar apenas em testes!');

    const { error } = await supabase
      .from('aceites_termos')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao deletar aceites:', error);
      throw new Error('Não foi possível deletar os aceites');
    }

    console.log('✅ Aceites deletados com sucesso');
  } catch (error) {
    console.error('Erro em deletarAceitesUsuario:', error);
    throw error;
  }
}
