import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Upload, Trash2, Gift, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    marketplace: '',
    codigo: '',
    valor: '',
    minimo_compra: '',
    data_validade: '',
    quantidade_total: '1',
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('cupons')
      .select('*')
      .order('data_resgate', { ascending: false, nullsFirst: false });
    
    if (data) setCoupons(data);
  };

  const resetForm = () => {
    setFormData({
      marketplace: '',
      codigo: '',
      valor: '',
      minimo_compra: '',
      data_validade: '',
      quantidade_total: '1',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('cupons')
        .insert({
          marketplace: formData.marketplace,
          codigo: formData.codigo,
          valor_reais: parseFloat(formData.valor),
          minimo_compra: parseFloat(formData.minimo_compra),
          data_validade: formData.data_validade || null,
          quantidade_total: parseInt(formData.quantidade_total),
          quantidade_disponivel: parseInt(formData.quantidade_total),
          status: 'disponivel'
        });
      
      if (error) throw error;
      toast({ title: 'Cupom criado!' });
      setIsDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkImport = async () => {
    try {
      // Formato esperado: marketplace,codigo,valor,minimo_compra,data_validade,quantidade
      const lines = bulkData.trim().split('\n').filter(line => line.trim() && !line.startsWith('Marketplace'));
      const couponsToImport = lines.map(line => {
        const [marketplace, codigo, valor, minimo_compra, data_validade, quantidade] = line.split(',');
        const qtd = parseInt(quantidade?.trim() || '1');
        return {
          marketplace: marketplace.trim(),
          codigo: codigo.trim(),
          valor_reais: parseFloat(valor.trim()),
          minimo_compra: parseFloat(minimo_compra.trim()),
          data_validade: data_validade?.trim() || null,
          quantidade_total: qtd,
          quantidade_disponivel: qtd,
          status: 'disponivel'
        };
      });

      const { error } = await supabase
        .from('cupons')
        .insert(couponsToImport);
      
      if (error) throw error;
      
      toast({ 
        title: 'Importação concluída!',
        description: `${couponsToImport.length} cupons importados` 
      });
      
      setIsBulkDialogOpen(false);
      setBulkData('');
      loadCoupons();
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Marketplace,Codigo,Valor,Minimo_Compra,Data_Validade,Quantidade
Amazon,VERDE50,50.00,200.00,2025-12-31,10
iFood,ECO30,30.00,150.00,2025-12-31,5
Rappi,SUSTENTA25,25.00,100.00,2025-06-30,15`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_cupons.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: 'Template baixado!',
      description: 'Preencha a planilha e importe de volta' 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Cupom excluído!' });
      loadCoupons();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'disponivel': <Badge className="bg-success text-white">Disponível</Badge>,
      'reservado': <Badge className="bg-warning text-white">Reservado</Badge>,
      'usado': <Badge variant="secondary" className="text-white">Usado</Badge>
    };
    return badges[status] || <Badge className="text-white">{status}</Badge>;
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return coupons;
    return coupons.filter(c => c.status === status);
  };

  const statsByMarketplace = () => {
    const stats: any = {};
    coupons.forEach(coupon => {
      if (!stats[coupon.marketplace]) {
        stats[coupon.marketplace] = { total: 0, disponivel: 0, usado: 0 };
      }
      stats[coupon.marketplace].total++;
      if (coupon.status === 'disponivel') stats[coupon.marketplace].disponivel++;
      if (coupon.status === 'usado') stats[coupon.marketplace].usado++;
    });
    return stats;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestão de Cupons</h1>
              <p className="text-muted-foreground">Criar e importar cupons em lote</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar em Lote
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importação em Lote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Formato CSV</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Modelo
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      placeholder="Marketplace,Codigo,Valor,Minimo_Compra,Data_Validade,Quantidade&#10;Amazon,VERDE50,50.00,200.00,2025-12-31,10"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold mb-2">Formato:</p>
                    <code className="text-xs">
                      Marketplace,Codigo,Valor,Minimo_Compra,Data_Validade,Quantidade<br />
                      Amazon,VERDE50,50.00,200.00,2025-12-31,10<br />
                      iFood,ECO30,30.00,150.00,2025-12-31,5
                    </code>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Dica:</strong> Baixe o modelo, preencha no Excel/Google Sheets e cole aqui.
                    </p>
                  </div>
                  <Button onClick={handleBulkImport} className="w-full">
                    Importar Cupons
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cupom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cupom</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Marketplace</Label>
                    <Input
                      value={formData.marketplace}
                      onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                      placeholder="Amazon, iFood, Rappi..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Código do Cupom</Label>
                    <Input
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="VERDE50OFF"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mínimo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.minimo_compra}
                        onChange={(e) => setFormData({ ...formData, minimo_compra: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Validade</Label>
                      <Input
                        type="date"
                        value={formData.data_validade}
                        onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">Deixe em branco para sem validade</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantidade_total}
                        onChange={(e) => setFormData({ ...formData, quantidade_total: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Criar Cupom
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats by Marketplace */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Object.entries(statsByMarketplace()).map(([marketplace, stats]: [string, any]) => (
            <Card key={marketplace}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{marketplace}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-success">Disponível:</span>
                    <span className="font-bold">{stats.disponivel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usados:</span>
                    <span>{stats.usado}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coupons List */}
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos ({coupons.length})</TabsTrigger>
            <TabsTrigger value="disponivel">Disponíveis</TabsTrigger>
            <TabsTrigger value="reservado">Reservados</TabsTrigger>
            <TabsTrigger value="usado">Usados</TabsTrigger>
          </TabsList>

          {['all', 'disponivel', 'reservado', 'usado'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterByStatus(tab).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum cupom nesta categoria</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Marketplace</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterByStatus(tab).map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-primary" />
                              {coupon.marketplace}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {coupon.codigo}
                            </code>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {coupon.valor_reais?.toFixed(2) || '0,00'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {coupon.quantidade_disponivel || 0}/{coupon.quantidade_total || 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            {coupon.data_validade ? (
                              <span className="text-sm">
                                {new Date(coupon.data_validade).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem validade</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(coupon.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            {coupon.status === 'disponivel' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDelete(coupon.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}