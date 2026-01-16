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
import { AlertCircle, ArrowLeft, Search, Package, QrCode, Edit, Check, X, ExternalLink, Loader2, TrendingUp, Clock, AlertTriangle, Upload, Download, FileSpreadsheet, RefreshCw, Eye } from 'lucide-react';
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

// Interface para resposta da API OnRender (placeholder)
interface DadosAPIOnRender {
  // Campos básicos
  ean_gtin: string;
  descricao?: string;
  marca?: string;
  fabricante?: string;
  
  // NCM (vem formatado: "17019900 - Outros")
  ncm?: string;
  ncm_descricao?: string; // Descrição do NCM
  
  // Preços (para análise/contexto)
  preco_minimo?: number;
  preco_maximo?: number;
  preco_medio?: number;
  
  // Pesos (geralmente None, mas pode vir)
  peso_liquido?: number;
  peso_bruto?: number;
  
  // Categoria da API (texto livre - ex: "Açúcar Refinado")
  categoria_api?: string;
  
  // Imagem oficial do produto
  imagem_url?: string;
  
  // Campos que NÃO vem da API (preenchimento inteligente ou manual)
  tipo_embalagem?: TipoEmbalagem;
  peso_medio_gramas?: number;
  reciclavel?: boolean;
  percentual_reciclabilidade?: number;
  observacoes?: string;
  
  // Controle
  encontrado: boolean;
  mensagem?: string;
  
  // Campos obsoletos (mantidos para retrocompatibilidade)
  categoria?: string;
  peso_gramas?: number;
}

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
      const { data, error } = await supabase
        .from('produtos_em_analise')
        .select('*')
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
    // Abrir modal de cadastro com dados pré-preenchidos
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

      // 1. Inserir produto em produto_ciclik
      const { data: novoProduto, error: errorProduto } = await supabase
        .from('produto_ciclik')
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
        .select()
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

    try {
      for (let i = 0; i < produtosParaConsultar.length; i++) {
        const produtoId = produtosParaConsultar[i];
        
        try {
          // 1. Buscar produto do banco
          const produto = produtos.find(p => p.id === produtoId);
          if (!produto) continue;

          // 2. Consultar API OnRender (usando mock por enquanto)
          const inicioConsulta = Date.now();
          const dadosAPI = await consultarAPIMock(produto.ean_gtin);
          const tempoResposta = Date.now() - inicioConsulta;

          // 3. Registrar consulta no log
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('log_consultas_api').insert({
                admin_id: user.id,
                produto_id: produtoId,
                ean_gtin: produto.ean_gtin,
                sucesso: dadosAPI.encontrado,
                tempo_resposta_ms: tempoResposta,
                resposta_api: dadosAPI,
                erro_mensagem: dadosAPI.encontrado ? null : dadosAPI.mensagem
              });
              
              // Atualizar contador local
              setConsultasHoje(prev => prev + 1);
            }
          } catch (logError) {
            console.error('Erro ao registrar consulta no log:', logError);
            // Não bloqueia o fluxo se falhar o log
          }

          // 4. Atualizar produto com dados da API (simulado - será real depois)
          // await atualizarProdutoComDadosAPI(produtoId, dadosAPI);

          // 5. Decidir: cadastro automático ou revisão manual
          if (validarDadosCompletos(dadosAPI)) {
            // CADASTRO AUTOMÁTICO
            // await cadastrarProdutoAutomatico(dadosAPI);
            // await handleUpdateStatus(produtoId, 'aprovado');
            resultados.autoCadastrados.push(produto.descricao);
          } else if (dadosAPI.encontrado) {
            // DADOS INCOMPLETOS - revisão manual
            // await handleUpdateStatus(produtoId, 'consultado');
            resultados.precisamRevisao.push(produto.descricao);
          } else {
            // NÃO ENCONTRADO
            // await handleUpdateStatus(produtoId, 'consultado');
            resultados.naoEncontrados.push(produto.descricao);
          }
        } catch (error: any) {
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
    .filter(produto => produto.status === 'pendente' || produto.status === 'acao_manual') // Mostra produtos pendentes e ação manual
    .filter(produto => {
      const matchesSearch = 
        produto.ean_gtin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigem = filterOrigem === 'all' || produto.origem === filterOrigem;

      return matchesSearch && matchesOrigem;
    });

  // Estatísticas - Apenas produtos PENDENTES e ACAO_MANUAL
  const produtosPendentes = produtos.filter(p => p.status === 'pendente' || p.status === 'acao_manual');
  
  const stats = {
    total: produtosPendentes.length,
    pendentes: produtosPendentes.filter(p => p.status === 'pendente').length,
    acaoManual: produtosPendentes.filter(p => p.status === 'acao_manual').length,
    qrcode: produtosPendentes.filter(p => p.origem === 'qrcode').length,
    manual: produtosPendentes.filter(p => p.origem === 'manual').length,
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
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <QrCode className="h-3 w-3 mr-1" />
          QR Code
        </Badge>
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
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Badge variant={consultasHoje >= 100 ? "destructive" : "outline"}>
            {consultasHoje}/100 consultas hoje
          </Badge>
          {consultasHoje >= 100 && (
            <span className="text-red-600">Limite diário atingido</span>
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
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p>• Detectado via: <Badge variant="outline" className="ml-1">
                    {produtoParaCadastro.origem === 'qrcode' ? '🔲 QR Code' : '✏️ Manual'}
                  </Badge></p>
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

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <strong>Limite de consultas:</strong> {consultasHoje + produtosSelecionados.size}/100 consultas hoje
              </p>
            </div>
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
    </div>
  );
}

// ==================== FUNÇÕES MOCK DA API ====================
// TODO: Substituir por integração real quando API OnRender estiver pronta

/**
 * Mock da API OnRender para consulta de produtos
 * Simula resposta da API externa com delay artificial
 * 
 * @param eanGtin - Código EAN/GTIN do produto
 * @returns Promise com dados do produto ou erro
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
