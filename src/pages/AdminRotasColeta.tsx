import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Users,
  Route,
  Ban,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';

interface Rota {
  id: string;
  nome: string;
  descricao: string | null;
  id_operador: string | null;
  status: string;
  created_at: string;
  operador?: { nome_fantasia: string } | null;
  dias?: RotaDia[];
  areas?: RotaArea[];
  _count?: { adesoes: number };
}

const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

interface RotaDia {
  id: string;
  id_rota: string;
  dia_semana: number;
  horario_inicio: string | null;
  horario_fim: string | null;
}

interface RotaArea {
  id: string;
  id_rota: string;
  logradouro: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string;
  uf: string;
  complemento_endereco: string | null;
}

interface Operador {
  id: string;
  nome_fantasia: string;
}

interface Adesao {
  id: string;
  id_usuario: string;
  id_rota: string;
  qrcode_adesao: string;
  endereco_coleta: string;
  status: string;
  data_adesao: string;
  usuario?: { nome: string; email: string } | null;
  rota?: { nome: string } | null;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function AdminRotasColeta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [adesoes, setAdesoes] = useState<Adesao[]>([]);
  const [activeTab, setActiveTab] = useState('rotas');

  // Dialog states
  const [showRotaDialog, setShowRotaDialog] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [editingRota, setEditingRota] = useState<Rota | null>(null);
  const [selectedRotaForArea, setSelectedRotaForArea] = useState<Rota | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states - Rota
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formOperador, setFormOperador] = useState('');
  const [formStatus, setFormStatus] = useState('ativa');
  const [formDias, setFormDias] = useState<{ dia: number; inicio: string; fim: string }[]>([]);

  // Form states - Area (listas para múltiplos valores)
  const [formBairros, setFormBairros] = useState<string[]>(['']);
  const [formLogradouros, setFormLogradouros] = useState<string[]>(['']);
  const [formCeps, setFormCeps] = useState<string[]>(['']);
  const [formCidade, setFormCidade] = useState('');
  const [formUf, setFormUf] = useState('');
  const [formComplemento, setFormComplemento] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRotas(), loadOperadores(), loadAdesoes()]);
    setLoading(false);
  };

  const loadRotas = async () => {
    try {
      const { data, error } = await supabase
        .from('rotas_coleta')
        .select(`
          *,
          operador:cooperativas(nome_fantasia)
        `)
        .order('nome');

      if (error) throw error;

      // Load dias and areas for each rota
      const rotasComDetalhes = await Promise.all(
        (data || []).map(async (rota) => {
          const [diasRes, areasRes, adesoesRes] = await Promise.all([
            supabase.from('rotas_dias_coleta').select('*').eq('id_rota', rota.id),
            supabase.from('rotas_areas_cobertura').select('*').eq('id_rota', rota.id),
            supabase.from('usuarios_rotas').select('id', { count: 'exact', head: true }).eq('id_rota', rota.id)
          ]);

          return {
            ...rota,
            dias: diasRes.data || [],
            areas: areasRes.data || [],
            _count: { adesoes: adesoesRes.count || 0 }
          };
        })
      );

      setRotas(rotasComDetalhes);
    } catch (error: any) {
      toast.error('Erro ao carregar rotas', { description: error.message });
    }
  };

  const loadOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from('cooperativas')
        .select('id, nome_fantasia')
        .eq('status', 'aprovada')
        .order('nome_fantasia');

      if (error) throw error;
      setOperadores(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar operadores', { description: error.message });
    }
  };

  const loadAdesoes = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_rotas')
        .select(`
          *,
          usuario:profiles(nome, email),
          rota:rotas_coleta(nome)
        `)
        .order('data_adesao', { ascending: false });

      if (error) throw error;
      setAdesoes(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar adesões', { description: error.message });
    }
  };

  const openRotaDialog = (rota?: Rota) => {
    if (rota) {
      setEditingRota(rota);
      setFormNome(rota.nome);
      setFormDescricao(rota.descricao || '');
      setFormOperador(rota.id_operador || '');
      setFormStatus(rota.status);
      setFormDias(
        (rota.dias || []).map(d => ({
          dia: d.dia_semana,
          inicio: d.horario_inicio || '',
          fim: d.horario_fim || ''
        }))
      );
    } else {
      setEditingRota(null);
      setFormNome('');
      setFormDescricao('');
      setFormOperador('');
      setFormStatus('ativa');
      setFormDias([]);
    }
    setShowRotaDialog(true);
  };

  const openAreaDialog = (rota: Rota) => {
    setSelectedRotaForArea(rota);
    setFormBairros(['']);
    setFormLogradouros(['']);
    setFormCeps(['']);
    setFormCidade('');
    setFormUf('');
    setFormComplemento('');
    setShowAreaDialog(true);
  };

  // Helpers para adicionar/remover itens das listas
  const addBairro = () => setFormBairros([...formBairros, '']);
  const removeBairro = (index: number) => setFormBairros(formBairros.filter((_, i) => i !== index));
  const updateBairro = (index: number, value: string) => {
    const updated = [...formBairros];
    updated[index] = value;
    setFormBairros(updated);
  };

  const addLogradouro = () => setFormLogradouros([...formLogradouros, '']);
  const removeLogradouro = (index: number) => setFormLogradouros(formLogradouros.filter((_, i) => i !== index));
  const updateLogradouro = (index: number, value: string) => {
    const updated = [...formLogradouros];
    updated[index] = value;
    setFormLogradouros(updated);
  };

  const addCep = () => setFormCeps([...formCeps, '']);
  const removeCep = (index: number) => setFormCeps(formCeps.filter((_, i) => i !== index));
  const updateCep = (index: number, value: string) => {
    const updated = [...formCeps];
    updated[index] = value;
    setFormCeps(updated);
  };

  const toggleDia = (dia: number) => {
    const exists = formDias.find(d => d.dia === dia);
    if (exists) {
      setFormDias(formDias.filter(d => d.dia !== dia));
    } else {
      setFormDias([...formDias, { dia, inicio: '08:00', fim: '17:00' }]);
    }
  };

  const updateDiaHorario = (dia: number, field: 'inicio' | 'fim', value: string) => {
    setFormDias(formDias.map(d => 
      d.dia === dia ? { ...d, [field]: value } : d
    ));
  };

  const saveRota = async () => {
    if (!formNome.trim()) {
      toast.error('Nome da rota é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let rotaId: string;

      if (editingRota) {
        const { error } = await supabase
          .from('rotas_coleta')
          .update({
            nome: formNome,
            descricao: formDescricao || null,
            id_operador: formOperador || null,
            status: formStatus
          })
          .eq('id', editingRota.id);

        if (error) throw error;
        rotaId = editingRota.id;

        // Delete existing dias
        await supabase.from('rotas_dias_coleta').delete().eq('id_rota', rotaId);
      } else {
        const { data, error } = await supabase
          .from('rotas_coleta')
          .insert({
            nome: formNome,
            descricao: formDescricao || null,
            id_operador: formOperador || null,
            status: formStatus
          })
          .select()
          .single();

        if (error) throw error;
        rotaId = data.id;
      }

      // Insert dias
      if (formDias.length > 0) {
        const diasInsert = formDias.map(d => ({
          id_rota: rotaId,
          dia_semana: d.dia,
          horario_inicio: d.inicio || null,
          horario_fim: d.fim || null
        }));

        const { error: diasError } = await supabase
          .from('rotas_dias_coleta')
          .insert(diasInsert);

        if (diasError) throw diasError;
      }

      toast.success(editingRota ? 'Rota atualizada!' : 'Rota criada!');
      setShowRotaDialog(false);
      loadRotas();
    } catch (error: any) {
      toast.error('Erro ao salvar rota', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveArea = async () => {
    if (!selectedRotaForArea) return;
    
    const areaUf = formUf.trim();
    const areaCidade = formCidade.trim();
    
    if (!areaCidade || !areaUf) {
      toast.error('Cidade e UF são obrigatórios.');
      return;
    }
    
    // Filtrar valores vazios
    const bairrosValidos = formBairros.filter(b => b.trim());
    const logradourosValidos = formLogradouros.filter(l => l.trim());
    const cepsValidos = formCeps.filter(c => c.trim());
    
    if (bairrosValidos.length === 0 && logradourosValidos.length === 0) {
      toast.error('Informe pelo menos um bairro ou logradouro');
      return;
    }

    setSaving(true);
    try {
      // Criar registros combinados para cada bairro com seus logradouros/ceps
      const areasParaInserir: any[] = [];
      
      // Se temos bairros, criar uma área para cada combinação bairro + logradouro
      if (bairrosValidos.length > 0) {
        for (const bairro of bairrosValidos) {
          if (logradourosValidos.length > 0) {
            // Criar uma área para cada logradouro neste bairro
            for (let i = 0; i < logradourosValidos.length; i++) {
              areasParaInserir.push({
                id_rota: selectedRotaForArea.id,
                bairro: bairro,
                logradouro: logradourosValidos[i],
                cep: cepsValidos[i] || null,
                cidade: areaCidade,
                uf: areaUf.toUpperCase(),
                complemento_endereco: formComplemento || null
              });
            }
          } else {
            // Apenas bairro, sem logradouros específicos
            areasParaInserir.push({
              id_rota: selectedRotaForArea.id,
              bairro: bairro,
              logradouro: null,
              cep: cepsValidos[0] || null,
              cidade: areaCidade,
              uf: areaUf.toUpperCase(),
              complemento_endereco: formComplemento || null
            });
          }
        }
      } else {
        // Sem bairros, apenas logradouros
        for (let i = 0; i < logradourosValidos.length; i++) {
          areasParaInserir.push({
            id_rota: selectedRotaForArea.id,
            bairro: null,
            logradouro: logradourosValidos[i],
            cep: cepsValidos[i] || null,
            cidade: areaCidade,
            uf: areaUf.toUpperCase(),
            complemento_endereco: formComplemento || null
          });
        }
      }

      const { error } = await supabase
        .from('rotas_areas_cobertura')
        .insert(areasParaInserir);

      if (error) throw error;

      toast.success(`${areasParaInserir.length} área(s) adicionada(s)!`);
      setShowAreaDialog(false);
      loadRotas();
    } catch (error: any) {
      toast.error('Erro ao salvar área', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteRota = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta rota? Todas as áreas e adesões serão removidas.')) return;

    try {
      const { error } = await supabase.from('rotas_coleta').delete().eq('id', id);
      if (error) throw error;
      toast.success('Rota excluída!');
      loadRotas();
    } catch (error: any) {
      toast.error('Erro ao excluir rota', { description: error.message });
    }
  };

  const deleteArea = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta área?')) return;

    try {
      const { error } = await supabase.from('rotas_areas_cobertura').delete().eq('id', id);
      if (error) throw error;
      toast.success('Área excluída!');
      loadRotas();
    } catch (error: any) {
      toast.error('Erro ao excluir área', { description: error.message });
    }
  };

  const toggleRotaStatus = async (rota: Rota) => {
    const newStatus = rota.status === 'ativa' ? 'bloqueada' : 'ativa';
    try {
      const { error } = await supabase
        .from('rotas_coleta')
        .update({ status: newStatus })
        .eq('id', rota.id);

      if (error) throw error;
      toast.success(`Rota ${newStatus === 'ativa' ? 'ativada' : 'bloqueada'}!`);
      loadRotas();
    } catch (error: any) {
      toast.error('Erro ao alterar status', { description: error.message });
    }
  };

  const getDiaLabel = (dia: number) => DIAS_SEMANA.find(d => d.value === dia)?.label || '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-success/20 text-success">Ativa</Badge>;
      case 'bloqueada':
        return <Badge className="bg-destructive/20 text-destructive">Bloqueada</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Button onClick={() => navigate('/admin')} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <Route className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestão de Rotas de Coleta</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie rotas, áreas de cobertura e adesões
                </p>
              </div>
            </div>
            <Button onClick={() => openRotaDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Rota
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="rotas" className="gap-2">
                <Route className="h-4 w-4" />
                Rotas ({rotas.length})
              </TabsTrigger>
              <TabsTrigger value="adesoes" className="gap-2">
                <Users className="h-4 w-4" />
                Adesões ({adesoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rotas" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rotas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Route className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma rota cadastrada</p>
                    <Button onClick={() => openRotaDialog()} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Rota
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {rotas.map(rota => (
                    <Card key={rota.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{rota.nome}</CardTitle>
                              {getStatusBadge(rota.status)}
                            </div>
                            <CardDescription className="mt-1">
                              {rota.descricao || 'Sem descrição'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openAreaDialog(rota)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              Áreas
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openRotaDialog(rota)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRotaStatus(rota)}
                            >
                              {rota.status === 'ativa' ? (
                                <Ban className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRota(rota.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Informações principais */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Operador</p>
                            <p className="font-medium">{rota.operador?.nome_fantasia || 'Não definido'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Adesões</p>
                            <p className="font-medium">{rota._count?.adesoes || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Áreas de Cobertura</p>
                            <p className="font-medium">{rota.areas?.length || 0}</p>
                          </div>
                        </div>

                        {/* Bairros e Ruas consolidados */}
                        {rota.areas && rota.areas.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bairros */}
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Bairros
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {[...new Set(rota.areas.filter(a => a.bairro).map(a => a.bairro))].length > 0 ? (
                                  [...new Set(rota.areas.filter(a => a.bairro).map(a => a.bairro))].map((bairro, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {bairro}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">Nenhum bairro definido</span>
                                )}
                              </div>
                            </div>

                            {/* Ruas */}
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Route className="h-3 w-3" /> Ruas
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {[...new Set(rota.areas.filter(a => a.logradouro).map(a => a.logradouro))].length > 0 ? (
                                  [...new Set(rota.areas.filter(a => a.logradouro).map(a => a.logradouro))].map((rua, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {rua}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">Nenhuma rua definida</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {rota.dias && rota.dias.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Dias de Coleta</p>
                            <div className="flex flex-wrap gap-2">
                              {rota.dias.map(dia => (
                                <Badge key={dia.id} variant="outline">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {getDiaLabel(dia.dia_semana)}
                                  {dia.horario_inicio && ` ${dia.horario_inicio.slice(0, 5)}`}
                                  {dia.horario_fim && `-${dia.horario_fim.slice(0, 5)}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tabela completa de áreas (colapsável opcional) */}
                        {rota.areas && rota.areas.length > 0 && (
                          <details className="group">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                              Ver todas as {rota.areas.length} áreas de cobertura
                            </summary>
                            <div className="border rounded-lg overflow-hidden mt-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Logradouro</TableHead>
                                    <TableHead>Bairro</TableHead>
                                    <TableHead>Cidade/UF</TableHead>
                                    <TableHead>CEP</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {rota.areas.map(area => (
                                    <TableRow key={area.id}>
                                      <TableCell>{area.logradouro || '-'}</TableCell>
                                      <TableCell>{area.bairro || '-'}</TableCell>
                                      <TableCell>{area.cidade}/{area.uf}</TableCell>
                                      <TableCell>{area.cep || '-'}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteArea(area.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="adesoes">
              <Card>
                <CardHeader>
                  <CardTitle>Adesões de Usuários</CardTitle>
                  <CardDescription>Usuários que aderiram a rotas de coleta</CardDescription>
                </CardHeader>
                <CardContent>
                  {adesoes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma adesão registrada
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>QR Code</TableHead>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adesoes.map(adesao => (
                          <TableRow key={adesao.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{adesao.usuario?.nome || '-'}</p>
                                <p className="text-xs text-muted-foreground">{adesao.usuario?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{adesao.rota?.nome || '-'}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {adesao.qrcode_adesao}
                              </code>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {adesao.endereco_coleta}
                            </TableCell>
                            <TableCell>
                              {adesao.status === 'ativa' ? (
                                <Badge className="bg-success/20 text-success">Ativa</Badge>
                              ) : adesao.status === 'pausada' ? (
                                <Badge variant="secondary">Pausada</Badge>
                              ) : (
                                <Badge variant="destructive">Cancelada</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(adesao.data_adesao).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog - Nova/Editar Rota */}
        <Dialog open={showRotaDialog} onOpenChange={setShowRotaDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRota ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
              <DialogDescription>
                Configure os detalhes da rota de coleta
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Rota *</Label>
                  <Input
                    id="nome"
                    value={formNome}
                    onChange={e => setFormNome(e.target.value)}
                    placeholder="Ex: Rota Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operador">Operador</Label>
                  <Select value={formOperador} onValueChange={setFormOperador}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores.map(op => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.nome_fantasia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formDescricao}
                  onChange={e => setFormDescricao(e.target.value)}
                  placeholder="Descrição da rota..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="bloqueada">Bloqueada</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Dias de Coleta</Label>
                <div className="grid gap-3">
                  {DIAS_SEMANA.map(dia => {
                    const selected = formDias.find(d => d.dia === dia.value);
                    return (
                      <div key={dia.value} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-40">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleDia(dia.value)}
                          />
                          <span className="text-sm">{dia.label}</span>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={selected.inicio}
                              onChange={e => updateDiaHorario(dia.value, 'inicio', e.target.value)}
                              className="w-28"
                            />
                            <span>até</span>
                            <Input
                              type="time"
                              value={selected.fim}
                              onChange={e => updateDiaHorario(dia.value, 'fim', e.target.value)}
                              className="w-28"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRotaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveRota} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRota ? 'Salvar' : 'Criar Rota'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Adicionar Área */}
        <Dialog open={showAreaDialog} onOpenChange={setShowAreaDialog}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Área de Cobertura</DialogTitle>
              <DialogDescription>
                Rota: {selectedRotaForArea?.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Estado e Cidade */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-sm font-medium mb-3 block">📍 Localização</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="areaUf">Estado *</Label>
                    <Select value={formUf} onValueChange={setFormUf}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map(estado => (
                          <SelectItem key={estado.uf} value={estado.uf}>
                            {estado.uf} - {estado.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="areaCidade">Cidade *</Label>
                    <Input
                      id="areaCidade"
                      value={formCidade}
                      onChange={e => setFormCidade(e.target.value)}
                      placeholder="Ex: Salvador"
                    />
                  </div>
                </div>
              </div>

              {/* Bairros - Lista dinâmica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Bairros *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBairro}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formBairros.map((bairro, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bairro}
                        onChange={e => updateBairro(index, e.target.value)}
                        placeholder="Ex: Piatã, Itapuã, Centro"
                      />
                      {formBairros.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBairro(index)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Logradouros - Lista dinâmica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Logradouros (opcional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLogradouro}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formLogradouros.map((logradouro, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={logradouro}
                        onChange={e => updateLogradouro(index, e.target.value)}
                        placeholder="Ex: Rua das Flores, Av. Principal"
                      />
                      {formLogradouros.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLogradouro(index)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CEPs - Lista dinâmica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>CEPs (opcional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCep}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formCeps.map((cep, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={cep}
                        onChange={e => updateCep(index, e.target.value)}
                        placeholder="00000-000"
                        className="w-40"
                      />
                      {formCeps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCep(index)}
                          className="shrink-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Complemento */}
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento (opcional)</Label>
                <Input
                  id="complemento"
                  value={formComplemento}
                  onChange={e => setFormComplemento(e.target.value)}
                  placeholder="Ex: Números pares, próximo à praça"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAreaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveArea} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Áreas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
