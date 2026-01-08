import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2, Sparkles, Camera, QrCode, Scan, FileUp, X, Plus, Trash2, AlertCircle, Edit3, Check, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CameraCapture from '@/components/CameraCapture';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductList from '@/components/ProductList';
import { confrontarProduto } from '@/utils/confrontarProduto';

type UploadMode = 'select' | 'file' | 'camera' | 'barcode' | 'qrcode';
type EntryMode = 'automatic' | 'manual';

export default function UploadReceipt() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [valorTotal, setValorTotal] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [numeroNota, setNumeroNota] = useState('');
  const [itens, setItens] = useState<any[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>('select');
  const [entryMode, setEntryMode] = useState<EntryMode>('automatic');
  
  // Estados para cadastro manual de itens
  const [novoItemDescricao, setNovoItemDescricao] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState('');
  const [novoItemGtin, setNovoItemGtin] = useState('');
  const [novoItemQuantidade, setNovoItemQuantidade] = useState('');
  const [novoItemValorUnitario, setNovoItemValorUnitario] = useState('');
  const [buscandoGtin, setBuscandoGtin] = useState(false);
  const [valorTotalManual, setValorTotalManual] = useState(false);
  
  // Estados de edição
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Estados de validação
  const [errors, setErrors] = useState({
    valorTotal: '',
    cnpj: '',
    dataCompra: '',
    itens: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        toast({
          title: 'Autenticação Necessária',
          description: 'Você precisa estar logado para enviar notas fiscais.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  // Calcular valor total automaticamente baseado nos itens
  useEffect(() => {
    if (entryMode === 'manual' && itens.length > 0 && !valorTotalManual) {
      const totalCalculado = itens.reduce((acc, item) => {
        if (item.quantidade && item.valor_unitario) {
          return acc + (item.quantidade * item.valor_unitario);
        }
        return acc;
      }, 0);

      if (totalCalculado > 0) {
        const valorFormatado = totalCalculado.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setValorTotal(valorFormatado);
      }
    }
  }, [itens, entryMode, valorTotalManual]);

  const formatCurrency = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    if (isNaN(amount)) return '';
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorTotalChange = (value: string) => {
    const formatted = formatCurrency(value);
    setValorTotal(formatted);
    setValorTotalManual(true); // Marca que o usuário editou manualmente
  };

  const calcularTotalItens = (): number => {
    return itens.reduce((acc, item) => {
      if (item.quantidade && item.valor_unitario) {
        return acc + (item.quantidade * item.valor_unitario);
      }
      return acc;
    }, 0);
  };

  const getNumericValue = (formattedValue: string): number => {
    const numeric = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(numeric) || 0;
  };

  const formatNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    if (isNaN(amount)) return '';
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const buscarProdutoPorGtin = async (gtin: string) => {
    if (!gtin || gtin.length < 8) return;
    
    setBuscandoGtin(true);
    try {
      const result = await confrontarProduto(gtin);
      if (result.found && result.produto) {
        setNovoItemDescricao(result.produto.descricao);
        setNovoItemTipo(result.produto.tipo_embalagem);
        
        // Armazenar dados do produto temporariamente
        (window as any)._tempProductData = {
          produto_ciclik: result.produto,
          produto_cadastrado: true
        };
        
        const pesoInfo = result.produto.peso_medio_gramas 
          ? ` | Peso unitário: ${result.produto.peso_medio_gramas}g`
          : '';
        
        toast({
          title: 'Produto encontrado!',
          description: `${result.produto.descricao}${pesoInfo}`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
    } finally {
      setBuscandoGtin(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setUploadMode('file');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const extractAccessKey = (barcode: string): string | null => {
    const cleaned = barcode.replace(/[^0-9]/g, '');
    if (cleaned.length === 44) {
      return cleaned;
    }
    const urlMatch = barcode.match(/\d{44}/);
    if (urlMatch) {
      return urlMatch[0];
    }
    return null;
  };

  const parseAccessKey = (key: string) => {
    const uf = key.substring(0, 2);
    const aamm = key.substring(2, 6);
    const cnpj = key.substring(6, 20);
    const modelo = key.substring(20, 22);
    const serie = key.substring(22, 25);
    const numeroNF = key.substring(25, 34);
    
    const cnpjFormatted = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    const ano = parseInt(aamm.substring(0, 2)) + 2000;
    const mes = aamm.substring(2, 4);
    
    return {
      uf,
      ano,
      mes,
      cnpj: cnpjFormatted,
      modelo,
      serie,
      numeroNota: numeroNF.replace(/^0+/, ''),
      chaveAcesso: key
    };
  };

  const consultarSefazAutomatico = async (accessKey: string, uf: string) => {
    try {
      setProcessingOCR(true);
      
      console.log('[UploadReceipt] Consultando SEFAZ:', { accessKey, uf });
      
      const { data, error } = await supabase.functions.invoke('consultar-sefaz', {
        body: { chaveAcesso: accessKey, uf },
      });

      console.log('[UploadReceipt] Resposta SEFAZ:', { data, error });

      if (error) throw error;

      if (data.success && data.data) {
        const notaData = data.data;
        
        console.log('[UploadReceipt] Dados da nota SEFAZ:', {
          numero: notaData.numero,
          cnpj: notaData.cnpj,
          dataEmissao: notaData.dataEmissao,
          valorTotal: notaData.valorTotal,
          quantidadeItens: notaData.itens?.length
        });
        
        if (notaData.numero) setNumeroNota(notaData.numero);
        if (notaData.cnpj) setCnpj(notaData.cnpj);
        if (notaData.dataEmissao) {
          console.log('[UploadReceipt] Atualizando data para:', notaData.dataEmissao);
          setDataCompra(notaData.dataEmissao);
        }
        if (notaData.valorTotal && notaData.valorTotal > 0) {
          console.log('[UploadReceipt] Atualizando valor para:', notaData.valorTotal);
          setValorTotal(notaData.valorTotal.toString());
        }

        // Processar itens retornados da SEFAZ e enriquecer com dados de produtos
        if (notaData.itens && notaData.itens.length > 0) {
          const itensEnriquecidos = await Promise.all(
            notaData.itens.map(async (item: any) => {
              // Se tiver GTIN, buscar produto
              if (item.gtin) {
                const result = await confrontarProduto(item.gtin);
                if (result.found && result.produto) {
                  const quantidade = item.quantidade || 1;
                  const pesoUnitario = result.produto.peso_medio_gramas || null;
                  const pesoTotal = quantidade && pesoUnitario ? quantidade * pesoUnitario : null;
                  
                  return {
                    ...item,
                    nome: result.produto.descricao,
                    reciclavel: result.produto.reciclavel,
                    tipo_embalagem: result.produto.tipo_embalagem,
                    peso_unitario_gramas: pesoUnitario,
                    peso_total_estimado_gramas: pesoTotal,
                    produto_cadastrado: true,
                    produto_ciclik: result.produto
                  };
                }
              }
              // Se não tiver GTIN, usar dados básicos
              return { 
                ...item, 
                nome: item.descricao,
                produto_cadastrado: false,
                reciclavel: true,
                tipo_embalagem: 'misto'
              };
            })
          );
          setItens(itensEnriquecidos);
        }

        toast({
          title: 'Dados da SEFAZ obtidos!',
          description: 'Os dados da nota fiscal foram consultados na SEFAZ e preenchidos automaticamente.',
        });
      }
    } catch (error) {
      console.error('Erro ao consultar SEFAZ:', error);
      toast({
        title: 'Consulta SEFAZ indisponível',
        description: 'Não foi possível consultar a SEFAZ no momento. Os dados básicos foram extraídos da chave de acesso.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleScanResult = async (result: string) => {
    setScanning(true);
    console.log('[UploadReceipt] Resultado do scan:', result);
    
    // Verificar sessão ativa antes de processar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[UploadReceipt] Verificação de sessão:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      user: session?.user?.email,
      error: sessionError
    });
    
    if (!session || !session.access_token) {
      toast({
        title: 'Sessão Expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        variant: 'destructive',
      });
      setUploadMode('select');
      setScanning(false);
      navigate('/auth');
      return;
    }
    
    try {
      const { data: resultado, error } = await supabase.functions.invoke('processar-codigo-nota', {
        body: { 
          codigo: result,
          origem_leitura: uploadMode === 'barcode' ? 'barcode' : 'qrcode'
        }
      });

      if (error) {
        console.error('[UploadReceipt] Erro ao processar código:', error);
        toast({
          title: 'Erro ao Processar Código',
          description: 'Não foi possível processar o código. Tente novamente.',
          variant: 'destructive',
        });
        setUploadMode('select');
        setScanning(false);
        return;
      }

      console.log('[UploadReceipt] Resultado do processamento:', resultado);

      if (!resultado.valida) {
        toast({
          title: 'Código Inválido',
          description: resultado.motivo_invalidez,
          variant: 'destructive',
        });
        setUploadMode('select');
        setScanning(false);
        return;
      }

      console.log(`[UploadReceipt] Modelo: ${resultado.modelo}, Tipo entrada: ${resultado.tipo_entrada}, Origem: ${resultado.origem_leitura}`);
      
      if (resultado.modelo !== '65' && resultado.modelo !== '59') {
        toast({
          title: 'Modelo não suportado',
          description: `Este sistema só aceita notas fiscais modelo 65 (NFC-e) ou 59 (CF-e-SAT). Modelo detectado: ${resultado.modelo}`,
          variant: 'destructive',
        });
        setUploadMode('select');
        setScanning(false);
        return;
      }

      const chaveAcesso = resultado.chave_acesso!;
      const parsedData = parseAccessKey(chaveAcesso);
      
      if (!parsedData) {
        throw new Error('Não foi possível extrair dados da chave de acesso');
      }

      setCnpj(parsedData.cnpj);
      setNumeroNota(parsedData.numeroNota);
      
      const dataAproximada = `${parsedData.ano}-${parsedData.mes}-01`;
      setDataCompra(dataAproximada);

      toast({
        title: 'Chave de Acesso Lida!',
        description: `Nota Fiscal Modelo ${resultado.modelo} detectada. Consultando SEFAZ...`,
      });

      setUploadMode('select');
      await consultarSefazAutomatico(chaveAcesso, parsedData.uf);
      
    } catch (error) {
      console.error('[UploadReceipt] Erro ao processar chave de acesso:', error);
      toast({
        title: 'Erro ao processar chave',
        description: error instanceof Error ? error.message : 'Tente novamente ou insira os dados manualmente.',
        variant: 'destructive',
      });
      setUploadMode('select');
    } finally {
      setScanning(false);
    }
  };

  const handleOCR = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Selecione uma imagem primeiro',
        variant: 'destructive',
      });
      return;
    }

    setProcessingOCR(true);

    try {
      const { data, error } = await supabase.functions.invoke('ocr-nota-fiscal', {
        body: { imageBase64: preview },
      });

      if (error) throw error;

      if (data.success) {
        const extracted = data.data;
        if (extracted.valor_total) {
          const valorFormatado = extracted.valor_total.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setValorTotal(valorFormatado);
        }
        if (extracted.cnpj_estabelecimento) setCnpj(extracted.cnpj_estabelecimento);
        if (extracted.data_compra) setDataCompra(extracted.data_compra);
        if (extracted.numero_nota) setNumeroNota(extracted.numero_nota);
        
        if (extracted.itens && extracted.itens.length > 0) {
          const itensEnriquecidos = await Promise.all(
            extracted.itens.map(async (item: any) => {
              if (item.gtin) {
                const result = await confrontarProduto(item.gtin);
                if (result.found && result.produto) {
                  const quantidade = item.quantidade || 1;
                  const pesoUnitario = result.produto.peso_medio_gramas || null;
                  const pesoTotal = quantidade && pesoUnitario ? quantidade * pesoUnitario : null;
                  
                  return {
                    ...item,
                    nome: result.produto.descricao,
                    reciclavel: result.produto.reciclavel,
                    peso_unitario_gramas: pesoUnitario,
                    peso_total_estimado_gramas: pesoTotal,
                    produto_cadastrado: true,
                    produto_ciclik: result.produto
                  };
                }
              }
              return { ...item, produto_cadastrado: false };
            })
          );
          setItens(itensEnriquecidos);
        }

        toast({
          title: 'OCR Concluído!',
          description: 'Dados extraídos da nota fiscal com sucesso',
        });
      } else {
        throw new Error(data.error || 'Erro ao processar OCR');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'Erro no OCR',
        description: error instanceof Error ? error.message : 'Erro ao processar imagem',
        variant: 'destructive',
      });
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleAdicionarItem = () => {
    if (!novoItemDescricao.trim() || !novoItemTipo) {
      toast({
        title: 'Erro',
        description: 'Preencha a descrição e o tipo do material',
        variant: 'destructive',
      });
      return;
    }

    // Recuperar dados do produto temporários
    const tempProductData = (window as any)._tempProductData;
    const produtoCiclik = tempProductData?.produto_ciclik;
    
    // Calcular peso se houver produto cadastrado e quantidade
    // Quantidade é número inteiro de unidades, não formatada como moeda
    const quantidade = novoItemQuantidade ? parseInt(novoItemQuantidade, 10) || null : null;
    const pesoUnitario = produtoCiclik?.peso_medio_gramas || null;
    const pesoTotal = quantidade && pesoUnitario ? quantidade * pesoUnitario : null;

    const novoItem = {
      nome: novoItemDescricao,
      descricao: novoItemDescricao,
      tipo_embalagem: novoItemTipo,
      gtin: novoItemGtin || null,
      quantidade: quantidade,
      valor_unitario: novoItemValorUnitario ? getNumericValue(novoItemValorUnitario) : null,
      peso_unitario_gramas: pesoUnitario,
      peso_total_estimado_gramas: pesoTotal,
      reciclavel: true,
      produto_cadastrado: tempProductData?.produto_cadastrado || false,
      produto_ciclik: produtoCiclik,
      origem_manual: true
    };

    setItens([...itens, novoItem]);
    setNovoItemDescricao('');
    setNovoItemTipo('');
    setNovoItemGtin('');
    setNovoItemQuantidade('');
    setNovoItemValorUnitario('');
    
    // Limpar dados temporários
    delete (window as any)._tempProductData;

    const pesoMsg = pesoTotal ? ` | Peso estimado: ${pesoTotal.toLocaleString('pt-BR')}g` : '';
    toast({
      title: 'Item adicionado!',
      description: `Material adicionado à lista${pesoMsg}`,
    });
  };

  const handleRemoverItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleEditarItem = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...itens[index] });
  };

  const handleCancelarEdicao = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleSalvarEdicao = () => {
    if (!editingItem.descricao && !editingItem.nome) {
      toast({
        title: 'Erro',
        description: 'A descrição do material não pode estar vazia',
        variant: 'destructive',
      });
      return;
    }

    if (!editingItem.tipo_embalagem) {
      toast({
        title: 'Erro',
        description: 'Selecione o tipo de embalagem',
        variant: 'destructive',
      });
      return;
    }

    const novosItens = [...itens];
    novosItens[editingIndex!] = editingItem;
    setItens(novosItens);
    setEditingIndex(null);
    setEditingItem(null);

    toast({
      title: 'Material atualizado!',
      description: 'As alterações foram salvas',
    });
  };

  const validateManualEntry = (): boolean => {
    const newErrors = {
      valorTotal: '',
      cnpj: '',
      dataCompra: '',
      itens: ''
    };
    
    let hasError = false;

    // Validar valor total (obrigatório)
    if (!valorTotal || getNumericValue(valorTotal) === 0) {
      newErrors.valorTotal = 'Valor total é obrigatório';
      hasError = true;
    }

    // Validar data (obrigatório)
    if (!dataCompra) {
      newErrors.dataCompra = 'Data da compra é obrigatória';
      hasError = true;
    }

    // Validar se há pelo menos um item
    if (itens.length === 0) {
      newErrors.itens = 'Adicione pelo menos um material reciclável';
      hasError = true;
    }

    setErrors(newErrors);
    
    if (hasError) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios antes de enviar',
        variant: 'destructive',
      });
    }
    
    return !hasError;
  };

  const handleUpload = async () => {
    if (!user) return;
    
    // Validar entrada manual
    if (entryMode === 'manual') {
      if (!validateManualEntry()) {
        return;
      }
    } else {
      if (!file) {
        toast({
          title: 'Erro',
          description: 'Selecione uma imagem primeiro',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Limpar erros após validação bem-sucedida
    setErrors({
      valorTotal: '',
      cnpj: '',
      dataCompra: '',
      itens: ''
    });

    setUploading(true);
    try {
      const produtosNaoCadastrados = itens.filter(item => !item.produto_cadastrado).length;

      const { data: notaData, error } = await supabase
        .from('notas_fiscais')
        .insert({
          id_usuario: user.id,
          imagem_nf: preview || 'manual-entry',
          valor_total: valorTotal ? getNumericValue(valorTotal) : null,
          cnpj_estabelecimento: cnpj || null,
          data_compra: dataCompra || null,
          numero_nota: numeroNota || null,
          itens: itens.length > 0 ? itens : null,
          itens_enriquecidos: itens.length > 0 ? itens : null,
          produtos_nao_cadastrados: produtosNaoCadastrados,
          status_validacao: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      const materiaisReciclaveis = itens
        .filter((item: any) => item.reciclavel !== false)
        .map((item: any) => {
          const quantidade = item.quantidade || 1;
          const pesoUnitario = item.peso_unitario_gramas || item.produto_ciclik?.peso_medio_gramas || null;
          // Calcular peso total: quantidade × peso unitário (se houver peso unitário)
          const pesoTotal = item.peso_total_estimado_gramas || 
                           (quantidade && pesoUnitario ? quantidade * pesoUnitario : null);
          
          return {
            id_usuario: user.id,
            id_nota_fiscal: notaData.id,
            gtin: item.gtin || null,
            descricao: item.nome || item.descricao,
            tipo_embalagem: item.tipo_embalagem || (item.produto_ciclik?.tipo_embalagem),
            reciclavel: item.reciclavel ?? item.produto_ciclik?.reciclavel ?? true,
            percentual_reciclabilidade: item.percentual_reciclabilidade || item.produto_ciclik?.percentual_reciclabilidade || 0,
            quantidade: quantidade,
            peso_unitario_gramas: pesoUnitario,
            peso_total_estimado_gramas: pesoTotal,
            origem_cadastro: entryMode === 'manual' ? 'manual' : 'nota_fiscal'
          };
        });

      if (materiaisReciclaveis.length > 0) {
        const { error: materiaisError } = await supabase
          .from('materiais_reciclaveis_usuario')
          .insert(materiaisReciclaveis);

        if (materiaisError) {
          console.error('Erro ao criar materiais recicláveis:', materiaisError);
        }
      }

      // Inserir embalagens cadastradas no estoque CDV
      const embalagensParaEstoque = itens
        .filter((item: any) => item.produto_cadastrado && item.gtin)
        .map((item: any) => ({
          gtin: item.gtin,
          nome_produto: item.nome || item.descricao,
          id_produto: item.produto_ciclik?.id || null,
          tipo_embalagem: item.tipo_embalagem || item.produto_ciclik?.tipo_embalagem || null,
          reciclabilidade: item.percentual_reciclabilidade || item.produto_ciclik?.percentual_reciclabilidade || 0,
          data: new Date().toISOString(),
          status: 'disponivel'
        }));

      if (embalagensParaEstoque.length > 0) {
        const { error: embalagensError } = await supabase
          .from('estoque_embalagens')
          .insert(embalagensParaEstoque);

        if (embalagensError) {
          console.error('Erro ao inserir embalagens no estoque CDV:', embalagensError);
        }
      }

      toast({
        title: 'Nota fiscal enviada!',
        description: `Sua nota fiscal está em análise. ${materiaisReciclaveis.length} materiais recicláveis cadastrados!`,
      });

      navigate('/user');
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Enviar Nota Fiscal</h1>
            <p className="text-muted-foreground">Registre suas compras sustentáveis</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Nota Fiscal</CardTitle>
            <CardDescription>
              Escolha entre entrada automática (com foto e OCR) ou manual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as EntryMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="automatic">Automático (OCR)</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="automatic" className="space-y-6 mt-6">
                {uploadMode === 'select' && !file && (
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-2"
                      onClick={() => setUploadMode('file')}
                    >
                      <FileUp className="h-8 w-8" />
                      <span className="text-sm">Importar Arquivo</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-2"
                      onClick={() => setUploadMode('camera')}
                    >
                      <Camera className="h-8 w-8" />
                      <span className="text-sm">Tirar Foto</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-2"
                      onClick={() => setUploadMode('barcode')}
                    >
                      <Scan className="h-8 w-8" />
                      <span className="text-sm">Código de Barras</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-32 flex flex-col gap-2"
                      onClick={() => setUploadMode('qrcode')}
                    >
                      <QrCode className="h-8 w-8" />
                      <span className="text-sm">QR Code</span>
                    </Button>
                  </div>
                )}

                {uploadMode === 'file' && !file && (
                  <div className="space-y-4">
                    <Label htmlFor="receipt">Selecione a imagem</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="receipt" className="cursor-pointer">
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar uma imagem
                          </p>
                        </div>
                      </label>
                    </div>
                    <Button variant="outline" onClick={() => setUploadMode('select')} className="w-full">
                      Voltar
                    </Button>
                  </div>
                )}

                {uploadMode === 'camera' && !file && (
                  <CameraCapture
                    onCapture={handleFileSelect}
                    onCancel={() => setUploadMode('select')}
                  />
                )}

                {uploadMode === 'barcode' && (
                  <div className="space-y-4">
                    <BarcodeScanner
                      mode="barcode"
                      onScan={handleScanResult}
                      onCancel={() => setUploadMode('select')}
                    />
                    {scanning && (
                      <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm">Processando código...</span>
                      </div>
                    )}
                  </div>
                )}

                {uploadMode === 'qrcode' && (
                  <div className="space-y-4">
                    <BarcodeScanner
                      mode="qrcode"
                      onScan={handleScanResult}
                      onCancel={() => setUploadMode('select')}
                    />
                    {scanning && (
                      <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm">Processando QR Code...</span>
                      </div>
                    )}
                  </div>
                )}

                {file && preview && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setFile(null);
                          setPreview('');
                          setUploadMode('select');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleOCR}
                      disabled={processingOCR}
                      className="w-full"
                    >
                      {processingOCR ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Extrair Dados com OCR
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {itens.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Produtos Identificados</Label>
                    <ProductList 
                      items={itens} 
                      onChange={setItens}
                      numeroNota={numeroNota}
                      onNumeroNotaChange={setNumeroNota}
                      cnpj={cnpj}
                      onCnpjChange={setCnpj}
                      dataCompra={dataCompra}
                      onDataCompraChange={setDataCompra}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Total (R$)</Label>
                    <Input
                      id="valor"
                      placeholder="0,00"
                      value={valorTotal}
                      onChange={(e) => handleValorTotalChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ do Estabelecimento</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data">Data da Compra</Label>
                    <Input
                      id="data"
                      type="date"
                      value={dataCompra}
                      onChange={(e) => setDataCompra(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número da Nota</Label>
                    <Input
                      id="numero"
                      placeholder="123456"
                      value={numeroNota}
                      onChange={(e) => setNumeroNota(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor-manual" className="flex items-center gap-1">
                      Valor Total (R$)
                      <span className="text-destructive">*</span>
                      {!valorTotalManual && calcularTotalItens() > 0 && (
                        <span className="text-xs text-muted-foreground font-normal ml-2 flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          (calculado automaticamente)
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="valor-manual"
                        placeholder="0,00"
                        value={valorTotal}
                        onChange={(e) => {
                          handleValorTotalChange(e.target.value);
                          if (errors.valorTotal) {
                            setErrors({ ...errors, valorTotal: '' });
                          }
                        }}
                        className={errors.valorTotal ? 'border-destructive' : ''}
                      />
                      {valorTotalManual && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 text-xs"
                          onClick={() => {
                            setValorTotalManual(false);
                            setValorTotal('');
                          }}
                        >
                          Recalcular
                        </Button>
                      )}
                    </div>
                    {errors.valorTotal && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.valorTotal}
                      </p>
                    )}
                    {!valorTotalManual && calcularTotalItens() > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Soma dos itens: R$ {calcularTotalItens().toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj-manual">
                      CNPJ do Estabelecimento
                      <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                    </Label>
                    <Input
                      id="cnpj-manual"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-manual" className="flex items-center gap-1">
                      Data da Compra
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="data-manual"
                      type="date"
                      value={dataCompra}
                      onChange={(e) => {
                        setDataCompra(e.target.value);
                        if (errors.dataCompra) {
                          setErrors({ ...errors, dataCompra: '' });
                        }
                      }}
                      className={errors.dataCompra ? 'border-destructive' : ''}
                    />
                    {errors.dataCompra && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.dataCompra}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero-manual">
                      Número da Nota
                      <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                    </Label>
                    <Input
                      id="numero-manual"
                      placeholder="123456"
                      value={numeroNota}
                      onChange={(e) => setNumeroNota(e.target.value)}
                    />
                  </div>
                </div>

                <div className={`border rounded-lg p-4 space-y-4 bg-muted/50 ${errors.itens ? 'border-destructive' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Materiais Recicláveis
                      <span className="text-destructive">*</span>
                    </h3>
                    {errors.itens && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.itens}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="item-gtin">
                          GTIN / Código de Barras
                          <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="item-gtin"
                            placeholder="7891234567890"
                            value={novoItemGtin}
                            onChange={(e) => setNovoItemGtin(e.target.value)}
                            onBlur={() => buscarProdutoPorGtin(novoItemGtin)}
                            disabled={buscandoGtin}
                          />
                          {buscandoGtin && (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {buscandoGtin && (
                          <p className="text-xs text-muted-foreground">Buscando produto...</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="item-descricao">Descrição do Material</Label>
                        <Input
                          id="item-descricao"
                          placeholder="Ex: Garrafa PET 2L"
                          value={novoItemDescricao}
                          onChange={(e) => setNovoItemDescricao(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-tipo">Tipo de Embalagem</Label>
                        <Select value={novoItemTipo} onValueChange={setNovoItemTipo}>
                          <SelectTrigger id="item-tipo">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plastico">Plástico</SelectItem>
                            <SelectItem value="papel">Papel</SelectItem>
                            <SelectItem value="papelao">Papelão</SelectItem>
                            <SelectItem value="vidro">Vidro</SelectItem>
                            <SelectItem value="aluminio">Alumínio</SelectItem>
                            <SelectItem value="laminado">Laminado</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-quantidade">
                          Quantidade
                          <span className="text-muted-foreground text-xs ml-1">(unidades, opcional)</span>
                        </Label>
                        <Input
                          id="item-quantidade"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={novoItemQuantidade}
                          onChange={(e) => setNovoItemQuantidade(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="item-valor">
                          Valor Unitário (R$)
                          <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                        </Label>
                        <Input
                          id="item-valor"
                          placeholder="0,00"
                          value={novoItemValorUnitario}
                          onChange={(e) => setNovoItemValorUnitario(formatNumber(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={() => {
                      handleAdicionarItem();
                      if (errors.itens) {
                        setErrors({ ...errors, itens: '' });
                      }
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar à Lista
                  </Button>
                </div>
                
                {itens.length === 0 && errors.itens && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      É necessário adicionar pelo menos um material para registrar a nota fiscal
                    </p>
                  </div>
                )}

                {itens.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Materiais Adicionados ({itens.length})</Label>
                      <div className="flex flex-col items-end gap-1">
                        {calcularTotalItens() > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Total: R$ {calcularTotalItens().toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                        {(() => {
                          const pesoTotal = itens.reduce((acc, item) => 
                            acc + (item.peso_total_estimado_gramas || 0), 0
                          );
                          return pesoTotal > 0 ? (
                            <span className="text-sm font-medium text-primary">
                              Peso estimado: {pesoTotal.toLocaleString('pt-BR')}g ({(pesoTotal / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}kg)
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {itens.map((item, index) => (
                        <div 
                          key={index} 
                          className="border rounded-lg bg-card"
                        >
                          {editingIndex === index ? (
                            // Modo de Edição
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Edit3 className="h-4 w-4" />
                                  Editando Material
                                </h4>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-gtin-${index}`} className="text-xs">
                                    GTIN (Código de Barras)
                                    <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                                  </Label>
                                  <Input
                                    id={`edit-gtin-${index}`}
                                    placeholder="7891234567890"
                                    value={editingItem.gtin || ''}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem,
                                      gtin: e.target.value
                                    })}
                                    onBlur={async () => {
                                      if (editingItem.gtin && editingItem.gtin.length >= 8) {
                                        setBuscandoGtin(true);
                                        try {
                                          const result = await confrontarProduto(editingItem.gtin);
                                          if (result.found && result.produto) {
                                            setEditingItem({
                                              ...editingItem,
                                              descricao: result.produto.descricao,
                                              nome: result.produto.descricao,
                                              tipo_embalagem: result.produto.tipo_embalagem
                                            });
                                            toast({
                                              title: 'Produto encontrado!',
                                              description: 'Os campos foram atualizados automaticamente.',
                                            });
                                          }
                                        } finally {
                                          setBuscandoGtin(false);
                                        }
                                      }
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`edit-desc-${index}`} className="text-xs">
                                    Descrição do Material
                                  </Label>
                                  <Input
                                    id={`edit-desc-${index}`}
                                    placeholder="Ex: Garrafa PET 2L"
                                    value={editingItem.descricao || editingItem.nome || ''}
                                    onChange={(e) => setEditingItem({
                                      ...editingItem,
                                      descricao: e.target.value,
                                      nome: e.target.value
                                    })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`edit-tipo-${index}`} className="text-xs">
                                    Tipo de Embalagem
                                  </Label>
                                  <Select 
                                    value={editingItem.tipo_embalagem || ''} 
                                    onValueChange={(value) => setEditingItem({
                                      ...editingItem,
                                      tipo_embalagem: value
                                    })}
                                  >
                                    <SelectTrigger id={`edit-tipo-${index}`}>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="plastico">Plástico</SelectItem>
                                      <SelectItem value="papel">Papel</SelectItem>
                                      <SelectItem value="papelao">Papelão</SelectItem>
                                      <SelectItem value="vidro">Vidro</SelectItem>
                                      <SelectItem value="aluminio">Alumínio</SelectItem>
                                      <SelectItem value="laminado">Laminado</SelectItem>
                                      <SelectItem value="misto">Misto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-qtd-${index}`} className="text-xs">
                                      Quantidade
                                    </Label>
                                    <Input
                                      id={`edit-qtd-${index}`}
                                      type="number"
                                      min="0"
                                      step="1"
                                      placeholder="0"
                                      value={editingItem.quantidade || ''}
                                      onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        quantidade: parseInt(e.target.value, 10) || 0
                                      })}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-valor-${index}`} className="text-xs">
                                      Valor Unitário (R$)
                                    </Label>
                                    <Input
                                      id={`edit-valor-${index}`}
                                      placeholder="0,00"
                                      value={editingItem.valor_unitario ? formatNumber(editingItem.valor_unitario.toString()) : ''}
                                      onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        valor_unitario: getNumericValue(formatNumber(e.target.value))
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="button"
                                  onClick={handleSalvarEdicao}
                                  className="flex-1"
                                  size="sm"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Salvar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCancelarEdicao}
                                  className="flex-1"
                                  size="sm"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Modo de Visualização
                            <div className="flex items-center justify-between p-3">
                              <div className="flex-1">
                                <p className="font-medium">{item.nome || item.descricao}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {item.tipo_embalagem?.replace('_', ' ')}
                                  </p>
                                  {item.gtin && (
                                    <span className="text-xs text-muted-foreground">
                                      • GTIN: {item.gtin}
                                    </span>
                                  )}
                                  {item.quantidade && (
                                    <span className="text-xs text-muted-foreground">
                                      • Qtd: {item.quantidade.toLocaleString('pt-BR')}
                                    </span>
                                  )}
                                  {item.valor_unitario && (
                                    <span className="text-xs text-muted-foreground">
                                      • R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  {item.peso_total_estimado_gramas && (
                                    <span className="text-xs font-medium text-primary">
                                      • Peso: {item.peso_total_estimado_gramas.toLocaleString('pt-BR')}g
                                    </span>
                                  )}
                                  {item.produto_cadastrado && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                      Cadastrado
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditarItem(index)}
                                  disabled={editingIndex !== null}
                                >
                                  <Edit3 className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoverItem(index)}
                                  disabled={editingIndex !== null}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="space-y-3">
              {entryMode === 'manual' && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p className="font-medium mb-1">Campos obrigatórios:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Valor Total</li>
                    <li>Data da Compra</li>
                    <li>Pelo menos um Material Reciclável</li>
                  </ul>
                </div>
              )}
              
              <Button
                onClick={handleUpload}
                disabled={uploading || (entryMode === 'automatic' && !file)}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Nota Fiscal
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
