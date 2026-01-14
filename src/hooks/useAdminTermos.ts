/**
 * Hook para operações administrativas de termos
 * Apenas para usuários com role admin
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listarTodosTermos,
  criarTermo,
  atualizarTermo,
  alterarStatusTermo,
  deletarTermo,
  buscarHistoricoVersoes,
} from '@/services/termosUsoService';
import {
  uploadPDF,
  deletarPDF,
  listarArquivos,
} from '@/services/termosStorageService';
import {
  buscarAceitesTermo,
  buscarEstatisticasAceites,
  gerarRelatorioAceites,
} from '@/services/aceitesService';
import type {
  TermoUso,
  NovoTermo,
  AtualizarTermo,
  FiltroTermos,
  ResultadoPaginado,
  TipoTermo,
  EstatisticasAceite,
  AceiteTermo,
  RelatorioAceite,
  ResultadoUploadPDF,
} from '@/types/termos';

interface UseAdminTermosReturn {
  // Listagem
  termos: TermoUso[];
  total: number;
  pagina: number;
  totalPaginas: number;
  loading: boolean;
  error: string | null;
  
  // Operações
  listar: (filtros?: FiltroTermos, pag?: number) => Promise<void>;
  criar: (termo: NovoTermo) => Promise<TermoUso | null>;
  atualizar: (id: string, dados: AtualizarTermo) => Promise<TermoUso | null>;
  ativar: (id: string) => Promise<boolean>;
  desativar: (id: string) => Promise<boolean>;
  deletar: (id: string) => Promise<boolean>;
  buscarHistorico: (tipo: TipoTermo) => Promise<TermoUso[]>;
  
  // Upload
  upload: (arquivo: File, tipo: TipoTermo, versao: string) => Promise<ResultadoUploadPDF>;
  
  // Helpers
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook principal para administração de termos
 * 
 * @example
 * ```tsx
 * function AdminTermosPage() {
 *   const {
 *     termos,
 *     loading,
 *     listar,
 *     criar,
 *     deletar,
 *     isAdmin
 *   } = useAdminTermos();
 *   
 *   useEffect(() => {
 *     listar();
 *   }, []);
 *   
 *   if (!isAdmin) return <AcessoNegado />;
 *   if (loading) return <Loading />;
 *   
 *   return <TabelaTermos termos={termos} onDelete={deletar} />;
 * }
 * ```
 */
export function useAdminTermos(): UseAdminTermosReturn {
  const { user } = useAuth();
  const [termos, setTermos] = useState<TermoUso[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagina, setPagina] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Verificar se usuário é admin
  useEffect(() => {
    async function verificarAdmin() {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Erro ao verificar admin:', err);
        setIsAdmin(false);
      }
    }

    verificarAdmin();
  }, [user?.id]);

  /**
   * Lista termos com filtros e paginação
   */
  const listar = useCallback(
    async (filtros: FiltroTermos = {}, pag: number = 1) => {
      if (!isAdmin) {
        setError('Apenas administradores podem listar termos');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resultado: ResultadoPaginado<TermoUso> = await listarTodosTermos(
          filtros,
          pag,
          10
        );

        setTermos(resultado.dados);
        setTotal(resultado.total);
        setPagina(resultado.pagina);
        setTotalPaginas(resultado.totalPaginas);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao listar termos';
        setError(errorMessage);
        console.error('Erro em listar:', err);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Cria um novo termo
   */
  const criar = useCallback(
    async (termo: NovoTermo): Promise<TermoUso | null> => {
      if (!isAdmin) {
        setError('Apenas administradores podem criar termos');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const novoTermo = await criarTermo(termo);
        
        // Atualizar lista
        await listar();

        console.log('✅ Termo criado:', novoTermo.id);
        return novoTermo;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar termo';
        setError(errorMessage);
        console.error('Erro em criar:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, listar]
  );

  /**
   * Atualiza um termo existente
   */
  const atualizar = useCallback(
    async (id: string, dados: AtualizarTermo): Promise<TermoUso | null> => {
      if (!isAdmin) {
        setError('Apenas administradores podem atualizar termos');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const termoAtualizado = await atualizarTermo(id, dados);
        
        // Atualizar lista local
        setTermos(prev =>
          prev.map(t => (t.id === id ? termoAtualizado : t))
        );

        console.log('✅ Termo atualizado:', id);
        return termoAtualizado;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar termo';
        setError(errorMessage);
        console.error('Erro em atualizar:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Ativa um termo
   */
  const ativar = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isAdmin) {
        setError('Apenas administradores podem ativar termos');
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const termoAtualizado = await alterarStatusTermo(id, true);
        
        // Atualizar lista local
        setTermos(prev =>
          prev.map(t => (t.id === id ? termoAtualizado : t))
        );

        console.log('✅ Termo ativado:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao ativar termo';
        setError(errorMessage);
        console.error('Erro em ativar:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Desativa um termo
   */
  const desativar = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isAdmin) {
        setError('Apenas administradores podem desativar termos');
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const termoAtualizado = await alterarStatusTermo(id, false);
        
        // Atualizar lista local
        setTermos(prev =>
          prev.map(t => (t.id === id ? termoAtualizado : t))
        );

        console.log('✅ Termo desativado:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar termo';
        setError(errorMessage);
        console.error('Erro em desativar:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Deleta um termo
   */
  const deletar = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isAdmin) {
        setError('Apenas administradores podem deletar termos');
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        await deletarTermo(id);
        
        // Remover da lista local
        setTermos(prev => prev.filter(t => t.id !== id));
        setTotal(prev => prev - 1);

        console.log('✅ Termo deletado:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar termo';
        setError(errorMessage);
        console.error('Erro em deletar:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Busca histórico de versões
   */
  const buscarHistorico = useCallback(
    async (tipo: TipoTermo): Promise<TermoUso[]> => {
      if (!isAdmin) {
        setError('Apenas administradores podem ver histórico');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        const historico = await buscarHistoricoVersoes(tipo);
        
        console.log(`📜 Histórico carregado: ${historico.length} versões`);
        return historico;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar histórico';
        setError(errorMessage);
        console.error('Erro em buscarHistorico:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Upload de PDF
   */
  const upload = useCallback(
    async (
      arquivo: File,
      tipo: TipoTermo,
      versao: string
    ): Promise<ResultadoUploadPDF> => {
      if (!isAdmin) {
        return {
          success: false,
          error: 'Apenas administradores podem fazer upload',
        };
      }

      try {
        setLoading(true);
        setError(null);

        const resultado = await uploadPDF(arquivo, tipo, versao);

        if (resultado.success) {
          console.log('✅ PDF enviado:', resultado.pdf_path);
        } else {
          setError(resultado.error || 'Erro no upload');
        }

        return resultado;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload';
        setError(errorMessage);
        console.error('Erro em upload:', err);
        
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Recarrega a lista atual
   */
  const refetch = useCallback(async () => {
    await listar({}, pagina);
  }, [listar, pagina]);

  return {
    termos,
    total,
    pagina,
    totalPaginas,
    loading,
    error,
    listar,
    criar,
    atualizar,
    ativar,
    desativar,
    deletar,
    buscarHistorico,
    upload,
    isAdmin,
    refetch,
  };
}

/**
 * Hook para estatísticas de aceites de um termo
 * 
 * @example
 * ```tsx
 * function EstatisticasTermo({ termoId }) {
 *   const { stats, loading, aceites } = useEstatisticasTermo(termoId);
 *   
 *   if (loading) return <Loading />;
 *   
 *   return (
 *     <div>
 *       <p>Total: {stats.total_aceites}</p>
 *       <p>Percentual: {stats.percentual_aceites}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEstatisticasTermo(termoId: string | null) {
  const [stats, setStats] = useState<EstatisticasAceite | null>(null);
  const [aceites, setAceites] = useState<AceiteTermo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!termoId) {
      setStats(null);
      setAceites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas
      const estatisticas = await buscarEstatisticasAceites(termoId);
      setStats(estatisticas);

      // Buscar lista de aceites (primeira página)
      const { aceites: listaAceites } = await buscarAceitesTermo(termoId, 1, 10);
      setAceites(listaAceites);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(errorMessage);
      console.error('Erro em useEstatisticasTermo:', err);
    } finally {
      setLoading(false);
    }
  }, [termoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    stats,
    aceites,
    loading,
    error,
    refetch: carregar,
  };
}

/**
 * Hook para gerar relatórios
 * 
 * @example
 * ```tsx
 * function RelatoriosPage() {
 *   const { gerar, relatorio, loading, exportarCSV } = useRelatorioAceites();
 *   
 *   const handleGerar = async () => {
 *     await gerar({ dataInicio: '2026-01-01' });
 *   };
 *   
 *   return (
 *     <div>
 *       <Button onClick={handleGerar}>Gerar Relatório</Button>
 *       {relatorio && (
 *         <Button onClick={exportarCSV}>Exportar CSV</Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRelatorioAceites() {
  const [relatorio, setRelatorio] = useState<RelatorioAceite[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const gerar = useCallback(
    async (filtros?: {
      tipo?: TipoTermo;
      dataInicio?: string;
      dataFim?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const dados = await gerarRelatorioAceites(filtros);
        setRelatorio(dados);

        console.log(`📊 Relatório gerado: ${dados.length} registros`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório';
        setError(errorMessage);
        console.error('Erro em gerar:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Exporta relatório como CSV
   */
  const exportarCSV = useCallback(() => {
    if (relatorio.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    // Cabeçalhos
    const headers = [
      'Usuário ID',
      'Nome',
      'Email',
      'Role',
      'Tipo Termo',
      'Versão',
      'Título',
      'Data Aceite',
      'IP',
    ];

    // Dados
    const rows = relatorio.map(r => [
      r.usuario_id,
      r.usuario_nome,
      r.usuario_email,
      r.usuario_role,
      r.termo_tipo,
      r.termo_versao,
      r.termo_titulo,
      new Date(r.aceito_em).toLocaleString('pt-BR'),
      r.ip_aceite || 'N/A',
    ]);

    // Montar CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-aceites-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    console.log('✅ CSV exportado');
  }, [relatorio]);

  return {
    gerar,
    relatorio,
    loading,
    error,
    exportarCSV,
  };
}
