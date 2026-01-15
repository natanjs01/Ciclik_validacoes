/**
 * Serviço para gerenciamento de Termos de Uso
 * Responsável por todas operações CRUD relacionadas aos termos
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TermoUso,
  NovoTermo,
  AtualizarTermo,
  TipoTermo,
  RoleUsuario,
  FiltroTermos,
  ResultadoPaginado
} from '@/types/termos';

/**
 * Busca todos os termos ativos para um usuário específico
 * Filtra por role do usuário e retorna apenas termos aplicáveis
 */
export async function buscarTermosAtivos(
  userId: string,
  tipo?: TipoTermo
): Promise<TermoUso[]> {
  try {
    // Buscar role do usuário
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('Erro ao buscar role do usuário:', roleError);
      throw new Error('Não foi possível verificar as permissões do usuário');
    }

    // Admin não precisa aceitar termos
    if (userRole.role === 'admin') {
      return [];
    }

    // Buscar termos ativos aplicáveis ao role do usuário
    let query = supabase
      .from('termos_uso')
      .select('*')
      .eq('ativo', true)
      .contains('roles_aplicaveis', [userRole.role])
      .order('criado_em', { ascending: false });

    // Filtrar por tipo se especificado
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar termos ativos:', error);
      throw new Error('Não foi possível carregar os termos de uso');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarTermosAtivos:', error);
    throw error;
  }
}

/**
 * Busca um termo específico por ID
 */
export async function buscarTermoPorId(termoId: string): Promise<TermoUso | null> {
  try {
    const { data, error } = await supabase
      .from('termos_uso')
      .select('*')
      .eq('id', termoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Termo não encontrado
      }
      console.error('Erro ao buscar termo por ID:', error);
      throw new Error('Não foi possível carregar o termo');
    }

    return data;
  } catch (error) {
    console.error('Erro em buscarTermoPorId:', error);
    throw error;
  }
}

/**
 * Lista todos os termos (admin only)
 * Suporta filtros e paginação
 */
export async function listarTodosTermos(
  filtros: FiltroTermos = {},
  pagina: number = 1,
  porPagina: number = 10
): Promise<ResultadoPaginado<TermoUso>> {
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
      throw new Error('Apenas administradores podem listar todos os termos');
    }

    // Construir query com filtros
    let query = supabase.from('termos_uso').select('*', { count: 'exact' });

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros.ativo !== undefined) {
      query = query.eq('ativo', filtros.ativo);
    }

    if (filtros.versao) {
      query = query.eq('versao', filtros.versao);
    }

    if (filtros.busca) {
      query = query.or(`titulo.ilike.%${filtros.busca}%,resumo.ilike.%${filtros.busca}%`);
    }

    // Aplicar paginação
    const inicio = (pagina - 1) * porPagina;
    query = query
      .order('criado_em', { ascending: false })
      .range(inicio, inicio + porPagina - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao listar termos:', error);
      throw new Error('Não foi possível carregar a lista de termos');
    }

    return {
      dados: data || [],
      total: count || 0,
      pagina,
      porPagina,
      totalPaginas: Math.ceil((count || 0) / porPagina)
    };
  } catch (error) {
    console.error('Erro em listarTodosTermos:', error);
    throw error;
  }
}

/**
 * Cria um novo termo (admin only)
 */
export async function criarTermo(termo: NovoTermo): Promise<TermoUso> {
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
      throw new Error('Apenas administradores podem criar termos');
    }

    // Validar dados obrigatórios
    if (!termo.titulo || !termo.tipo || !termo.versao || !termo.pdf_url) {
      throw new Error('Campos obrigatórios faltando: título, tipo, versão e PDF');
    }

    if (!termo.roles_aplicaveis || termo.roles_aplicaveis.length === 0) {
      throw new Error('Pelo menos um role deve ser selecionado');
    }

    // Inserir novo termo
    const { data, error } = await supabase
      .from('termos_uso')
      .insert({
        tipo: termo.tipo,
        versao: termo.versao,
        titulo: termo.titulo,
        resumo: termo.descricao, // Mapear descricao -> resumo
        conteudo_html: termo.conteudo_html,
        pdf_url: termo.pdf_url,
        pdf_path: `v${termo.versao}/${termo.tipo.replace(/_/g, '-')}-v${termo.versao}.pdf`, // Adicionar pdf_path obrigatório
        roles_aplicaveis: termo.roles_aplicaveis,
        obrigatorio: termo.obrigatorio ?? true,
        ativo: termo.ativo ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar termo:', error);
      
      if (error.code === '23505') {
        throw new Error('Já existe um termo com essa combinação de tipo e versão');
      }
      
      throw new Error('Não foi possível criar o termo');
    }

    return data;
  } catch (error) {
    console.error('Erro em criarTermo:', error);
    throw error;
  }
}

/**
 * Atualiza um termo existente (admin only)
 * Nota: Não permite alterar tipo, versão ou roles após criação
 */
export async function atualizarTermo(
  termoId: string,
  atualizacao: AtualizarTermo
): Promise<TermoUso> {
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
      throw new Error('Apenas administradores podem atualizar termos');
    }

    // Atualizar termo
    const { data, error } = await supabase
      .from('termos_uso')
      .update({
        titulo: atualizacao.titulo,
        resumo: atualizacao.descricao, // Mapear descricao -> resumo
        conteudo_html: atualizacao.conteudo_html,
        pdf_url: atualizacao.pdf_url,
        obrigatorio: atualizacao.obrigatorio,
        ativo: atualizacao.ativo
      })
      .eq('id', termoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar termo:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error('Termo não encontrado');
      }
      
      throw new Error('Não foi possível atualizar o termo');
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarTermo:', error);
    throw error;
  }
}

/**
 * Ativa ou desativa um termo (admin only)
 * Quando um termo é ativado, desativa automaticamente versões anteriores do mesmo tipo
 */
export async function alterarStatusTermo(
  termoId: string,
  ativo: boolean
): Promise<TermoUso> {
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
      throw new Error('Apenas administradores podem alterar status de termos');
    }

    // Atualizar status
    const { data, error } = await supabase
      .from('termos_uso')
      .update({ ativo })
      .eq('id', termoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status do termo:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error('Termo não encontrado');
      }
      
      throw new Error('Não foi possível alterar o status do termo');
    }

    return data;
  } catch (error) {
    console.error('Erro em alterarStatusTermo:', error);
    throw error;
  }
}

/**
 * Deleta um termo (admin only)
 * Apenas termos sem aceites podem ser deletados
 */
export async function deletarTermo(termoId: string): Promise<void> {
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
      throw new Error('Apenas administradores podem deletar termos');
    }

    // Verificar se existem aceites
    const { data: aceites, error: aceitesError } = await supabase
      .from('aceites_termos')
      .select('id')
      .eq('termo_id', termoId)
      .limit(1);

    if (aceitesError) {
      console.error('Erro ao verificar aceites:', aceitesError);
      throw new Error('Não foi possível verificar aceites do termo');
    }

    if (aceites && aceites.length > 0) {
      throw new Error('Não é possível deletar um termo que já possui aceites');
    }

    // Deletar termo
    const { error } = await supabase
      .from('termos_uso')
      .delete()
      .eq('id', termoId);

    if (error) {
      console.error('Erro ao deletar termo:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error('Termo não encontrado');
      }
      
      throw new Error('Não foi possível deletar o termo');
    }
  } catch (error) {
    console.error('Erro em deletarTermo:', error);
    throw error;
  }
}

/**
 * Busca histórico de versões de um tipo de termo
 */
export async function buscarHistoricoVersoes(tipo: TipoTermo): Promise<TermoUso[]> {
  try {
    const { data, error } = await supabase
      .from('termos_uso')
      .select('*')
      .eq('tipo', tipo)
      .order('versao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw new Error('Não foi possível carregar o histórico de versões');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarHistoricoVersoes:', error);
    throw error;
  }
}

/**
 * Busca a versão mais recente ativa de um tipo de termo
 */
export async function buscarVersaoMaisRecente(tipo: TipoTermo): Promise<TermoUso | null> {
  try {
    const { data, error } = await supabase
      .from('termos_uso')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .order('versao', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Nenhuma versão ativa encontrada
      }
      console.error('Erro ao buscar versão mais recente:', error);
      throw new Error('Não foi possível carregar a versão mais recente');
    }

    return data;
  } catch (error) {
    console.error('Erro em buscarVersaoMaisRecente:', error);
    throw error;
  }
}
