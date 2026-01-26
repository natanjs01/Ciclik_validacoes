import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, ArrowLeft, Search, Package, QrCode, Edit, Check, X, ExternalLink, Loader2, TrendingUp, Clock, AlertTriangle, Upload, Download, FileSpreadsheet, RefreshCw, Eye, Star, CheckCircle2, Database, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TipoEmbalagem, TIPOS_EMBALAGEM_LABELS } from '@/types/produtos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { consultarAPIProdutos, getServiceStats, resetCircuitBreaker, clearCache, type DadosAPIOnRender as DadosAPIOnRenderImported } from '@/services/apiConsultaService';

interface ProdutoEmAnalise {
  id: string;
  ean_gtin: string;
  descricao: string;
  origem: 'qrcode' | 'manual';
  usuario_id: string | null;
  usuario_nome: string | null;
  quantidade_ocorrencias: number;
  data_primeira_deteccao: string;
  data_ultima_deteccao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'acao_manual' | 'consultado';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  dados_api?: any; // Dados retornados da API OnRender
  consultado_em?: string; // Data da consulta
}

// Interface para resposta da API OnRender - usando o tipo do serviço
type DadosAPIOnRender = DadosAPIOnRenderImported & {
  // Campos extras que são usados apenas localmente (não vêm da API)
  tipo_embalagem?: TipoEmbalagem;
  peso_medio_gramas?: number;
  reciclavel?: boolean;
  percentual_reciclabilidade?: number;
  observacoes?: string;
  categoria?: string; // obsoleto
  peso_gramas?: number; // obsoleto
};

// 🧠 FUNÇÃO INTELIGENTE: Inferir tipo de embalagem pela categoria/descrição da API
function inferirTipoEmbalagem(dadosAPI: DadosAPIOnRender): TipoEmbalagem {
  const texto = `${dadosAPI.categoria_api || ''} ${dadosAPI.descricao || ''}`.toLowerCase();
  
  // Vidro: cervejas, vinhos, sucos em garrafa de vidro
  if (texto.includes('vidro') || texto.includes('garrafa') && (
    texto.includes('cerveja') || texto.includes('vinho') || texto.includes('suco')
  )) {
    return 'vidro';
  }
  
  // Alumínio: latas de bebida, conservas em lata
  if (texto.includes('lata') || texto.includes('alumínio') || texto.includes('aluminio')) {
    return 'aluminio';
  }
  
  // Papel: caixas de leite, suco em caixa, papel de embrulho
  if (texto.includes('caixa') || texto.includes('tetra pak') || texto.includes('embalagem longa vida')) {
    return 'papel';
  }
  
  // Papelão: caixas de papelão, embalagens secundárias
  if (texto.includes('papelão') || texto.includes('papelao') || texto.includes('caixa de papelão')) {
    return 'papelao';
  }
  
  // Laminado: salgadinhos, biscoitos, café
  if (texto.includes('salgadinho') || texto.includes('biscoito') || texto.includes('café') || 
      texto.includes('snack') || texto.includes('chips')) {
    return 'laminado';
  }
  
  // Plástico: padrão para a maioria (garrafas PET, potes, sacolas)
  return 'plastico';
}

// 🧠 FUNÇÃO INTELIGENTE: Estimar reciclabilidade pela embalagem
function estimarReciclabilidade(tipoEmbalagem: TipoEmbalagem): { reciclavel: boolean; percentual: number } {
  switch (tipoEmbalagem) {
    case 'aluminio':
      return { reciclavel: true, percentual: 100 }; // Alumínio é 100% reciclável
    case 'vidro':
      return { reciclavel: true, percentual: 100 }; // Vidro é 100% reciclável
    case 'plastico':
      return { reciclavel: true, percentual: 85 };  // PET/PEAD são altamente recicláveis
    case 'papel':
      return { reciclavel: true, percentual: 90 };  // Papel é altamente reciclável
    case 'papelao':
      return { reciclavel: true, percentual: 95 };  // Papelão é muito reciclável
    case 'laminado':
      return { reciclavel: false, percentual: 20 }; // Laminado é difícil de reciclar
    case 'misto':
      return { reciclavel: false, percentual: 30 }; // Misto é difícil de separar
    default:
      return { reciclavel: true, percentual: 70 };  // Padrão conservador
  }
}

// 🧠 Funções auxiliares para inferir dados
function inferirPeso(dadosAPI: DadosAPIOnRender): number | undefined {
  return dadosAPI.peso_liquido || dadosAPI.peso_bruto || undefined;
}

function inferirReciclabilidade(tipoEmbalagem: TipoEmbalagem): boolean {
  return estimarReciclabilidade(tipoEmbalagem).reciclavel;
}

function inferirPercentualReciclabilidade(tipoEmbalagem: TipoEmbalagem): number {
  return estimarReciclabilidade(tipoEmbalagem).percentual;
}

// 🧠 FUNÇÃO INTELIGENTE: Extrair apenas o código NCM (remove descrição)
function extrairCodigoNCM(ncmCompleto?: string): string {
  if (!ncmCompleto) return '';
  // Exemplo: "17019900 - Outros" → "17019900"
  const match = ncmCompleto.match(/^(\d{8})/);
  return match ? match[1] : '';
}

export default function AdminProductsAnalysis() {
  const [produtos, setProdutos] = useState<ProdutoEmAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigem, setFilterOrigem] = useState<string>('all');
  const [filterAPIStatus, setFilterAPIStatus] = useState<string>('all'); // ✅ NOVO: Filtro para status da API
  const [selectedProduct, setSelectedProduct] = useState<ProdutoEmAnalise | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'aprovar' | 'rejeitar' | 'observacao' | 'cadastrar' | null>(null);
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para o formulário de cadastro
  const [cadastroDialogOpen, setCadastroDialogOpen] = useState(false);
  const [produtoParaCadastro, setProdutoParaCadastro] = useState<ProdutoEmAnalise | null>(null);
  const [formData, setFormData] = useState({
    gtin: '',
    ncm: '',
    descricao: '',
    tipo_embalagem: 'plastico',
    reciclavel: true,
    percentual_reciclabilidade: 100,
    peso_medio_gramas: null as number | null,
    observacoes: '',
  });
  const [processing, setProcessing] = useState(false);
  
  // Estados para upload CSV
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  
  // Estados para consulta API OnRender
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [consultaAPIDialogOpen, setConsultaAPIDialogOpen] = useState(false);
  const [consultandoAPI, setConsultandoAPI] = useState(false);
  const [progressoConsulta, setProgressoConsulta] = useState(0);
  const [resultadosConsulta, setResultadosConsulta] = useState<{
    autoCadastrados: string[];
    precisamRevisao: string[];
    naoEncontrados: string[];
    erros: Array<{ id: string; erro: string }>;
  } | null>(null);
  const [modalDadosAPIOpen, setModalDadosAPIOpen] = useState(false);
  const [produtoComDadosAPI, setProdutoComDadosAPI] = useState<ProdutoEmAnalise | null>(null);
  
  // Contador de consultas API realizadas hoje
  const [consultasHoje, setConsultasHoje] = useState(0);
  const [resetConsultasDialogOpen, setResetConsultasDialogOpen] = useState(false);
  const [consultasParaResetar, setConsultasParaResetar] = useState({
    total: 0,
    sucesso: 0,
    falhas: 0,
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProdutos();
    loadConsultasHoje();
  }, []);

  const loadProdutos = async () => {
    setLoading(true);
    try {
      // Busca produtos em análise do banco de dados
      // PRIORIDADE: QR Code (origem='qrcode') aparecem primeiro, depois ordenados por data
      const { data, error } = await supabase
        .from('produtos_em_analise')
        .select('*')
        .order('origem', { ascending: false }) // 'qrcode' > 'manual' (ordem alfabética reversa)
        .order('data_ultima_deteccao', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os produtos em análise.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConsultasHoje = async () => {
    try {
      // Chama função RPC que conta consultas do dia atual
      const { data, error } = await supabase.rpc('contar_consultas_hoje');
      
      if (error) {
        console.error('Erro ao carregar contador de consultas:', error);
        return;
      }
      
      setConsultasHoje(data || 0);
    } catch (error) {
      console.error('Erro ao carregar contador de consultas:', error);
      // Em caso de erro, mantém 0 (não bloqueia a interface)
    }
  };

  /**
   * 🔄 Calcular consultas para reset
   * Conta apenas consultas bem-sucedidas (produto encontrado) para manter no contador
   */
  const calcularConsultasParaReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date().toISOString().split('T')[0];

      // Contar TOTAL de consultas hoje
      const { count: totalCount } = await supabase
        .from('log_consultas_api')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', user.id)
        .gte('timestamp', `${hoje}T00:00:00`)
        .lte('timestamp', `${hoje}T23:59:59`);

      // Contar consultas BEM-SUCEDIDAS (produto encontrado)
      const { data: consultasSucesso } = await supabase
        .from('log_consultas_api')
        .select('resposta_api')
        .eq('admin_id', user.id)
        .eq('sucesso', true)
        .gte('timestamp', `${hoje}T00:00:00`)
        .lte('timestamp', `${hoje}T23:59:59`);

      // Filtrar apenas as que ENCONTRARAM o produto
      const sucessoComProduto = consultasSucesso?.filter(c => {
        const resposta = c.resposta_api as any;
        return resposta?.encontrado === true;
      }).length || 0;

      const falhas = (totalCount || 0) - sucessoComProduto;

      setConsultasParaResetar({
        total: totalCount || 0,
        sucesso: sucessoComProduto,
        falhas: falhas,
      });

      setResetConsultasDialogOpen(true);

    } catch (error) {
      console.error('Erro ao calcular consultas:', error);
      toast({
        title: 'Erro ao calcular consultas',
        description: 'Não foi possível obter os dados das consultas.',
        variant: 'destructive',
      });
    }
  };

  /**
   * 🗑️ Resetar contador de consultas
   * Remove do log apenas as consultas que falharam ou não encontraram produtos
   */
  const resetarContadorConsultas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date().toISOString().split('T')[0];

      // Buscar IDs das consultas para deletar (falhas + não encontrados)
      const { data: consultasParaDeletar } = await supabase
        .from('log_consultas_api')
        .select('id, resposta_api, sucesso')
        .eq('admin_id', user.id)
        .gte('timestamp', `${hoje}T00:00:00`)
        .lte('timestamp', `${hoje}T23:59:59`);

      if (!consultasParaDeletar) {
        throw new Error('Nenhuma consulta encontrada');
      }

      // Filtrar IDs das consultas que NÃO encontraram produto ou falharam
      const idsParaDeletar = consultasParaDeletar
        .filter(c => {
          // Se falhou (sucesso=false), deletar
          if (!c.sucesso) return true;
          
          // Se não encontrou produto, deletar
          const resposta = c.resposta_api as any;
          if (resposta?.encontrado !== true) return true;
          
          // Caso contrário, manter
          return false;
        })
        .map(c => c.id);

      if (idsParaDeletar.length === 0) {
        toast({
          title: 'Nenhuma consulta para resetar',
          description: 'Todas as consultas de hoje foram bem-sucedidas!',
        });
        setResetConsultasDialogOpen(false);
        return;
      }

      // Deletar consultas em lote
      const { error: deleteError } = await supabase
        .from('log_consultas_api')
        .delete()
        .in('id', idsParaDeletar);

      if (deleteError) {
        throw deleteError;
      }

      // ⏱️ Aguardar 500ms para garantir que o banco processou a deleção
      await new Promise(resolve => setTimeout(resolve, 500));

      // 🔄 Recarregar contador (força nova consulta ao banco)
      await loadConsultasHoje();

      // 🔄 Atualizar estado diretamente também (garantia dupla)
      setConsultasHoje(consultasParaResetar.sucesso);

      toast({
        title: '✅ Contador resetado com sucesso!',
        description: `${idsParaDeletar.length} consultas removidas. ${consultasParaResetar.sucesso} consultas bem-sucedidas mantidas.`,
      });

      setResetConsultasDialogOpen(false);

    } catch (error: any) {
      console.error('Erro ao resetar contador:', error);
      toast({
        title: 'Erro ao resetar contador',
        description: error.message || 'Ocorreu um erro ao resetar o contador.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (produtoId: string, novoStatus: string, obs?: string) => {
    setProcessing(true);
    try {
      const updateData: any = {
        status: novoStatus,
        updated_at: new Date().toISOString(),
      };

      if (obs) {
        updateData.observacoes = obs;
      }

      const { error } = await supabase
        .from('produtos_em_analise')
        .update(updateData)
        .eq('id', produtoId);

      if (error) throw error;

      toast({
        title: 'Status atualizado!',
        description: `Produto marcado como ${novoStatus}.`,
      });

      await loadProdutos();
      setDialogOpen(false);
      setSelectedProduct(null);
      setObservacoes('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do produto.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCadastrarProduto = (produto: ProdutoEmAnalise) => {
    // ✅ PRIORIDADE: Se produto tem dados_api, preencher automaticamente
    if (produto.dados_api && produto.status === 'consultado') {
      preencherFormularioComDadosAPI(produto);
      return; // A função já abre o modal
    }
    
    // Caso contrário, abrir modal com dados básicos apenas
    setProdutoParaCadastro(produto);
    setFormData({
      gtin: produto.ean_gtin,
      ncm: '',
      descricao: produto.descricao,
      tipo_embalagem: 'plastico' as TipoEmbalagem,
      reciclavel: true,
      percentual_reciclabilidade: 100,
      peso_medio_gramas: null,
      observacoes: ''
    });
    setCadastroDialogOpen(true);
  };

  const handleSalvarProduto = async () => {
    if (!produtoParaCadastro) return;

    setProcessing(true);
    try {
      // Validações básicas
      if (!formData.gtin || !formData.ncm || !formData.descricao) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha GTIN, NCM e Descrição.',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      // 1. Inserir produto em produtos_ciclik
      const { data: novoProduto, error: errorProduto } = await supabase
        .from('produtos_ciclik')
        .insert({
          gtin: formData.gtin,
          ncm: formData.ncm,
          descricao: formData.descricao,
          marca: produtoParaCadastro?.dados_api?.marca || null, // ✅ NOVO
          categoria_api: produtoParaCadastro?.dados_api?.categoria_api || null, // ✅ NOVO
          tipo_embalagem: formData.tipo_embalagem,
          reciclavel: formData.reciclavel,
          percentual_reciclabilidade: formData.percentual_reciclabilidade,
          peso_medio_gramas: formData.peso_medio_gramas,
          observacoes: formData.observacoes || null,
          imagem_url: produtoParaCadastro?.dados_api?.imagem_url || null, // ✅ NOVO
        })
        .select('id, gtin, descricao, ncm') // ✅ ESPECIFICAR COLUNAS para evitar erro de RLS/Policy
        .single();

      if (errorProduto) throw errorProduto;

      // 2. Atualizar status do produto em análise para "aprovado"
      const { error: errorAnalise } = await supabase
        .from('produtos_em_analise')
        .update({ 
          status: 'aprovado',
          updated_at: new Date().toISOString()
        })
        .eq('id', produtoParaCadastro.id);

      if (errorAnalise) throw errorAnalise;

      toast({
        title: 'Produto cadastrado!',
        description: `${formData.descricao} foi adicionado ao catálogo.`,
      });

      // Recarregar lista e fechar modal
      await loadProdutos();
      setCadastroDialogOpen(false);
      setProdutoParaCadastro(null);
      setFormData({
        gtin: '',
        ncm: '',
        descricao: '',
        tipo_embalagem: 'plastico' as TipoEmbalagem,
        reciclavel: true,
        percentual_reciclabilidade: 100,
        peso_medio_gramas: null,
        observacoes: ''
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível cadastrar o produto.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Função para baixar template CSV
  const handleDownloadTemplate = () => {
    const template = `ean_gtin,descricao
7891234567890,Garrafa PET 2L
7891234567891,Lata de Alumínio 350ml
7891234567892,Caixa de Papelão
7891234567893,Garrafa de Vidro 1L
7891234567894,Embalagem Tetra Pak 1L`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_produtos_em_analise.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Template baixado!',
      description: 'Use este arquivo como modelo para registrar produtos em análise.',
    });
  };

  // Função para processar arquivo CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo CSV.',
          variant: 'destructive',
        });
        return;
      }
      setCsvFile(file);
    }
  };

  // Função para processar e inserir produtos do CSV
  const handleUploadCSV = async () => {
    if (!csvFile) {
      toast({
        title: 'Nenhum arquivo',
        description: 'Selecione um arquivo CSV primeiro.',
        variant: 'destructive',
      });
      return;
    }

    setUploadProcessing(true);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Remove header
      const dataLines = lines.slice(1);
      
      if (dataLines.length === 0) {
        throw new Error('Arquivo CSV vazio ou sem dados.');
      }

      const produtos = [];
      const erros = [];
      const gtinsNoArquivo = new Set<string>(); // ✅ Rastrear GTINs no arquivo

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const valores = line.split(',').map(v => v.trim());
        
        if (valores.length < 2) {
          erros.push(`Linha ${i + 2}: Dados insuficientes (necessário EAN e Descrição)`);
          continue;
        }

        const [ean_gtin, descricao] = valores;

        // Validações básicas
        if (!ean_gtin || !descricao) {
          erros.push(`Linha ${i + 2}: EAN/GTIN e Descrição são obrigatórios`);
          continue;
        }

        // ✅ NOVA VALIDAÇÃO: Verificar duplicata no próprio arquivo
        if (gtinsNoArquivo.has(ean_gtin)) {
          erros.push(`Linha ${i + 2}: EAN/GTIN "${ean_gtin}" duplicado no arquivo (já existe em linha anterior)`);
          continue;
        }

        gtinsNoArquivo.add(ean_gtin);

        produtos.push({
          ean_gtin,
          descricao,
          origem: 'manual', // Upload CSV é sempre origem manual
          status: 'pendente',
          quantidade_ocorrencias: 1,
          data_primeira_deteccao: new Date().toISOString(),
          data_ultima_deteccao: new Date().toISOString(),
        });
      }

      if (produtos.length === 0) {
        throw new Error('Nenhum produto válido encontrado no CSV.');
      }

      // ✅ NOVA VALIDAÇÃO: Verificar se já existem no banco com status pendente/em_analise
      const gtinsParaVerificar = produtos.map(p => p.ean_gtin);
      const { data: existentes, error: errorVerificacao } = await supabase
        .from('produtos_em_analise')
        .select('ean_gtin')
        .in('ean_gtin', gtinsParaVerificar)
        .in('status', ['pendente', 'em_analise']);

      if (errorVerificacao) {
        console.error('Erro ao verificar duplicatas:', errorVerificacao);
      }

      // Filtrar produtos que já existem no banco
      const gtinsExistentes = new Set(existentes?.map(e => e.ean_gtin) || []);
      const produtosNovos = produtos.filter(p => {
        if (gtinsExistentes.has(p.ean_gtin)) {
          erros.push(`EAN/GTIN "${p.ean_gtin}" já está pendente de análise no sistema`);
          return false;
        }
        return true;
      });

      if (produtosNovos.length === 0) {
        throw new Error('Todos os produtos do CSV já estão registrados como pendentes de análise.');
      }

      // Inserir apenas produtos novos na tabela produtos_em_analise
      const { data, error } = await supabase
        .from('produtos_em_analise')
        .insert(produtosNovos)
        .select();

      if (error) throw error;

      const mensagemSucesso = produtosNovos.length === produtos.length
        ? `${produtosNovos.length} produto(s) adicionado(s) para análise!`
        : `${produtosNovos.length} de ${produtos.length} produto(s) adicionado(s)`;

      toast({
        title: 'Upload concluído!',
        description: `${mensagemSucesso}${erros.length > 0 ? ` (${erros.length} ignorado(s) por duplicação ou erro)` : ''}`,
      });

      if (erros.length > 0) {
        console.warn('Produtos não processados:', erros);
        toast({
          title: 'Alguns produtos não foram adicionados',
          description: `${erros.length} produto(s) ignorado(s) por duplicação ou erro. Veja os detalhes no console.`,
          variant: 'destructive',
        });
      }

      // Fechar dialog e limpar
      setUploadDialogOpen(false);
      setCsvFile(null);
      
      // Recarregar lista
      await loadProdutos();

    } catch (error: any) {
      console.error('Erro ao processar CSV:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível processar o arquivo CSV.',
        variant: 'destructive',
      });
    } finally {
      setUploadProcessing(false);
    }
  };

  // ==================== FUNÇÕES DE CONSULTA API ====================
  
  const toggleSelecionarProduto = (produtoId: string) => {
    const novaSelecao = new Set(produtosSelecionados);
    if (novaSelecao.has(produtoId)) {
      novaSelecao.delete(produtoId);
    } else {
      novaSelecao.add(produtoId);
    }
    setProdutosSelecionados(novaSelecao);
  };

  const toggleSelecionarTodos = () => {
    // Apenas produtos pendentes ou acao_manual podem ser consultados
    const produtosConsultaveis = filteredProdutos.filter(p => 
      p.status === 'pendente' || p.status === 'acao_manual'
    );

    if (produtosSelecionados.size === produtosConsultaveis.length) {
      setProdutosSelecionados(new Set());
    } else {
      setProdutosSelecionados(new Set(produtosConsultaveis.map(p => p.id)));
    }
  };

  const abrirModalConfirmacaoConsulta = () => {
    if (produtosSelecionados.size === 0) {
      toast({
        title: 'Nenhum produto selecionado',
        description: 'Selecione pelo menos um produto para consultar.',
        variant: 'destructive',
      });
      return;
    }

    if (consultasHoje >= 100) {
      toast({
        title: 'Limite de consultas atingido',
        description: 'Você já realizou 100 consultas hoje. Tente novamente amanhã.',
        variant: 'destructive',
      });
      return;
    }

    setConsultaAPIDialogOpen(true);
  };

  const consultarAPIComCadastroAutomatico = async () => {
    setConsultaAPIDialogOpen(false);
    setConsultandoAPI(true);
    setProgressoConsulta(0);
    
    const resultados = {
      autoCadastrados: [] as string[],
      precisamRevisao: [] as string[],
      naoEncontrados: [] as string[],
      erros: [] as Array<{ id: string; erro: string }>,
    };

    const produtosParaConsultar = Array.from(produtosSelecionados);
    const total = produtosParaConsultar.length;
    let consultasRealizadas = 0;

    try {
      for (let i = 0; i < produtosParaConsultar.length; i++) {
        // ✅ CORREÇÃO: Verificar limite ANTES de cada consulta
        const consultasAtuais = consultasHoje + consultasRealizadas;
        if (consultasAtuais >= 100) {
          toast({
            title: 'Limite diário atingido',
            description: `Processadas ${consultasRealizadas} consultas. Limite de 100/dia atingido.`,
            variant: 'destructive',
          });
          break; // Interrompe o loop
        }

        const produtoId = produtosParaConsultar[i];
        
        try {
          // 1. Buscar produto do banco
          const produto = produtos.find(p => p.id === produtoId);
          if (!produto) continue;

          // 2. Consultar API Cosmos usando o serviço aprimorado
          // ⚠️ O rate limiting já está incluído no serviço - não precisa de delay aqui!
          console.log(`📡 Iniciando consulta ${i + 1}/${total} - GTIN: ${produto.ean_gtin}`);
          const inicioConsulta = Date.now();
          // ✅ Passar flag de primeira requisição para acordar Render.com
          const isFirstRequest = i === 0;
          const dadosAPI = await consultarAPIProdutos(produto.ean_gtin, isFirstRequest);
          const tempoResposta = Date.now() - inicioConsulta;
          console.log(`⏱️ Consulta concluída em ${(tempoResposta / 1000).toFixed(2)}s`);

          // 3. Registrar consulta no log
          let consultaBemSucedida = false;
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { error: logError } = await supabase.from('log_consultas_api').insert({
                admin_id: user.id,
                produto_id: produtoId,
                ean_gtin: produto.ean_gtin,
                sucesso: dadosAPI.encontrado,
                tempo_resposta_ms: tempoResposta,
                resposta_api: dadosAPI,
                erro_mensagem: dadosAPI.encontrado ? null : dadosAPI.mensagem
              });
              
              // ✅ CORREÇÃO: Se o trigger bloqueou (limite atingido), parar
              if (logError) {
                console.error('Erro ao registrar consulta:', logError);
                if (logError.message.includes('Limite diário')) {
                  toast({
                    title: 'Limite diário atingido',
                    description: `Processadas ${consultasRealizadas} consultas. O banco de dados bloqueou novas consultas.`,
                    variant: 'destructive',
                  });
                  break; // Interrompe o loop SEM marcar como consultado
                }
                throw logError;
              }
              
              // ✅ Consulta foi registrada com sucesso
              consultaBemSucedida = true;
              consultasRealizadas++;
              setConsultasHoje(prev => prev + 1);
            }
          } catch (logError) {
            console.error('Erro ao registrar consulta no log:', logError);
            // Se for erro de limite, não continua
            if (logError instanceof Error && logError.message.includes('Limite')) {
              break; // Interrompe o loop SEM marcar como consultado
            }
            // Outros erros não bloqueiam o fluxo
          }

          // ✅ CORREÇÃO: Só atualiza status se consulta foi bem-sucedida
          if (!consultaBemSucedida) {
            console.warn('⚠️ Consulta não registrada - produto permanece pendente:', produtoId);
            continue; // Pula para o próximo produto
          }

          // 4. Atualizar produto com dados da API na tabela produtos_em_analise
          // Limpar objeto para evitar dados circulares ou muito grandes
          // Inferir dados inteligentes baseados na resposta da API
          const tipoEmbalagemmInferido = inferirTipoEmbalagem(dadosAPI);
          const pesoInferido = inferirPeso(dadosAPI);
          
          const dadosAPILimpos = {
            ean_gtin: dadosAPI.ean_gtin,
            descricao: dadosAPI.descricao,
            marca: dadosAPI.marca,
            fabricante: dadosAPI.fabricante,
            ncm: dadosAPI.ncm,
            ncm_descricao: dadosAPI.ncm_descricao,
            preco_medio: dadosAPI.preco_medio,
            peso_liquido: dadosAPI.peso_liquido,
            peso_bruto: dadosAPI.peso_bruto,
            peso_medio_gramas: pesoInferido, // Inferido
            categoria_api: dadosAPI.categoria_api,
            imagem_url: dadosAPI.imagem_url,
            tipo_embalagem: tipoEmbalagemmInferido, // Inferido
            reciclavel: inferirReciclabilidade(tipoEmbalagemmInferido), // Inferido
            percentual_reciclabilidade: inferirPercentualReciclabilidade(tipoEmbalagemmInferido), // Inferido
            encontrado: dadosAPI.encontrado,
            mensagem: dadosAPI.mensagem
          };

          const { error: updateError } = await supabase
            .from('produtos_em_analise')
            .update({
              dados_api: dadosAPILimpos,
              consultado_em: new Date().toISOString(),
              status: 'consultado',
              updated_at: new Date().toISOString()
            })
            .eq('id', produtoId);

          if (updateError) {
            console.error('❌ Erro ao atualizar produto na base:', updateError);
            console.error('📝 Produto ID:', produtoId);
            console.error('📝 GTIN:', produto.ean_gtin);
            throw new Error(`Falha ao salvar dados da API: ${updateError.message}`);
          }

          console.log('✅ Produto atualizado com sucesso:', produtoId);

          // 5. Decidir: cadastro automático ou revisão manual
          if (validarDadosCompletos(dadosAPI)) {
            // CADASTRO AUTOMÁTICO
            // await cadastrarProdutoAutomatico(dadosAPI);
            // await handleUpdateStatus(produtoId, 'aprovado');
            resultados.autoCadastrados.push(produto.descricao);
          } else if (dadosAPI.encontrado) {
            // DADOS INCOMPLETOS - revisão manual
            resultados.precisamRevisao.push(produto.descricao);
          } else {
            // NÃO ENCONTRADO
            resultados.naoEncontrados.push(produto.descricao);
          }
        } catch (error: any) {
          // 🚫 Verificar se é erro de rate limit (limite diário Bluesoft)
          if (error.message && error.message.includes('RATE_LIMIT')) {
            toast({
              title: '🚫 Limite Diário Atingido',
              description: 'A API Bluesoft Cosmos bloqueou novas consultas. O processamento foi interrompido. Aguarde até meia-noite (00:00) para continuar.',
              variant: 'destructive',
              duration: 10000,
            });
            
            // Registrar erro específico
            resultados.erros.push({ 
              id: produtoId, 
              erro: '🚫 LIMITE DIÁRIO ATINGIDO - API Bluesoft bloqueou consultas. Aguarde até 00:00.'
            });
            
            // INTERROMPER PROCESSAMENTO IMEDIATAMENTE
            break;
          }
          
          // Outros erros
          resultados.erros.push({ 
            id: produtoId, 
            erro: error.message 
          });
        }

        // Atualizar progresso
        setProgressoConsulta(((i + 1) / total) * 100);
      }

      // Mostrar resultados
      setResultadosConsulta(resultados);
      
      toast({
        title: '✅ Consulta concluída!',
        description: `${resultados.autoCadastrados.length} cadastrados, ${resultados.precisamRevisao.length} precisam revisão`,
      });

      // Limpar seleção e recarregar
      setProdutosSelecionados(new Set());
      await loadProdutos();

    } catch (error: any) {
      toast({
        title: 'Erro na consulta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setConsultandoAPI(false);
      setProgressoConsulta(0);
    }
  };

  const abrirModalDadosAPI = (produto: ProdutoEmAnalise) => {
    setProdutoComDadosAPI(produto);
    setModalDadosAPIOpen(true);
  };

  const preencherFormularioComDadosAPI = (produto: ProdutoEmAnalise) => {
    if (!produto.dados_api) return;

    const dados = produto.dados_api as DadosAPIOnRender;
    
    // 🧠 INTELIGÊNCIA: Inferir tipo de embalagem pela categoria
    const tipoEmbalagem = dados.tipo_embalagem || inferirTipoEmbalagem(dados);
    
    // 🧠 INTELIGÊNCIA: Estimar reciclabilidade baseado no tipo de embalagem
    const { reciclavel, percentual } = estimarReciclabilidade(tipoEmbalagem);
    
    // 🧠 INTELIGÊNCIA: Extrair apenas o código NCM (remove descrição)
    const ncmLimpo = extrairCodigoNCM(dados.ncm);
    
    // Montar observações inteligentes
    const observacoesAuto = [
      dados.marca ? `Marca: ${dados.marca}` : null,
      dados.categoria_api ? `Categoria: ${dados.categoria_api}` : null,
      dados.preco_medio ? `Preço médio: R$ ${dados.preco_medio.toFixed(2)}` : null,
    ].filter(Boolean).join(' | ');
    
    setFormData({
      gtin: dados.ean_gtin || produto.ean_gtin,
      ncm: ncmLimpo, // ✅ NCM limpo (apenas números)
      descricao: dados.descricao || produto.descricao,
      tipo_embalagem: tipoEmbalagem, // ✅ Inferido inteligentemente
      reciclavel: dados.reciclavel ?? reciclavel, // ✅ Estimado por tipo
      percentual_reciclabilidade: dados.percentual_reciclabilidade || percentual, // ✅ Estimado
      peso_medio_gramas: dados.peso_medio_gramas || dados.peso_liquido || dados.peso_bruto || null,
      observacoes: dados.observacoes || observacoesAuto // ✅ Observações automáticas
    });
    
    setProdutoParaCadastro(produto);
    setModalDadosAPIOpen(false);
    setCadastroDialogOpen(true);

    toast({
      title: '🧠 Dados carregados com inteligência!',
      description: `NCM: ${ncmLimpo} | Embalagem: ${TIPOS_EMBALAGEM_LABELS[tipoEmbalagem]} | Reciclabilidade: ${percentual}%`,
    });
  };

  const openDialog = (produto: ProdutoEmAnalise, action: 'aprovar' | 'rejeitar' | 'observacao') => {
    setSelectedProduct(produto);
    setActionType(action);
    setObservacoes(produto.observacoes || '');
    setDialogOpen(true);
  };

  // 🔄 Função para reverter produto de "consultado" para "pendente"
  const handleReverterConsulta = async (produto: ProdutoEmAnalise) => {
    if (produto.status !== 'consultado') {
      toast({
        title: 'Ação inválida',
        description: 'Apenas produtos consultados podem ser revertidos.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('produtos_em_analise')
        .update({
          status: 'pendente',
          dados_api: null, // Limpa os dados da API
          consultado_em: null, // Limpa a data de consulta
          updated_at: new Date().toISOString(),
        })
        .eq('id', produto.id);

      if (error) throw error;

      toast({
        title: '🔄 Status revertido!',
        description: `Produto ${produto.ean_gtin} voltou para PENDENTE. Você pode consultá-lo novamente.`,
      });

      await loadProdutos();
    } catch (error: any) {
      console.error('Erro ao reverter status:', error);
      toast({
        title: 'Erro ao reverter',
        description: error.message || 'Não foi possível reverter o status do produto.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Função para calcular a prioridade baseada no tempo (72 horas para produtos QR Code)
  const getPrioridade = (produto: ProdutoEmAnalise) => {
    // Apenas produtos via QR Code tem prazo de 72 horas (independente do status)
    if (produto.origem !== 'qrcode') {
      return null;
    }

    const horasDesdeDeteccao = differenceInHours(new Date(), new Date(produto.data_primeira_deteccao));
    const horasRestantes = 72 - horasDesdeDeteccao;

    return {
      horasDecorridas: horasDesdeDeteccao,
      horasRestantes: Math.max(0, horasRestantes),
      percentualDecorrido: Math.min(100, (horasDesdeDeteccao / 72) * 100),
      isVencido: horasDesdeDeteccao > 72,
      isCritico: horasRestantes <= 12 && horasRestantes > 0, // Últimas 12 horas
      isAlerta: horasRestantes > 12 && horasRestantes <= 24, // Entre 12 e 24 horas
      isAtencao: horasRestantes > 24 && horasRestantes <= 48, // Entre 24 e 48 horas
    };
  };

  // Badge de urgência para produtos QR Code
  const getUrgenciaBadge = (produto: ProdutoEmAnalise) => {
    const prioridade = getPrioridade(produto);
    if (!prioridade) return null;

    if (prioridade.isVencido) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 font-semibold animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          VENCIDO há {Math.floor(prioridade.horasDecorridas - 72)}h
        </Badge>
      );
    }

    if (prioridade.isCritico) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 font-semibold">
          <Clock className="h-3 w-3 mr-1" />
          CRÍTICO - {Math.floor(prioridade.horasRestantes)}h restantes
        </Badge>
      );
    }

    if (prioridade.isAlerta) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 font-semibold">
          <Clock className="h-3 w-3 mr-1" />
          URGENTE - {Math.floor(prioridade.horasRestantes)}h restantes
        </Badge>
      );
    }

    if (prioridade.isAtencao) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(prioridade.horasRestantes)}h restantes
        </Badge>
      );
    }

    // Normal - mais de 48 horas restantes
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        <Clock className="h-3 w-3 mr-1" />
        {Math.floor(prioridade.horasRestantes)}h restantes
      </Badge>
    );
  };

  // Classe CSS para linha da tabela baseada na urgência
  const getRowClassName = (produto: ProdutoEmAnalise) => {
    const prioridade = getPrioridade(produto);
    if (!prioridade) return '';

    if (prioridade.isVencido) {
      return 'bg-red-50 border-l-4 border-l-red-500';
    }

    if (prioridade.isCritico) {
      return 'bg-red-25 border-l-4 border-l-red-400';
    }

    if (prioridade.isAlerta) {
      return 'bg-orange-25 border-l-4 border-l-orange-400';
    }

    if (prioridade.isAtencao) {
      return 'bg-yellow-25 border-l-4 border-l-yellow-400';
    }

    return '';
  };

  const filteredProdutos = produtos
    .filter(produto => 
      produto.status === 'pendente' || 
      produto.status === 'acao_manual' || 
      produto.status === 'consultado' // ✅ INCLUIR produtos consultados para cadastro
    )
    .filter(produto => {
      const matchesSearch = 
        produto.ean_gtin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigem = filterOrigem === 'all' || produto.origem === filterOrigem;

      // ✅ NOVO: Filtro por status da API
      let matchesAPIStatus = true;
      if (filterAPIStatus === 'encontrados') {
        matchesAPIStatus = produto.status === 'consultado' && 
                          produto.dados_api?.encontrado === true;
      } else if (filterAPIStatus === 'nao_encontrados') {
        matchesAPIStatus = produto.status === 'consultado' && 
                          produto.dados_api?.encontrado === false;
      } else if (filterAPIStatus === 'nao_consultados') {
        matchesAPIStatus = produto.status !== 'consultado';
      }

      return matchesSearch && matchesOrigem && matchesAPIStatus;
    });

  // Estatísticas - Apenas produtos PENDENTES e ACAO_MANUAL
  const produtosPendentes = produtos.filter(p => p.status === 'pendente' || p.status === 'acao_manual');
  
  // ✅ NOVO: Estatísticas de produtos consultados
  const produtosConsultados = produtos.filter(p => p.status === 'consultado');
  const produtosEncontradosAPI = produtosConsultados.filter(p => p.dados_api?.encontrado === true);
  const produtosNaoEncontradosAPI = produtosConsultados.filter(p => p.dados_api?.encontrado === false);
  
  const stats = {
    total: produtosPendentes.length,
    pendentes: produtosPendentes.filter(p => p.status === 'pendente').length,
    acaoManual: produtosPendentes.filter(p => p.status === 'acao_manual').length,
    qrcode: produtosPendentes.filter(p => p.origem === 'qrcode').length,
    manual: produtosPendentes.filter(p => p.origem === 'manual').length,
    // ✅ NOVO: Estatísticas de consulta API
    consultados: produtosConsultados.length,
    encontradosAPI: produtosEncontradosAPI.length,
    naoEncontradosAPI: produtosNaoEncontradosAPI.length,
    // Estatísticas de urgência (apenas QR Code pendentes)
    vencidos: produtosPendentes.filter(p => {
      const pri = getPrioridade(p);
      return pri?.isVencido;
    }).length,
    criticos: produtosPendentes.filter(p => {
      const pri = getPrioridade(p);
      return pri?.isCritico;
    }).length,
    urgentes: produtosPendentes.filter(p => {
      const pri = getPrioridade(p);
      return pri?.isAlerta;
    }).length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className: string }> = {
      pendente: { variant: 'outline', label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      em_analise: { variant: 'outline', label: 'Em Análise', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      aprovado: { variant: 'outline', label: 'Aprovado', className: 'bg-green-50 text-green-700 border-green-200' },
      rejeitado: { variant: 'outline', label: 'Rejeitado', className: 'bg-red-50 text-red-700 border-red-200' },
      acao_manual: { variant: 'outline', label: 'Ação Manual', className: 'bg-orange-50 text-orange-700 border-orange-200' },
      consultado: { variant: 'outline', label: 'Consultado', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    };

    const config = variants[status] || variants.pendente;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getOrigemBadge = (origem: string) => {
    if (origem === 'qrcode') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <QrCode className="h-3 w-3 mr-1" />
            QR Code
          </Badge>
          <div title="Prioridade Máxima">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
        </div>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <Edit className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/products')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Produtos
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produtos em Análise</h1>
            <p className="text-muted-foreground mt-1">
              Produtos não cadastrados detectados durante upload de notas fiscais
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>
            <Button
              variant="outline"
              onClick={abrirModalConfirmacaoConsulta}
              disabled={produtosSelecionados.size === 0 || consultasHoje >= 100}
              className="relative"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Consultar API
              {produtosSelecionados.size > 0 && (
                <Badge className="ml-2 bg-blue-600">{produtosSelecionados.size}</Badge>
              )}
            </Button>
            <Button
              variant="default"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload em Massa
            </Button>
          </div>
        </div>

        {/* Contador de Consultas API */}
        <div className="flex items-center gap-3 mt-2 text-sm">
          <Badge variant={consultasHoje >= 100 ? "destructive" : "outline"}>
            {consultasHoje}/100 consultas hoje
          </Badge>
          {consultasHoje >= 100 && (
            <span className="text-red-600">Limite diário atingido</span>
          )}
          
          {/* Botão de Atualizar Contador */}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadConsultasHoje}
            className="h-7 px-2 text-xs gap-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            title="Atualizar contador"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          
          {/* Botão de Reset do Contador */}
          {consultasHoje > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={calcularConsultasParaReset}
              className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <RotateCcw className="h-3 w-3" />
              Resetar Contador
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas - Uma linha só */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold">{stats.total}</p>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-yellow-600">{stats.pendentes}</p>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Urgência - Vencidos */}
        {stats.vencidos > 0 && (
          <Card className="col-span-1 border-red-300 bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-red-700 font-medium mb-1">Vencidos (&gt;72h)</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-red-700">{stats.vencidos}</p>
                  <AlertTriangle className="h-5 w-5 text-red-700 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Urgência - Críticos */}
        {stats.criticos > 0 && (
          <Card className="col-span-1 border-red-200 bg-red-25">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-red-600 font-medium mb-1">Críticos (&lt;12h)</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-red-600">{stats.criticos}</p>
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Urgência - Urgentes */}
        {stats.urgentes > 0 && (
          <Card className="col-span-1 border-orange-200 bg-orange-25">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-orange-600 font-medium mb-1">Urgentes (&lt;24h)</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-orange-600">{stats.urgentes}</p>
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Via QR Code</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-purple-600">{stats.qrcode}</p>
                <QrCode className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground mb-1">Manual</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-gray-600">{stats.manual}</p>
                <Edit className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Ação Manual */}
        {stats.acaoManual > 0 && (
          <Card className="col-span-1 border-orange-200 bg-orange-25">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-orange-600 font-medium mb-1">Ação Manual</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-orange-600">{stats.acaoManual}</p>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-[10px] text-orange-600/70 mt-1">Sem GTIN válido</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NOVO: Card de Produtos Encontrados na API */}
        {stats.encontradosAPI > 0 && (
          <Card className="col-span-1 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-green-700 font-medium mb-1">Encontrados na API</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-green-700">{stats.encontradosAPI}</p>
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                </div>
                <p className="text-[10px] text-green-700/70 mt-1">Com dados completos</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ NOVO: Card de Produtos Consultados (Total) */}
        {stats.consultados > 0 && (
          <Card className="col-span-1 border-cyan-200 bg-cyan-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col">
                <p className="text-xs text-cyan-700 font-medium mb-1">Consultados</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-cyan-700">{stats.consultados}</p>
                  <Database className="h-5 w-5 text-cyan-700" />
                </div>
                <p className="text-[10px] text-cyan-700/70 mt-1">
                  {stats.encontradosAPI} encontrados, {stats.naoEncontradosAPI} não encontrados
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="EAN ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Origem</Label>
              <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="qrcode">QR Code</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ✅ NOVO: Filtro por status da API */}
            <div>
              <Label className="mb-2">Status API</Label>
              <Select value={filterAPIStatus} onValueChange={setFilterAPIStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="encontrados">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Encontrados na API
                    </div>
                  </SelectItem>
                  <SelectItem value="nao_encontrados">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      Não Encontrados
                    </div>
                  </SelectItem>
                  <SelectItem value="nao_consultados">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                      Não Consultados
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Produtos ({filteredProdutos.length})</CardTitle>
          <CardDescription>
            Produtos detectados que ainda não estão cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          produtosSelecionados.size > 0 &&
                          produtosSelecionados.size === 
                            filteredProdutos.filter(p => p.status === 'pendente' || p.status === 'acao_manual').length
                        }
                        onCheckedChange={toggleSelecionarTodos}
                      />
                    </TableHead>
                    <TableHead className="w-[130px]">EAN/GTIN</TableHead>
                    <TableHead className="min-w-[250px]">Descrição</TableHead>
                    <TableHead className="w-[130px]">Origem</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[200px]">Urgência</TableHead>
                    <TableHead className="w-[110px]">Ocorrências</TableHead>
                    <TableHead className="w-[150px]">Última Detecção</TableHead>
                    <TableHead className="text-right w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map((produto) => {
                    const podeConsultar = produto.status === 'pendente' || produto.status === 'acao_manual';
                    
                    return (
                    <TableRow key={produto.id} className={getRowClassName(produto)}>
                      <TableCell>
                        {podeConsultar ? (
                          <Checkbox
                            checked={produtosSelecionados.has(produto.id)}
                            onCheckedChange={() => toggleSelecionarProduto(produto.id)}
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-sm">
                        {produto.ean_gtin.startsWith('SEM_GTIN_') ? 'SEM GTIN' : produto.ean_gtin}
                      </TableCell>
                      <TableCell className="font-medium">
                        {produto.descricao}
                      </TableCell>
                      <TableCell>{getOrigemBadge(produto.origem)}</TableCell>
                      <TableCell>{getStatusBadge(produto.status)}</TableCell>
                      <TableCell>{getUrgenciaBadge(produto)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{produto.quantidade_ocorrencias}x</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(produto.data_ultima_deteccao), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🔄 Botão "Reverter Consulta" - apenas para produtos consultados SEM sucesso */}
                          {produto.status === 'consultado' && 
                           (!produto.dados_api || produto.dados_api.encontrado !== true) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReverterConsulta(produto)}
                              disabled={processing}
                              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                              title="Reverter para Pendente e consultar novamente"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reverter
                            </Button>
                          )}
                          
                          {/* Botão "Ver Dados da API" - apenas para produtos consultados COM SUCESSO */}
                          {produto.status === 'consultado' && 
                           produto.dados_api && 
                           produto.dados_api.encontrado === true && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirModalDadosAPI(produto)}
                              className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Dados
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCadastrarProduto(produto)}
                            disabled={processing}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Cadastrar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDialog(produto, 'rejeitar')}
                            disabled={processing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Ações */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'aprovar' && 'Aprovar Produto'}
              {actionType === 'rejeitar' && 'Rejeitar Produto'}
              {actionType === 'observacao' && 'Adicionar Observação'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <div className="mt-2">
                  <p className="font-medium">{selectedProduct.ean_gtin}</p>
                  <p className="text-sm">{selectedProduct.descricao}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre este produto..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedProduct) {
                  const novoStatus = actionType === 'rejeitar' ? 'rejeitado' : 
                                    actionType === 'aprovar' ? 'aprovado' : 
                                    'em_analise';
                  handleUpdateStatus(selectedProduct.id, novoStatus, observacoes);
                }
              }}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro de Produto */}
      <Dialog open={cadastroDialogOpen} onOpenChange={setCadastroDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do produto para adicioná-lo ao catálogo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* EAN/GTIN */}
            <div className="space-y-2">
              <Label htmlFor="gtin">EAN/GTIN *</Label>
              <Input
                id="gtin"
                value={formData.gtin}
                onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                placeholder="7891234567890"
                className="font-mono"
              />
            </div>

            {/* NCM - OBRIGATÓRIO */}
            <div className="space-y-2">
              <Label htmlFor="ncm">NCM *</Label>
              <Input
                id="ncm"
                value={formData.ncm}
                onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                placeholder="12345678"
                maxLength={8}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Nomenclatura Comum do Mercosul - obrigatório para nota fiscal
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Produto *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: GARRAFA PET 2L COCA COLA"
              />
            </div>

            {/* Tipo de Embalagem */}
            <div className="space-y-2">
              <Label htmlFor="tipo_embalagem">Tipo de Embalagem *</Label>
              <Select
                value={formData.tipo_embalagem}
                onValueChange={(value) => setFormData({ ...formData, tipo_embalagem: value as TipoEmbalagem })}
              >
                <SelectTrigger id="tipo_embalagem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_EMBALAGEM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Peso Médio da Embalagem */}
            <div className="space-y-2">
              <Label htmlFor="peso_medio">Peso Médio da Embalagem (kg)</Label>
              <Input
                id="peso_medio"
                type="number"
                step="0.001"
                min="0"
                value={formData.peso_medio_gramas ? (formData.peso_medio_gramas / 1000).toFixed(3) : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  peso_medio_gramas: e.target.value ? parseFloat(e.target.value) * 1000 : null
                })}
                placeholder="Ex: 0.250"
              />
              <p className="text-xs text-muted-foreground">
                Peso médio da embalagem vazia em quilos (para cálculo de peso total)
              </p>
            </div>

            {/* Reciclável */}
            <div className="flex items-center space-x-2">
              <Switch
                id="reciclavel"
                checked={formData.reciclavel}
                onCheckedChange={(checked) => setFormData({ ...formData, reciclavel: checked })}
              />
              <Label htmlFor="reciclavel">Material Reciclável</Label>
            </div>

            {/* Percentual de Reciclabilidade */}
            <div className="space-y-3">
              <Label htmlFor="percentual">
                Percentual de Reciclabilidade: {formData.percentual_reciclabilidade}%
              </Label>
              <Slider
                id="percentual"
                min={0}
                max={100}
                step={5}
                value={[formData.percentual_reciclabilidade]}
                onValueChange={(value) => setFormData({ ...formData, percentual_reciclabilidade: value[0] })}
              />
              {/* Barra de progresso visual */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      formData.percentual_reciclabilidade >= 80 ? 'bg-green-500' :
                      formData.percentual_reciclabilidade >= 50 ? 'bg-yellow-500' :
                      formData.percentual_reciclabilidade >= 25 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${formData.percentual_reciclabilidade}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">
                    {formData.percentual_reciclabilidade >= 80 ? '🟢 Excelente' :
                     formData.percentual_reciclabilidade >= 50 ? '🟡 Bom' :
                     formData.percentual_reciclabilidade >= 25 ? '🟠 Regular' :
                     '🔴 Baixo'}
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o produto"
                rows={3}
              />
            </div>

            {/* Preview das informações */}
            {produtoParaCadastro && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Informações de Origem:</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>• Detectado via:</span>
                    <Badge variant="outline" className="ml-1">
                      {produtoParaCadastro.origem === 'qrcode' ? '🔲 QR Code' : '✏️ Manual'}
                    </Badge>
                  </div>
                  <p>• Ocorrências: {produtoParaCadastro.quantidade_ocorrencias}x</p>
                  <p>• Primeira detecção: {new Date(produtoParaCadastro.data_primeira_deteccao).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCadastroDialogOpen(false);
                setProdutoParaCadastro(null);
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarProduto}
              disabled={processing || !formData.gtin || !formData.ncm || !formData.descricao}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Package className="h-4 w-4 mr-2" />
              Salvar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload CSV */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload em Massa de Produtos
            </DialogTitle>
            <DialogDescription>
              Adicione múltiplos produtos para análise de uma vez usando um arquivo CSV
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-medium text-blue-900">Como usar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Baixe o template CSV clicando no botão abaixo</li>
                    <li>Preencha apenas EAN/GTIN e Descrição</li>
                    <li>Faça upload do arquivo preenchido</li>
                    <li>Os produtos serão adicionados como "Pendentes" para cadastro</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Botão para baixar template */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-sm">Template CSV</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Arquivo simples com 2 colunas: EAN e Descrição
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </div>

            {/* Campos obrigatórios */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-sm text-green-900 mb-2">📋 Formato do CSV:</p>
              <div className="text-xs text-green-700 space-y-2">
                <p className="font-mono bg-white p-2 rounded border border-green-200">
                  ean_gtin,descricao<br/>
                  7891234567890,Garrafa PET 2L<br/>
                  7891234567891,Lata de Alumínio 350ml
                </p>
                <p className="text-xs">
                  ℹ️ <strong>Apenas 2 campos necessários:</strong> EAN/GTIN e Descrição do produto.
                  Após o upload, você poderá cadastrar cada produto com as informações completas.
                </p>
              </div>
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Arquivo CSV</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploadProcessing}
              />
              {csvFile && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Arquivo selecionado: {csvFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                setCsvFile(null);
              }}
              disabled={uploadProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadCSV}
              disabled={uploadProcessing || !csvFile}
            >
              {uploadProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Consulta API */}
      <Dialog open={consultaAPIDialogOpen} onOpenChange={setConsultaAPIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Consultar API OnRender
            </DialogTitle>
            <DialogDescription>
              Você está prestes a consultar a API externa para buscar informações dos produtos selecionados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900">Produtos selecionados:</span>
                <Badge className="bg-blue-600">{produtosSelecionados.size}</Badge>
              </div>
              <p className="text-sm text-blue-700">
                Produtos com dados completos serão <strong>cadastrados automaticamente</strong>.
              </p>
              <p className="text-sm text-blue-700">
                Produtos com dados incompletos ficarão com status <strong>"Consultado"</strong> para revisão manual.
              </p>
            </div>

            {/* ✅ CORREÇÃO: Aviso quando exceder o limite */}
            {consultasHoje + produtosSelecionados.size > 100 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <strong>Atenção: Limite será excedido!</strong>
                </p>
                <p className="text-sm text-red-700">
                  Você selecionou <strong>{produtosSelecionados.size} produtos</strong>, mas só restam{' '}
                  <strong>{Math.max(0, 100 - consultasHoje)} consultas</strong> disponíveis hoje.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  ⚠️ Serão processadas apenas as <strong>primeiras {Math.max(0, 100 - consultasHoje)}</strong> consultas.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <strong>Limite de consultas:</strong> {consultasHoje + produtosSelecionados.size}/100 consultas hoje
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConsultaAPIDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={consultarAPIComCadastroAutomatico}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Confirmar Consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Progresso da Consulta */}
      <Dialog open={consultandoAPI} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Consultando API...
            </DialogTitle>
            <DialogDescription>
              Aguarde enquanto processamos os produtos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={progressoConsulta} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(progressoConsulta)}% concluído
            </p>
            <p className="text-xs text-center text-muted-foreground">
              Este processo pode levar alguns minutos. Por favor, não feche esta janela.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultados da Consulta */}
      <Dialog open={resultadosConsulta !== null} onOpenChange={() => setResultadosConsulta(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Consulta Concluída
            </DialogTitle>
            <DialogDescription>
              Veja o resumo dos resultados da consulta à API
            </DialogDescription>
          </DialogHeader>

          {resultadosConsulta && (
            <div className="space-y-4">
              {/* Cadastrados Automaticamente */}
              {resultadosConsulta.autoCadastrados.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                      <Check className="h-4 w-4" />
                      Cadastrados Automaticamente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-700">
                        {resultadosConsulta.autoCadastrados.length}
                      </span>
                      <span className="text-sm text-green-600">produtos</span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-green-700 cursor-pointer hover:underline">
                        Ver lista de produtos
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-green-600">
                        {resultadosConsulta.autoCadastrados.map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                </Card>
              )}

              {/* Precisam Revisão */}
              {resultadosConsulta.precisamRevisao.length > 0 && (
                <Card className="bg-cyan-50 border-cyan-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-cyan-800">
                      <AlertCircle className="h-4 w-4" />
                      Precisam Revisão Manual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-cyan-700">
                        {resultadosConsulta.precisamRevisao.length}
                      </span>
                      <span className="text-sm text-cyan-600">produtos (dados incompletos)</span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-cyan-700 cursor-pointer hover:underline">
                        Ver lista de produtos
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-cyan-600">
                        {resultadosConsulta.precisamRevisao.map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                </Card>
              )}

              {/* Não Encontrados */}
              {resultadosConsulta.naoEncontrados.length > 0 && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-gray-800">
                      <Search className="h-4 w-4" />
                      Não Encontrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-gray-700">
                        {resultadosConsulta.naoEncontrados.length}
                      </span>
                      <span className="text-sm text-gray-600">produtos</span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-gray-700 cursor-pointer hover:underline">
                        Ver lista de produtos
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {resultadosConsulta.naoEncontrados.map((desc, i) => (
                          <li key={i}>• {desc}</li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                </Card>
              )}

              {/* Erros */}
              {resultadosConsulta.erros.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                      <X className="h-4 w-4" />
                      Erros Durante Consulta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-red-700">
                        {resultadosConsulta.erros.length}
                      </span>
                      <span className="text-sm text-red-600">erros</span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer hover:underline">
                        Ver detalhes dos erros
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-red-600">
                        {resultadosConsulta.erros.map((erro, i) => (
                          <li key={i}>• {erro.erro}</li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultadosConsulta(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização dos Dados da API */}
      <Dialog open={modalDadosAPIOpen} onOpenChange={setModalDadosAPIOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-600" />
              Dados Retornados da API Cosmos
            </DialogTitle>
            <DialogDescription>
              Informações obtidas da consulta à API OnRender
            </DialogDescription>
          </DialogHeader>

          {produtoComDadosAPI && produtoComDadosAPI.dados_api && (
            <div className="space-y-4">
              {/* Produto Base */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>EAN/GTIN:</strong> {produtoComDadosAPI.dados_api.ean_gtin}</div>
                    <div><strong>Encontrado:</strong> {produtoComDadosAPI.dados_api.encontrado ? '✅ Sim' : '❌ Não'}</div>
                  </div>
                  {produtoComDadosAPI.dados_api.descricao && (
                    <div><strong>Descrição:</strong> {produtoComDadosAPI.dados_api.descricao}</div>
                  )}
                  {produtoComDadosAPI.dados_api.marca && (
                    <div><strong>Marca:</strong> {produtoComDadosAPI.dados_api.marca}</div>
                  )}
                  {produtoComDadosAPI.dados_api.fabricante && (
                    <div><strong>Fabricante:</strong> {produtoComDadosAPI.dados_api.fabricante}</div>
                  )}
                </CardContent>
              </Card>

              {/* Classificação Fiscal */}
              {(produtoComDadosAPI.dados_api.ncm || produtoComDadosAPI.dados_api.categoria_api) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Classificação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {produtoComDadosAPI.dados_api.ncm && (
                      <div><strong>NCM:</strong> {produtoComDadosAPI.dados_api.ncm}</div>
                    )}
                    {produtoComDadosAPI.dados_api.ncm_descricao && (
                      <div><strong>Descrição NCM:</strong> {produtoComDadosAPI.dados_api.ncm_descricao}</div>
                    )}
                    {produtoComDadosAPI.dados_api.categoria_api && (
                      <div><strong>Categoria:</strong> {produtoComDadosAPI.dados_api.categoria_api}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Características Físicas */}
              {(produtoComDadosAPI.dados_api.peso_liquido || produtoComDadosAPI.dados_api.peso_bruto || produtoComDadosAPI.dados_api.peso_medio_gramas) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Características Físicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {produtoComDadosAPI.dados_api.peso_liquido && (
                      <div><strong>Peso Líquido:</strong> {produtoComDadosAPI.dados_api.peso_liquido}g</div>
                    )}
                    {produtoComDadosAPI.dados_api.peso_bruto && (
                      <div><strong>Peso Bruto:</strong> {produtoComDadosAPI.dados_api.peso_bruto}g</div>
                    )}
                    {produtoComDadosAPI.dados_api.peso_medio_gramas && (
                      <div><strong>Peso Médio:</strong> {produtoComDadosAPI.dados_api.peso_medio_gramas}g</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Embalagem */}
              {(produtoComDadosAPI.dados_api.tipo_embalagem || produtoComDadosAPI.dados_api.reciclavel !== undefined) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Embalagem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {produtoComDadosAPI.dados_api.tipo_embalagem && (
                      <div><strong>Tipo:</strong> {produtoComDadosAPI.dados_api.tipo_embalagem}</div>
                    )}
                    {produtoComDadosAPI.dados_api.reciclavel !== undefined && (
                      <div><strong>Reciclável:</strong> {produtoComDadosAPI.dados_api.reciclavel ? '✅ Sim' : '❌ Não'}</div>
                    )}
                    {produtoComDadosAPI.dados_api.percentual_reciclabilidade && (
                      <div><strong>Reciclabilidade:</strong> {produtoComDadosAPI.dados_api.percentual_reciclabilidade}%</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Preço */}
              {produtoComDadosAPI.dados_api.preco_medio && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Precificação</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div><strong>Preço Médio:</strong> R$ {produtoComDadosAPI.dados_api.preco_medio.toFixed(2)}</div>
                  </CardContent>
                </Card>
              )}

              {/* Imagem */}
              {produtoComDadosAPI.dados_api.imagem_url && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Imagem do Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={produtoComDadosAPI.dados_api.imagem_url} 
                      alt={produtoComDadosAPI.dados_api.descricao}
                      className="max-w-full h-auto rounded-md border"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Mensagem */}
              {produtoComDadosAPI.dados_api.mensagem && (
                <div className="text-sm text-muted-foreground italic">
                  💬 {produtoComDadosAPI.dados_api.mensagem}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModalDadosAPIOpen(false)}
            >
              Fechar
            </Button>
            {produtoComDadosAPI && (
              <Button 
                onClick={() => {
                  preencherFormularioComDadosAPI(produtoComDadosAPI);
                  setModalDadosAPIOpen(false);
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Preencher Formulário
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Reset do Contador */}
      <Dialog open={resetConsultasDialogOpen} onOpenChange={setResetConsultasDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              Resetar Contador de Consultas
            </DialogTitle>
            <DialogDescription>
              Analise cuidadosamente os dados antes de confirmar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Estatísticas */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de consultas hoje:</span>
                  <Badge variant="outline" className="text-base">
                    {consultasParaResetar.total}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    ✅ Bem-sucedidas (produto encontrado):
                  </span>
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-base">
                    {consultasParaResetar.sucesso}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">
                    ❌ Falhas/Não encontrados:
                  </span>
                  <Badge variant="destructive" className="text-base">
                    {consultasParaResetar.falhas}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Explicação */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-blue-900">
                🔄 O que será feito:
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4">
                <li>✅ <strong>Manter:</strong> {consultasParaResetar.sucesso} consultas que encontraram produtos</li>
                <li>❌ <strong>Remover:</strong> {consultasParaResetar.falhas} consultas com falha ou produto não encontrado</li>
                <li>🔓 <strong>Liberar:</strong> {consultasParaResetar.falhas} slots para novas consultas</li>
              </ul>
            </div>

            {/* Aviso */}
            {consultasParaResetar.falhas === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Todas as consultas de hoje foram bem-sucedidas. Não há nada para resetar.
                </p>
              </div>
            )}

            {/* Novo contador */}
            {consultasParaResetar.falhas > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900">
                  📊 Novo contador após reset:
                </p>
                <p className="text-2xl font-bold text-green-700 text-center mt-2">
                  {consultasParaResetar.sucesso}/100
                </p>
                <p className="text-xs text-green-600 text-center mt-1">
                  ({consultasParaResetar.falhas} slots liberados)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setResetConsultasDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={resetarContadorConsultas}
              disabled={consultasParaResetar.falhas === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Confirmar Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== INTEGRAÇÃO COM API COSMOS (RENDER) ====================

/**
 * 🚀 API REAL - Consulta produtos na API Cosmos via Render
 * Endpoint: https://ciclik-api-produtos.onrender.com
 * 
 * @param eanGtin - Código EAN/GTIN do produto
 * @returns Promise com dados do produto ou erro
 */
async function consultarAPIReal(eanGtin: string): Promise<DadosAPIOnRender> {
  const API_URL = 'https://ciclik-api-produtos.onrender.com';
  const API_TOKEN = 'ciclik_secret_token_2026';
  const TIMEOUT_MS = 90000; // ⚡ AUMENTADO: 90 segundos (cold start do Render pode demorar até 60s)
  const MAX_RETRIES = 2; // 🔄 NOVO: Máximo de tentativas em caso de timeout/erro

  // Produtos SEM GTIN válido não podem ser consultados
  if (eanGtin.startsWith('SEM_GTIN_') || eanGtin === 'SEM GTIN' || !eanGtin || eanGtin.length < 13) {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: 'Produto sem código GTIN válido - consulta impossível'
    };
  }

  // 🔄 Função auxiliar para fazer a requisição com retry
  const fazerRequisicao = async (tentativa: number = 1): Promise<Response> => {
    console.log(`🔍 Consultando GTIN ${eanGtin} (tentativa ${tentativa}/${MAX_RETRIES})...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/api/produtos/${eanGtin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Se for timeout e ainda tem tentativas, tenta novamente
      if (error.name === 'AbortError' && tentativa < MAX_RETRIES) {
        console.warn(`⏱️ Timeout na tentativa ${tentativa}. Tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguarda 2s antes de retry
        return fazerRequisicao(tentativa + 1);
      }
      
      throw error; // Propaga o erro se esgotou as tentativas
    }
  };

  try {
    // Fazer requisição com retry automático
    const response = await fazerRequisicao();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de autenticação inválido');
      } else if (response.status === 400) {
        throw new Error('GTIN inválido');
      } else if (response.status === 404) {
        // 404 não é erro - produto simplesmente não existe na base
        return {
          ean_gtin: eanGtin,
          encontrado: false,
          mensagem: 'Produto não encontrado na base Cosmos'
        };
      } else {
        throw new Error(`Erro na API: ${response.status}`);
      }
    }

    const dadosCosmos = await response.json();
    console.log(`✅ GTIN ${eanGtin} consultado com sucesso!`, dadosCosmos.encontrado ? '(encontrado)' : '(não encontrado)');

    // Mapear resposta da API Cosmos para o formato esperado
    return {
      ean_gtin: dadosCosmos.ean_gtin || eanGtin,
      descricao: dadosCosmos.descricao || undefined,
      marca: dadosCosmos.marca || undefined,
      fabricante: dadosCosmos.fabricante || undefined,
      ncm: dadosCosmos.ncm || undefined,
      ncm_descricao: dadosCosmos.ncm_completo ? dadosCosmos.ncm_completo.split(' - ')[1] : undefined,
      preco_medio: dadosCosmos.preco_medio || undefined,
      peso_liquido: dadosCosmos.peso_liquido_em_gramas || undefined,
      peso_bruto: dadosCosmos.peso_bruto_em_gramas || undefined,
      categoria_api: dadosCosmos.categoria_api || undefined,
      imagem_url: dadosCosmos.imagem_url || undefined,
      encontrado: dadosCosmos.encontrado,
      mensagem: dadosCosmos.mensagem || (dadosCosmos.encontrado ? 'Produto encontrado' : 'Produto não encontrado')
    };

  } catch (error: any) {
    console.error(`❌ Erro ao consultar GTIN ${eanGtin}:`, error);
    
    // Tratar erros específicos
    if (error.name === 'AbortError') {
      return {
        ean_gtin: eanGtin,
        encontrado: false,
        mensagem: `Timeout após ${MAX_RETRIES} tentativas - API pode estar sobrecarregada ou em cold start`
      };
    }

    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: `Erro ao consultar API: ${error.message}`
    };
  }
}

/**
 * 🧪 Mock da API OnRender para testes/desenvolvimento
 * Use consultarAPIReal() para produção
 */
async function consultarAPIMock(eanGtin: string): Promise<DadosAPIOnRender> {
  // Simula delay de rede (500ms a 2s)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));

  // Simula produtos SEM GTIN (não encontrados)
  if (eanGtin.startsWith('SEM_GTIN_') || eanGtin === 'SEM GTIN') {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: 'Produto sem código válido - consulta impossível'
    };
  }

  // Simula 70% de chance de encontrar o produto
  if (Math.random() < 0.7) {
    // Produtos encontrados com dados COMPLETOS (50% dos encontrados)
    if (Math.random() < 0.5) {
      return {
        ean_gtin: eanGtin,
        descricao: `Produto Teste ${eanGtin.substring(0, 8)}`,
        categoria: ['Alimentos', 'Bebidas', 'Higiene', 'Limpeza'][Math.floor(Math.random() * 4)],
        peso_gramas: Math.floor(Math.random() * 1000) + 100,
        marca: ['Marca A', 'Marca B', 'Marca C'][Math.floor(Math.random() * 3)],
        fabricante: 'Fabricante Exemplo LTDA',
        imagem_url: `https://via.placeholder.com/150?text=${eanGtin}`,
        reciclavel: Math.random() > 0.3,
        percentual_reciclabilidade: Math.floor(Math.random() * 100),
        encontrado: true
      };
    } 
    // Produtos encontrados com dados INCOMPLETOS (50% dos encontrados)
    else {
      return {
        ean_gtin: eanGtin,
        descricao: `Produto Parcial ${eanGtin.substring(0, 8)}`,
        // Faltam categoria e outros dados obrigatórios
        encontrado: true,
        mensagem: 'Dados parciais - requer revisão manual'
      };
    }
  }

  // 30% não encontrado na API
  return {
    ean_gtin: eanGtin,
    encontrado: false,
    mensagem: 'Produto não encontrado na base de dados'
  };
}

/**
 * Valida se os dados da API estão completos para cadastro automático
 * 
 * @param dados - Dados retornados pela API
 * @returns true se dados completos, false se incompletos
 */
function validarDadosCompletos(dados: DadosAPIOnRender): boolean {
  if (!dados.encontrado) return false;
  
  // Campos obrigatórios para cadastro automático
  const camposObrigatorios = [
    dados.ean_gtin,
    dados.descricao,
    dados.categoria
  ];

  return camposObrigatorios.every(campo => 
    campo !== undefined && 
    campo !== null && 
    String(campo).trim().length > 0
  );
}
