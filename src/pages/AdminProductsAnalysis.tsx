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
import { AlertCircle, ArrowLeft, Search, Package, QrCode, Edit, Check, X, ExternalLink, Loader2, TrendingUp, Clock, AlertTriangle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
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
    descricao: '',
    categoria: '',
    peso_gramas: '',
    reciclavel: true,
    percentual_reciclabilidade: 100,
    pontos: '',
    imagem_url: ''
  });
  const [processing, setProcessing] = useState(false);
  
  // Estados para upload CSV
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProdutos();
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
      descricao: produto.descricao,
      categoria: '',
      peso_gramas: '',
      reciclavel: true,
      percentual_reciclabilidade: 100,
      pontos: '',
      imagem_url: ''
    });
    setCadastroDialogOpen(true);
  };

  const handleSalvarProduto = async () => {
    if (!produtoParaCadastro) return;

    setProcessing(true);
    try {
      // Validações básicas
      if (!formData.gtin || !formData.descricao || !formData.categoria) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha EAN, Descrição e Categoria.',
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
          descricao: formData.descricao,
          categoria: formData.categoria,
          peso_gramas: formData.peso_gramas ? parseFloat(formData.peso_gramas) : null,
          reciclavel: formData.reciclavel,
          percentual_reciclabilidade: formData.percentual_reciclabilidade,
          pontos: formData.pontos ? parseInt(formData.pontos) : 0,
          imagem_url: formData.imagem_url || null,
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
        descricao: '',
        categoria: '',
        peso_gramas: '',
        reciclavel: true,
        percentual_reciclabilidade: 100,
        pontos: '',
        imagem_url: ''
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

      // Inserir produtos na tabela produtos_em_analise
      const { data, error } = await supabase
        .from('produtos_em_analise')
        .insert(produtos)
        .select();

      if (error) throw error;

      toast({
        title: 'Upload concluído!',
        description: `${produtos.length} produto(s) adicionado(s) para análise!${erros.length > 0 ? ` (${erros.length} linha(s) com erro)` : ''}`,
      });

      if (erros.length > 0) {
        console.warn('Erros no CSV:', erros);
        toast({
          title: 'Atenção',
          description: `${erros.length} linha(s) não foram processadas. Verifique o console para detalhes.`,
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

  const openDialog = (produto: ProdutoEmAnalise, action: 'aprovar' | 'rejeitar' | 'observacao') => {
    setSelectedProduct(produto);
    setActionType(action);
    setObservacoes(produto.observacoes || '');
    setDialogOpen(true);
  };

  // Função para calcular a prioridade baseada no tempo (72 horas para produtos QR Code)
  const getPrioridade = (produto: ProdutoEmAnalise) => {
    // Apenas produtos via QR Code tem prazo de 72 horas
    if (produto.origem !== 'qrcode' || produto.status !== 'pendente') {
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
    .filter(produto => produto.status === 'pendente') // Mostra APENAS produtos pendentes
    .filter(produto => {
      const matchesSearch = 
        produto.ean_gtin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigem = filterOrigem === 'all' || produto.origem === filterOrigem;

      return matchesSearch && matchesOrigem;
    });

  // Estatísticas - Apenas produtos PENDENTES
  const produtosPendentes = produtos.filter(p => p.status === 'pendente');
  
  const stats = {
    total: produtosPendentes.length,
    pendentes: produtosPendentes.length,
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
              variant="default"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload em Massa
            </Button>
          </div>
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
                    <TableHead className="w-[130px]">EAN/GTIN</TableHead>
                    <TableHead className="min-w-[250px]">Descrição</TableHead>
                    <TableHead className="w-[130px]">Origem</TableHead>
                    <TableHead className="w-[200px]">Urgência</TableHead>
                    <TableHead className="w-[110px]">Ocorrências</TableHead>
                    <TableHead className="w-[150px]">Última Detecção</TableHead>
                    <TableHead className="text-right w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map((produto) => (
                    <TableRow key={produto.id} className={getRowClassName(produto)}>
                      <TableCell className="font-mono font-medium text-sm">
                        {produto.ean_gtin}
                      </TableCell>
                      <TableCell className="font-medium">
                        {produto.descricao}
                      </TableCell>
                      <TableCell>{getOrigemBadge(produto.origem)}</TableCell>
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
                  ))}
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

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plastico">Plástico</SelectItem>
                  <SelectItem value="papel">Papel/Papelão</SelectItem>
                  <SelectItem value="vidro">Vidro</SelectItem>
                  <SelectItem value="metal">Metal/Alumínio</SelectItem>
                  <SelectItem value="eletronico">Eletrônico</SelectItem>
                  <SelectItem value="organico">Orgânico</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Peso em Gramas */}
            <div className="space-y-2">
              <Label htmlFor="peso_gramas">Peso (gramas)</Label>
              <Input
                id="peso_gramas"
                type="number"
                value={formData.peso_gramas}
                onChange={(e) => setFormData({ ...formData, peso_gramas: e.target.value })}
                placeholder="Ex: 50"
                min="0"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">Peso aproximado da embalagem em gramas</p>
            </div>

            {/* Reciclável */}
            <div className="space-y-2">
              <Label htmlFor="reciclavel">Material Reciclável?</Label>
              <Select 
                value={formData.reciclavel ? 'sim' : 'nao'} 
                onValueChange={(value) => setFormData({ ...formData, reciclavel: value === 'sim' })}
              >
                <SelectTrigger id="reciclavel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">✅ Sim - Reciclável</SelectItem>
                  <SelectItem value="nao">❌ Não - Não reciclável</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Pontos */}
            <div className="space-y-2">
              <Label htmlFor="pontos">Pontos de Recompensa</Label>
              <Input
                id="pontos"
                type="number"
                value={formData.pontos}
                onChange={(e) => setFormData({ ...formData, pontos: e.target.value })}
                placeholder="Ex: 10"
                min="0"
              />
              <p className="text-xs text-muted-foreground">Pontos que o usuário ganha ao reciclar este item</p>
            </div>

            {/* URL da Imagem */}
            <div className="space-y-2">
              <Label htmlFor="imagem_url">URL da Imagem (opcional)</Label>
              <Input
                id="imagem_url"
                type="url"
                value={formData.imagem_url}
                onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <p className="text-xs text-muted-foreground">Link para imagem ilustrativa do produto</p>
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
              disabled={processing || !formData.gtin || !formData.descricao || !formData.categoria}
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
    </div>
  );
}
