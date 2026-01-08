import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Target, Calendar, DollarSign, TrendingUp, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  valor_total: number;
  metas_principais: string[];
  publico_alvo: string;
  data_inicio: string;
  data_fim: string;
  meta_co2_evitado_kg: number;
  meta_kg_residuos: number;
  meta_minutos_educacao: number;
  meta_produtos_catalogados: number;
  co2_conciliado_kg: number;
  kg_conciliados: number;
  minutos_conciliados: number;
  produtos_conciliados: number;
  total_quotas: number;
  quotas_vendidas: number;
  status: string;
  created_at: string;
}

const AdminCDVProjetos = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state for create
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valor_total: "",
    publico_alvo: "",
    data_inicio: "",
    data_fim: "",
    prazo_maturacao_meses: "12",
    quotas_por_periodo: "",
    meta_1: "",
    meta_2: "",
    meta_3: "",
    meta_4: "",
    meta_5: "",
  });

  // Form state for edit
  const [editFormData, setEditFormData] = useState({
    titulo: "",
    descricao: "",
    publico_alvo: "",
    data_inicio: "",
    data_fim: "",
    status: "",
    meta_1: "",
    meta_2: "",
    meta_3: "",
    meta_4: "",
    meta_5: "",
  });

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    try {
      const { data, error } = await supabase
        .from("cdv_projetos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjetos(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar projetos:", error);
      toast({
        title: "Erro ao carregar projetos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularMetasImpacto = (valorTotal: number) => {
    const numQuotas = Math.floor(valorTotal / 2000);
    return {
      total_quotas: numQuotas,
      meta_kg_residuos: numQuotas * 250,
      meta_minutos_educacao: numQuotas * 5,
      meta_produtos_catalogados: numQuotas * 1,
      meta_co2_evitado_kg: numQuotas * 225,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const valorTotal = parseFloat(formData.valor_total);
      const metas = calcularMetasImpacto(valorTotal);
      const metasPrincipais = [
        formData.meta_1,
        formData.meta_2,
        formData.meta_3,
        formData.meta_4,
        formData.meta_5,
      ].filter(m => m.trim() !== "");

      // Criar projeto
      const { data: projeto, error: projetoError } = await supabase
        .from("cdv_projetos")
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao,
          valor_total: valorTotal,
          metas_principais: metasPrincipais,
          publico_alvo: formData.publico_alvo,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          prazo_maturacao_meses: parseInt(formData.prazo_maturacao_meses),
          quotas_por_periodo: formData.quotas_por_periodo ? parseInt(formData.quotas_por_periodo) : null,
          ...metas,
        })
        .select()
        .single();

      if (projetoError) throw projetoError;

      // Gerar quotas automaticamente (sem investidor - disponíveis para venda)
      const prazoMeses = parseInt(formData.prazo_maturacao_meses);
      const quotas = [];
      for (let i = 1; i <= metas.total_quotas; i++) {
        // Data de maturação calculada a partir da data de início + prazo
        const dataMaturacao = new Date(formData.data_inicio);
        dataMaturacao.setMonth(dataMaturacao.getMonth() + prazoMeses);
        
        quotas.push({
          id_projeto: projeto.id,
          numero_quota: `${projeto.id.substring(0, 8).toUpperCase()}-${i.toString().padStart(4, '0')}`,
          valor_pago: 2000,
          data_maturacao: dataMaturacao.toISOString(),
          id_investidor: null, // Quota disponível (sem investidor)
          status_maturacao: null, // Será definido quando investidor for atribuído
          meta_kg_residuos: 250,
          meta_horas_educacao: 5,
          meta_embalagens: 1,
          meta_co2_evitado_kg: 225,
        });
      }

      const { error: quotasError } = await supabase
        .from("cdv_quotas")
        .insert(quotas);

      if (quotasError) throw quotasError;

      toast({
        title: "Projeto criado com sucesso!",
        description: `${metas.total_quotas} quotas geradas automaticamente.`,
      });

      setDialogOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        valor_total: "",
        publico_alvo: "",
        data_inicio: "",
        data_fim: "",
        prazo_maturacao_meses: "12",
        quotas_por_periodo: "",
        meta_1: "",
        meta_2: "",
        meta_3: "",
        meta_4: "",
        meta_5: "",
      });
      fetchProjetos();
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calcularProgresso = (projeto: Projeto) => {
    const progressoKg = projeto.meta_kg_residuos > 0 
      ? (projeto.kg_conciliados / projeto.meta_kg_residuos) * 100 
      : 0;
    const progressoMinutos = projeto.meta_minutos_educacao > 0
      ? (projeto.minutos_conciliados / projeto.meta_minutos_educacao) * 100
      : 0;
    const progressoProdutos = projeto.meta_produtos_catalogados > 0
      ? (projeto.produtos_conciliados / projeto.meta_produtos_catalogados) * 100
      : 0;
    
    return Math.round((progressoKg + progressoMinutos + progressoProdutos) / 3);
  };

  const handleDeleteProjeto = async (projetoId: string) => {
    setDeleting(projetoId);
    try {
      // Primeiro deletar todas as quotas do projeto
      const { error: quotasError } = await supabase
        .from("cdv_quotas")
        .delete()
        .eq("id_projeto", projetoId);

      if (quotasError) throw quotasError;

      // Depois deletar o projeto
      const { error: projetoError } = await supabase
        .from("cdv_projetos")
        .delete()
        .eq("id", projetoId);

      if (projetoError) throw projetoError;

      toast({
        title: "Projeto excluído",
        description: "O projeto e suas quotas foram removidos com sucesso.",
      });

      fetchProjetos();
    } catch (error: any) {
      console.error("Erro ao excluir projeto:", error);
      toast({
        title: "Erro ao excluir projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (projeto: Projeto) => {
    const metas = projeto.metas_principais || [];
    setEditingProjeto(projeto);
    setEditFormData({
      titulo: projeto.titulo,
      descricao: projeto.descricao,
      publico_alvo: projeto.publico_alvo || "",
      data_inicio: projeto.data_inicio,
      data_fim: projeto.data_fim,
      status: projeto.status,
      meta_1: metas[0] || "",
      meta_2: metas[1] || "",
      meta_3: metas[2] || "",
      meta_4: metas[3] || "",
      meta_5: metas[4] || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjeto) return;
    
    setSaving(true);
    try {
      const metasPrincipais = [
        editFormData.meta_1,
        editFormData.meta_2,
        editFormData.meta_3,
        editFormData.meta_4,
        editFormData.meta_5,
      ].filter(m => m.trim() !== "");

      const { error } = await supabase
        .from("cdv_projetos")
        .update({
          titulo: editFormData.titulo,
          descricao: editFormData.descricao,
          publico_alvo: editFormData.publico_alvo,
          data_inicio: editFormData.data_inicio,
          data_fim: editFormData.data_fim,
          status: editFormData.status,
          metas_principais: metasPrincipais,
        })
        .eq("id", editingProjeto.id);

      if (error) throw error;

      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setEditDialogOpen(false);
      setEditingProjeto(null);
      fetchProjetos();
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando projetos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão criar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projetos CDV</h2>
          <p className="text-muted-foreground">
            Gerencie os projetos de Certificado Digital Verde e suas quotas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto CDV</DialogTitle>
              <DialogDescription>
                As quotas serão geradas automaticamente com base no valor total (R$ 2.000,00 por quota)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Projeto *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                    required
                  />
                  {formData.valor_total && (
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(parseFloat(formData.valor_total) / 2000)} quotas serão geradas
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publico_alvo">Público Alvo</Label>
                  <Input
                    id="publico_alvo"
                    value={formData.publico_alvo}
                    onChange={(e) => setFormData({ ...formData, publico_alvo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Término do Projeto *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo_maturacao_meses">Prazo de Maturação (meses) *</Label>
                  <Input
                    id="prazo_maturacao_meses"
                    type="number"
                    min="1"
                    value={formData.prazo_maturacao_meses}
                    onChange={(e) => setFormData({ ...formData, prazo_maturacao_meses: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo padrão para execução dos impactos de cada quota (padrão: 12 meses)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotas_por_periodo">Quotas por Período (opcional)</Label>
                  <Input
                    id="quotas_por_periodo"
                    type="number"
                    min="1"
                    value={formData.quotas_por_periodo}
                    onChange={(e) => setFormData({ ...formData, quotas_por_periodo: e.target.value })}
                    placeholder="Ex: 50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantas quotas disponibilizar a cada 12 meses (deixe em branco para liberar todas)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>5 Metas Principais do Projeto</Label>
                {[1, 2, 3, 4, 5].map((num) => (
                  <Input
                    key={num}
                    placeholder={`Meta ${num}`}
                    value={formData[`meta_${num}` as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [`meta_${num}`]: e.target.value })}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Criando..." : "Criar Projeto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de projetos */}
      <div className="space-y-4">
        {projetos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum projeto criado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          projetos.map((projeto) => {
            const progresso = calcularProgresso(projeto);
            return (
              <Card key={projeto.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {projeto.titulo}
                      </CardTitle>
                      <CardDescription>{projeto.descricao}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={projeto.status === 'ativo' ? 'default' : 'secondary'}>
                        {projeto.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(projeto)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleting === projeto.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Projeto CDV</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o projeto "{projeto.titulo}"? 
                              Isso também removerá todas as {projeto.total_quotas} quotas associadas. 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteProjeto(projeto.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting === projeto.id ? "Excluindo..." : "Excluir Projeto"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Informações principais */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          Valor Total
                        </div>
                        <p className="text-lg font-semibold">{formatCurrency(projeto.valor_total)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="w-4 h-4" />
                          Quotas
                        </div>
                        <p className="text-lg font-semibold">
                          {projeto.quotas_vendidas}/{projeto.total_quotas}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Vigência
                        </div>
                        <p className="text-sm">
                          {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')} - {new Date(projeto.data_fim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Progresso
                        </div>
                        <p className="text-lg font-semibold">{progresso}%</p>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso Geral</span>
                        <span className="font-medium">{progresso}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                    </div>

                    {/* Metas de impacto */}
                    <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">CO² Evitado</p>
                        <p className="text-sm font-semibold">
                          {formatNumber(projeto.co2_conciliado_kg, 0)}/{formatNumber(projeto.meta_co2_evitado_kg, 0)} kg
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Resíduos</p>
                        <p className="text-sm font-semibold">
                          {formatNumber(projeto.kg_conciliados, 0)}/{formatNumber(projeto.meta_kg_residuos, 0)} kg
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Educação</p>
                        <p className="text-sm font-semibold">
                          {formatNumber(projeto.minutos_conciliados, 0)}/{formatNumber(projeto.meta_minutos_educacao, 0)} min
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Produtos</p>
                        <p className="text-sm font-semibold">
                          {projeto.produtos_conciliados}/{projeto.meta_produtos_catalogados}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto CDV</DialogTitle>
            <DialogDescription>
              Altere as informações do projeto. O valor total e número de quotas não podem ser alterados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_titulo">Título do Projeto *</Label>
              <Input
                id="edit_titulo"
                value={editFormData.titulo}
                onChange={(e) => setEditFormData({ ...editFormData, titulo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_descricao">Descrição *</Label>
              <Textarea
                id="edit_descricao"
                value={editFormData.descricao}
                onChange={(e) => setEditFormData({ ...editFormData, descricao: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_publico_alvo">Público Alvo</Label>
                <Input
                  id="edit_publico_alvo"
                  value={editFormData.publico_alvo}
                  onChange={(e) => setEditFormData({ ...editFormData, publico_alvo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <select
                  id="edit_status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_data_inicio">Data Início *</Label>
                <Input
                  id="edit_data_inicio"
                  type="date"
                  value={editFormData.data_inicio}
                  onChange={(e) => setEditFormData({ ...editFormData, data_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_data_fim">Data Término do Projeto *</Label>
                <Input
                  id="edit_data_fim"
                  type="date"
                  value={editFormData.data_fim}
                  onChange={(e) => setEditFormData({ ...editFormData, data_fim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>5 Metas Principais do Projeto</Label>
              {[1, 2, 3, 4, 5].map((num) => (
                <Input
                  key={num}
                  placeholder={`Meta ${num}`}
                  value={editFormData[`meta_${num}` as keyof typeof editFormData]}
                  onChange={(e) => setEditFormData({ ...editFormData, [`meta_${num}`]: e.target.value })}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCDVProjetos;
