import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Package, Recycle, Upload, Loader2, AlertTriangle, Menu, X, Filter, Scale, Download, ArrowLeft } from "lucide-react";
import { ProdutoCiclik, TipoEmbalagem, TIPOS_EMBALAGEM_LABELS } from "@/types/produtos";
import PageTransition from "@/components/PageTransition";
import CiclikHeader from "@/components/CiclikHeader";
import ImportCSVDialog from "@/components/ImportCSVDialog";

interface EmbalagemItem {
  id?: string;
  tipo_embalagem: TipoEmbalagem;
  reciclavel: boolean;
  percentual_reciclabilidade: number;
  peso_medio_gramas: number | null;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProdutoCiclik[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProdutoCiclik[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isPesoDialogOpen, setIsPesoDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProdutoCiclik | null>(null);
  const [editingPeso, setEditingPeso] = useState<{ id: string; descricao: string; peso: number | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingGtin, setSearchingGtin] = useState(false);
  const { toast } = useToast();

  // Filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filterTipoEmbalagem, setFilterTipoEmbalagem] = useState<string>("all");
  const [filterReciclavel, setFilterReciclavel] = useState<string>("all");
  const [filterPercentualMin, setFilterPercentualMin] = useState<number>(0);
  const [filterPercentualMax, setFilterPercentualMax] = useState<number>(100);

  const [formData, setFormData] = useState({
    gtin: "",
    ncm: "",
    descricao: "",
    tipo_embalagem: "plastico" as TipoEmbalagem,
    reciclavel: true,
    percentual_reciclabilidade: 100,
    peso_medio_gramas: null as number | null,
    observacoes: "",
    embalagens: [] as EmbalagemItem[]
  });

  // Funções auxiliares para conversão de peso
  const gramasParaKg = (gramas: number | null): number | null => {
    return gramas ? parseFloat((gramas / 1000).toFixed(3)) : null;
  };

  const kgParaGramas = (kg: number | null): number | null => {
    return kg ? parseFloat((kg * 1000).toFixed(2)) : null;
  };

  const [currentEmbalagem, setCurrentEmbalagem] = useState<EmbalagemItem>({
    tipo_embalagem: "plastico" as TipoEmbalagem,
    reciclavel: true,
    percentual_reciclabilidade: 100,
    peso_medio_gramas: null
  });

  const [stats, setStats] = useState({
    total: 0,
    reciclaveis: 0,
    vidro: 0,
    plastico: 0,
    papel: 0,
    papelao: 0,
    aluminio: 0,
    laminado: 0,
    misto: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products.filter(p => 
      p.gtin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ncm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtro de tipo de embalagem
    if (filterTipoEmbalagem !== "all") {
      filtered = filtered.filter(p => p.tipo_embalagem === filterTipoEmbalagem);
    }

    // Aplicar filtro de reciclável
    if (filterReciclavel !== "all") {
      filtered = filtered.filter(p => 
        filterReciclavel === "yes" ? p.reciclavel : !p.reciclavel
      );
    }

    // Aplicar filtro de percentual de reciclabilidade
    filtered = filtered.filter(p => 
      p.percentual_reciclabilidade >= filterPercentualMin && 
      p.percentual_reciclabilidade <= filterPercentualMax
    );

    setFilteredProducts(filtered);
  }, [searchTerm, products, filterTipoEmbalagem, filterReciclavel, filterPercentualMin, filterPercentualMax]);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const calculateStats = () => {
    const newStats = {
      total: products.length,
      reciclaveis: products.filter(p => p.reciclavel).length,
      vidro: products.filter(p => p.tipo_embalagem === 'vidro').length,
      plastico: products.filter(p => p.tipo_embalagem === 'plastico').length,
      papel: products.filter(p => p.tipo_embalagem === 'papel').length,
      papelao: products.filter(p => p.tipo_embalagem === 'papelao').length,
      aluminio: products.filter(p => p.tipo_embalagem === 'aluminio').length,
      laminado: products.filter(p => p.tipo_embalagem === 'laminado').length,
      misto: products.filter(p => p.tipo_embalagem === 'misto').length
    };
    setStats(newStats);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos_ciclik')
        .select('*')
        .order('descricao');

      if (error) throw error;
      setProducts(data as ProdutoCiclik[]);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      gtin: "",
      ncm: "",
      descricao: "",
      tipo_embalagem: "plastico",
      reciclavel: true,
      percentual_reciclabilidade: 100,
      peso_medio_gramas: null,
      observacoes: "",
      embalagens: []
    });
    setCurrentEmbalagem({
      tipo_embalagem: "plastico",
      reciclavel: true,
      percentual_reciclabilidade: 100,
      peso_medio_gramas: null
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = async (product?: ProdutoCiclik) => {
    if (product) {
      setEditingProduct(product);
      
      // Buscar embalagens do produto
      const { data: embalagens } = await supabase
        .from('produto_embalagens')
        .select('id, tipo_embalagem, reciclavel, percentual_reciclabilidade, peso_medio_gramas')
        .eq('produto_id', product.id);
      
      setFormData({
        gtin: product.gtin,
        ncm: product.ncm,
        descricao: product.descricao,
        tipo_embalagem: product.tipo_embalagem,
        reciclavel: product.reciclavel,
        percentual_reciclabilidade: product.percentual_reciclabilidade,
        peso_medio_gramas: gramasParaKg(product.peso_medio_gramas),
        observacoes: product.observacoes || "",
        embalagens: (embalagens || []).map(emb => ({
          ...emb,
          peso_medio_gramas: gramasParaKg(emb.peso_medio_gramas)
        }))
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleOpenPesoDialog = (product: ProdutoCiclik) => {
    setEditingPeso({
      id: product.id,
      descricao: product.descricao,
      peso: gramasParaKg(product.peso_medio_gramas)
    });
    setIsPesoDialogOpen(true);
  };

  const handleSavePeso = async () => {
    if (!editingPeso) return;

    setLoading(true);
    try {
      const pesoEmGramas = kgParaGramas(editingPeso.peso);
      
      const { error } = await supabase
        .from('produtos_ciclik')
        .update({ peso_medio_gramas: pesoEmGramas })
        .eq('id', editingPeso.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peso médio atualizado com sucesso"
      });

      setIsPesoDialogOpen(false);
      setEditingPeso(null);
      await loadProducts();
    } catch (error: any) {
      console.error('Erro ao atualizar peso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o peso médio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmbalagem = () => {
    setFormData({
      ...formData,
      embalagens: [...formData.embalagens, { ...currentEmbalagem }]
    });
    setCurrentEmbalagem({
      tipo_embalagem: "plastico",
      reciclavel: true,
      percentual_reciclabilidade: 100,
      peso_medio_gramas: null
    });
  };

  const removeEmbalagem = (index: number) => {
    setFormData({
      ...formData,
      embalagens: formData.embalagens.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!formData.gtin || !formData.ncm || !formData.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha GTIN, NCM e Descrição",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let produtoId = editingProduct?.id;

      // Converter peso de kg para gramas antes de salvar
      const pesoEmGramas = kgParaGramas(formData.peso_medio_gramas);

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos_ciclik')
          .update({
            gtin: formData.gtin,
            ncm: formData.ncm,
            descricao: formData.descricao,
            tipo_embalagem: formData.tipo_embalagem,
            reciclavel: formData.reciclavel,
            percentual_reciclabilidade: formData.percentual_reciclabilidade,
            peso_medio_gramas: pesoEmGramas,
            observacoes: formData.observacoes
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso"
        });
      } else {
        const { data, error } = await supabase
          .from('produtos_ciclik')
          .insert([{
            gtin: formData.gtin,
            ncm: formData.ncm,
            descricao: formData.descricao,
            tipo_embalagem: formData.tipo_embalagem,
            reciclavel: formData.reciclavel,
            percentual_reciclabilidade: formData.percentual_reciclabilidade,
            peso_medio_gramas: pesoEmGramas,
            observacoes: formData.observacoes
          }])
          .select()
          .single();

        if (error) throw error;
        produtoId = data.id;

        toast({
          title: "Sucesso",
          description: "Produto cadastrado com sucesso"
        });
      }

      // Salvar embalagens
      if (formData.embalagens.length > 0 && produtoId) {
        // Separar embalagens existentes (com id) das novas (sem id)
        const embalagensExistentes = formData.embalagens.filter(emb => 'id' in emb && emb.id);
        const embalagensNovas = formData.embalagens.filter(emb => !('id' in emb) || !emb.id);

        // Atualizar embalagens existentes
        for (const emb of embalagensExistentes) {
          const { error: updateError } = await supabase
            .from('produto_embalagens')
            .update({
              tipo_embalagem: emb.tipo_embalagem,
              reciclavel: emb.reciclavel,
              percentual_reciclabilidade: emb.percentual_reciclabilidade,
              peso_medio_gramas: kgParaGramas(emb.peso_medio_gramas)
            })
            .eq('id', emb.id);

          if (updateError) throw updateError;
        }

        // Inserir embalagens novas
        if (embalagensNovas.length > 0) {
          const embalagensData = embalagensNovas.map(emb => ({
            produto_id: produtoId,
            tipo_embalagem: emb.tipo_embalagem,
            reciclavel: emb.reciclavel,
            percentual_reciclabilidade: emb.percentual_reciclabilidade,
            peso_medio_gramas: kgParaGramas(emb.peso_medio_gramas)
          }));

          const { error: insertError } = await supabase
            .from('produto_embalagens')
            .insert(embalagensData);

          if (insertError) throw insertError;
        }
      }

      await loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('produtos_ciclik')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso"
      });
      loadProducts();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast({
        title: "Nenhum produto",
        description: "Não há produtos para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      "GTIN",
      "NCM",
      "Descrição",
      "Tipo Embalagem",
      "Reciclável",
      "% Reciclabilidade",
      "Peso Médio (kg)",
      "Observações",
      "Data Cadastro"
    ];

    const rows = products.map(p => [
      p.gtin,
      p.ncm,
      `"${(p.descricao || '').replace(/"/g, '""')}"`,
      TIPOS_EMBALAGEM_LABELS[p.tipo_embalagem] || p.tipo_embalagem,
      p.reciclavel ? "Sim" : "Não",
      p.percentual_reciclabilidade,
      p.peso_medio_gramas ? (p.peso_medio_gramas / 1000).toFixed(3).replace('.', ',') : "",
      `"${(p.observacoes || '').replace(/"/g, '""')}"`,
      p.data_cadastro ? new Date(p.data_cadastro).toLocaleDateString('pt-BR') : ""
    ]);

    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `produtos_ciclik_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${products.length} produtos exportados com sucesso`
    });
  };

  const handleSearchGtin = async () => {
    if (!formData.gtin || formData.gtin.length < 8) {
      toast({
        title: "GTIN inválido",
        description: "Digite um GTIN válido (mínimo 8 dígitos)",
        variant: "destructive"
      });
      return;
    }

    setSearchingGtin(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-produto-gtin', {
        body: { gtin: formData.gtin }
      });

      // Se houve erro HTTP (não 200), trata como erro
      if (error) {
        console.error('Erro HTTP ao buscar produto:', error);
        toast({
          title: "Erro na busca",
          description: "Não foi possível conectar ao serviço de busca",
          variant: "destructive"
        });
        return;
      }

      // Verifica o resultado da busca
      if (data?.success && data?.data) {
        const product = data.data;
        const suggestions = data.suggested_packaging || [];
        
        // Preencher campos automaticamente
        setFormData(prev => ({
          ...prev,
          descricao: product.descricao || prev.descricao,
          ncm: product.ncm || prev.ncm,
          observacoes: `${prev.observacoes ? prev.observacoes + '\n' : ''}Marca: ${product.marca || 'N/A'}\nCategoria: ${product.categoria || 'N/A'}\nFonte: ${data.source}`,
          embalagens: suggestions.length > 0 ? suggestions : prev.embalagens
        }));

        // Mensagem detalhada sobre o que foi preenchido
        const camposPreenchidos = [];
        if (product.descricao) camposPreenchidos.push('descrição');
        if (product.ncm) camposPreenchidos.push('NCM');
        if (suggestions.length > 0) camposPreenchidos.push(`${suggestions.length} tipo(s) de embalagem`);

        toast({
          title: "Produto encontrado!",
          description: `Dados de ${data.source}. ${camposPreenchidos.length > 0 ? `Preenchido: ${camposPreenchidos.join(', ')}.` : ''} Revise as informações.`,
        });
      } else {
        // Produto não encontrado (mas não é erro de conexão)
        toast({
          title: "Produto não encontrado",
          description: data?.message || data?.error || "Preencha os dados manualmente",
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar produto:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar o produto",
        variant: "destructive"
      });
    } finally {
      setSearchingGtin(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <CiclikHeader />
        
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Produtos Ciclik</h1>
                <p className="text-muted-foreground">Cadastro e gerenciamento de produtos</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/admin/products/report')}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Relatório Produtos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do produto Ciclik
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gtin">GTIN *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="gtin"
                          value={formData.gtin}
                          onChange={(e) => setFormData({...formData, gtin: e.target.value})}
                          placeholder="7891234567890"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSearchGtin}
                          disabled={searchingGtin || !formData.gtin || formData.gtin.length < 8}
                        >
                          {searchingGtin ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clique na lupa para buscar dados automaticamente
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ncm">NCM *</Label>
                      <Input
                        id="ncm"
                        value={formData.ncm}
                        onChange={(e) => setFormData({...formData, ncm: e.target.value})}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_embalagem">Tipo de Embalagem</Label>
                    <Select
                      value={formData.tipo_embalagem}
                      onValueChange={(value) => setFormData({...formData, tipo_embalagem: value as TipoEmbalagem})}
                    >
                      <SelectTrigger>
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="reciclavel"
                      checked={formData.reciclavel}
                      onCheckedChange={(checked) => setFormData({...formData, reciclavel: checked})}
                    />
                    <Label htmlFor="reciclavel">Reciclável</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="percentual">
                      Percentual de Reciclabilidade: {formData.percentual_reciclabilidade}%
                    </Label>
                    <Slider
                      id="percentual"
                      min={0}
                      max={100}
                      step={5}
                      value={[formData.percentual_reciclabilidade]}
                      onValueChange={(value) => setFormData({...formData, percentual_reciclabilidade: value[0]})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="peso_medio">Peso Médio da Embalagem (kg)</Label>
                    <Input
                      id="peso_medio"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.peso_medio_gramas || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        peso_medio_gramas: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      placeholder="Ex: 0.250"
                    />
                    <p className="text-xs text-muted-foreground">
                      Peso médio da embalagem vazia em quilos (para cálculo de peso total)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Informações adicionais"
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <Label className="text-lg font-semibold">Tipos de Embalagem Adicionais</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicione múltiplos tipos de embalagem com suas respectivas classificações
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                      <div className="col-span-2">
                        <Label>Tipo de Embalagem</Label>
                        <Select
                          value={currentEmbalagem.tipo_embalagem}
                          onValueChange={(value) => setCurrentEmbalagem({
                            ...currentEmbalagem,
                            tipo_embalagem: value as TipoEmbalagem
                          })}
                        >
                          <SelectTrigger>
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

                      <div className="col-span-2 flex items-center space-x-2">
                        <Switch
                          checked={currentEmbalagem.reciclavel}
                          onCheckedChange={(checked) => setCurrentEmbalagem({
                            ...currentEmbalagem,
                            reciclavel: checked
                          })}
                        />
                        <Label>Reciclável</Label>
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>
                          Percentual de Reciclabilidade: {currentEmbalagem.percentual_reciclabilidade}%
                        </Label>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[currentEmbalagem.percentual_reciclabilidade]}
                          onValueChange={(value) => setCurrentEmbalagem({
                            ...currentEmbalagem,
                            percentual_reciclabilidade: value[0]
                          })}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>Peso Médio (kg)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={currentEmbalagem.peso_medio_gramas || ''}
                          onChange={(e) => setCurrentEmbalagem({
                            ...currentEmbalagem,
                            peso_medio_gramas: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          placeholder="Ex: 0.150"
                        />
                      </div>

                      <div className="col-span-2">
                        <Button
                          type="button"
                          onClick={addEmbalagem}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Embalagem
                        </Button>
                      </div>
                    </div>

                    {formData.embalagens.length > 0 && (
                      <div className="space-y-2">
                        <Label>Embalagens Adicionadas ({formData.embalagens.length})</Label>
                        <div className="space-y-2">
                          {formData.embalagens.map((emb, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-background"
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {TIPOS_EMBALAGEM_LABELS[emb.tipo_embalagem]}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {emb.reciclavel ? 'Reciclável' : 'Não reciclável'} • {emb.percentual_reciclabilidade}%
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmbalagem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Diálogo de edição rápida de peso */}
            <Dialog open={isPesoDialogOpen} onOpenChange={setIsPesoDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Peso Médio</DialogTitle>
                  <DialogDescription>
                    {editingPeso?.descricao}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso_edicao">Peso Médio (kg)</Label>
                    <Input
                      id="peso_edicao"
                      type="number"
                      step="0.001"
                      min="0"
                      value={editingPeso?.peso || ''}
                      onChange={(e) => setEditingPeso(editingPeso ? {
                        ...editingPeso,
                        peso: e.target.value ? parseFloat(e.target.value) : null
                      } : null)}
                      placeholder="Ex: 0.250"
                    />
                    <p className="text-xs text-muted-foreground">
                      Peso médio da embalagem vazia em quilos
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPesoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePeso} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recicláveis</CardTitle>
                <Recycle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reciclaveis}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.reciclaveis / stats.total) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xs">Plástico: {stats.plastico}</div>
                <div className="text-xs">Vidro: {stats.vidro}</div>
                <div className="text-xs">Papel: {stats.papel}</div>
                <div className="text-xs">Papelão: {stats.papelao}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xs">Alumínio: {stats.aluminio}</div>
                <div className="text-xs">Laminado: {stats.laminado}</div>
                <div className="text-xs">Misto: {stats.misto}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Produtos Cadastrados</CardTitle>
                  <CardDescription className="mt-2">
                    {filteredProducts.length} de {products.length} produto(s)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
              
              <div className="space-y-4 mt-4">
                {/* Barra de busca */}
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por GTIN, NCM ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {/* Filtros avançados */}
                {showFilters && (
                  <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Filtro por tipo de embalagem */}
                      <div className="space-y-2">
                        <Label>Tipo de Embalagem</Label>
                        <Select value={filterTipoEmbalagem} onValueChange={setFilterTipoEmbalagem}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {Object.entries(TIPOS_EMBALAGEM_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro por reciclável */}
                      <div className="space-y-2">
                        <Label>Reciclável</Label>
                        <Select value={filterReciclavel} onValueChange={setFilterReciclavel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="yes">Apenas recicláveis</SelectItem>
                            <SelectItem value="no">Apenas não recicláveis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Limpar filtros */}
                      <div className="space-y-2">
                        <Label>Ações</Label>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setFilterTipoEmbalagem("all");
                            setFilterReciclavel("all");
                            setFilterPercentualMin(0);
                            setFilterPercentualMax(100);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>

                    {/* Filtro por faixa de reciclabilidade */}
                    <div className="space-y-2">
                      <Label>
                        Faixa de Reciclabilidade: {filterPercentualMin}% - {filterPercentualMax}%
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs text-muted-foreground">Mínimo</Label>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[filterPercentualMin]}
                            onValueChange={(value) => setFilterPercentualMin(value[0])}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs text-muted-foreground">Máximo</Label>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[filterPercentualMax]}
                            onValueChange={(value) => setFilterPercentualMax(value[0])}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[130px]">GTIN</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px]">NCM</TableHead>
                        <TableHead className="w-[120px]">Embalagem</TableHead>
                        <TableHead className="w-[100px]">Peso Médio</TableHead>
                        <TableHead className="w-[120px]">Reciclável</TableHead>
                        <TableHead className="w-[100px] text-center">% Recic.</TableHead>
                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs">{product.gtin}</TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              <div className="font-medium">{product.descricao}</div>
                              {product.observacoes && (
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {product.observacoes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{product.ncm}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {TIPOS_EMBALAGEM_LABELS[product.tipo_embalagem]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.peso_medio_gramas 
                              ? `${gramasParaKg(product.peso_medio_gramas)} kg` 
                              : <span className="text-muted-foreground text-xs">-</span>
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.reciclavel ? "default" : "secondary"}>
                              {product.reciclavel ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {product.reciclavel && (
                              <span className="font-medium">{product.percentual_reciclabilidade}%</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPesoDialog(product)}
                                title="Editar peso médio"
                              >
                                <Scale className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
        </div>

        {/* Import CSV Dialog */}
        <ImportCSVDialog 
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onSuccess={loadProducts}
        />
      </div>
    </PageTransition>
  );
}
