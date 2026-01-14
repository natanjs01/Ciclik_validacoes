import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, AlertTriangle, TrendingUp, Plus, Loader2, Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import CiclikHeader from "@/components/CiclikHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TipoEmbalagem, TIPOS_EMBALAGEM_LABELS } from "@/types/produtos";

interface ProductReport {
  gtin: string;
  descricao: string;
  frequencia: number;
  ultimaOcorrencia: string;
  exemplosNotas: string[];
}

export default function AdminProductsReport() {
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchingGtin, setSearchingGtin] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductReport | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    gtin: "",
    ncm: "",
    descricao: "",
    tipo_embalagem: "plastico" as TipoEmbalagem,
    reciclavel: true,
    percentual_reciclabilidade: 100,
    observacoes: ""
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Buscar todas as notas fiscais com itens
      const { data: notas, error } = await supabase
        .from('notas_fiscais')
        .select('itens_enriquecidos, data_envio, numero_nota')
        .not('itens_enriquecidos', 'is', null);

      if (error) throw error;

      // Processar itens para encontrar produtos não cadastrados
      const productMap = new Map<string, {
        gtin: string;
        descricoes: Set<string>;
        frequencia: number;
        ultimaOcorrencia: string;
        exemplosNotas: Set<string>;
      }>();

      notas?.forEach((nota) => {
        const itens = nota.itens_enriquecidos as any[];
        if (!Array.isArray(itens)) return;

        itens.forEach((item) => {
          // Apenas produtos não cadastrados com GTIN
          if (item.produto_cadastrado === false && item.gtin) {
            const existing = productMap.get(item.gtin);
            
            if (existing) {
              existing.frequencia++;
              if (item.nome) existing.descricoes.add(item.nome);
              if (nota.numero_nota) existing.exemplosNotas.add(nota.numero_nota);
              if (nota.data_envio && nota.data_envio > existing.ultimaOcorrencia) {
                existing.ultimaOcorrencia = nota.data_envio;
              }
            } else {
              productMap.set(item.gtin, {
                gtin: item.gtin,
                descricoes: new Set(item.nome ? [item.nome] : []),
                frequencia: 1,
                ultimaOcorrencia: nota.data_envio || new Date().toISOString(),
                exemplosNotas: new Set(nota.numero_nota ? [nota.numero_nota] : [])
              });
            }
          }
        });
      });

      // Converter para array e ordenar por frequência
      const reportData: ProductReport[] = Array.from(productMap.values())
        .map(item => ({
          gtin: item.gtin,
          descricao: Array.from(item.descricoes).join(' / ') || 'Sem descrição',
          frequencia: item.frequencia,
          ultimaOcorrencia: item.ultimaOcorrencia,
          exemplosNotas: Array.from(item.exemplosNotas).slice(0, 3)
        }))
        .sort((a, b) => b.frequencia - a.frequencia);

      setProducts(reportData);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product: ProductReport) => {
    setSelectedProduct(product);
    setFormData({
      gtin: product.gtin,
      ncm: "",
      descricao: product.descricao.split(' / ')[0], // Pegar primeira descrição
      tipo_embalagem: "plastico",
      reciclavel: true,
      percentual_reciclabilidade: 100,
      observacoes: `Frequência: ${product.frequencia}x\nÚltima ocorrência: ${new Date(product.ultimaOcorrencia).toLocaleDateString()}`
    });
    setIsDialogOpen(true);
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

      if (error) throw error;

      if (data.success && data.data) {
        const product = data.data;
        
        setFormData(prev => ({
          ...prev,
          descricao: product.descricao || prev.descricao,
          ncm: product.ncm || prev.ncm,
          observacoes: `${prev.observacoes}\n\nMarca: ${product.marca || 'N/A'}\nCategoria: ${product.categoria || 'N/A'}\nFonte: ${data.source}`
        }));

        toast({
          title: "Produto encontrado!",
          description: `Dados obtidos de ${data.source}. Revise e complete as informações.`,
        });
      } else {
        toast({
          title: "Produto não encontrado",
          description: data.message || "Preencha os dados manualmente",
          variant: "destructive"
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

  const handleSave = async () => {
    if (!formData.gtin || !formData.ncm || !formData.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha GTIN, NCM e Descrição",
        variant: "destructive"
      });
      return;
    }

    setSavingProduct(true);
    try {
      const { error } = await supabase
        .from('produtos_ciclik')
        .insert([{
          gtin: formData.gtin,
          ncm: formData.ncm,
          descricao: formData.descricao,
          tipo_embalagem: formData.tipo_embalagem,
          reciclavel: formData.reciclavel,
          percentual_reciclabilidade: formData.percentual_reciclabilidade,
          observacoes: formData.observacoes
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso"
      });

      setIsDialogOpen(false);
      loadReport(); // Recarregar relatório
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o produto",
        variant: "destructive"
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const totalProdutosNaoCadastrados = products.length;
  const totalOcorrencias = products.reduce((sum, p) => sum + p.frequencia, 0);
  const top5Produtos = products.slice(0, 5);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <CiclikHeader />
        
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/products')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Relatório de Produtos Não Cadastrados</h1>
              <p className="text-muted-foreground">Priorize cadastros baseado na frequência nas notas fiscais</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Únicos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProdutosNaoCadastrados}</div>
                <p className="text-xs text-muted-foreground">Aguardando cadastro</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ocorrências</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOcorrencias}</div>
                <p className="text-xs text-muted-foreground">Nas notas fiscais</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Prioridade</CardTitle>
                <Package className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{top5Produtos[0]?.frequencia || 0}x</div>
                <p className="text-xs text-muted-foreground">Produto mais frequente</p>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Não Cadastrados</CardTitle>
              <CardDescription>
                Ordenados por frequência de aparição nas notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto não cadastrado encontrado</p>
                  <p className="text-sm">Todos os produtos das notas fiscais já estão cadastrados!</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>GTIN</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Frequência</TableHead>
                        <TableHead>Última Ocorrência</TableHead>
                        <TableHead>Exemplos de Notas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => (
                        <TableRow key={product.gtin}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{product.gtin}</TableCell>
                          <TableCell className="max-w-xs truncate">{product.descricao}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={product.frequencia >= 10 ? "destructive" : product.frequencia >= 5 ? "default" : "secondary"}>
                              {product.frequencia}x
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(product.ultimaOcorrencia).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {product.exemplosNotas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {product.exemplosNotas.map((nota, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {nota}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Cadastrar
                            </Button>
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

        {/* Quick Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Produto</DialogTitle>
              <DialogDescription>
                Complete os dados do produto para cadastrá-lo no sistema
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
                      disabled
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearchGtin}
                      disabled={searchingGtin}
                    >
                      {searchingGtin ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Informações adicionais"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={savingProduct}>
                {savingProduct ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
