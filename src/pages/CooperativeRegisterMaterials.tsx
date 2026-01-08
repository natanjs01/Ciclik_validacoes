import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, CheckCircle, Package, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatWeight, formatNumber } from '@/lib/formatters';

interface MaterialRegistrado {
  id: string;
  tipo_material: string;
  subtipo_material: string;
  peso_kg: number;
}

const TIPOS_MATERIAL = {
  'Plástico': ['PET', 'PP', 'PEAD', 'PEBD', 'PVC', 'PS', 'OUTROS_PLASTICOS'],
  'Papel': ['PAPEL_BRANCO', 'PAPEL_COLORIDO', 'PAPELAO_ONDULADO'],
  'Vidro': ['VIDRO_TRANSPARENTE', 'VIDRO_COLORIDO', 'VIDRO_TEMPERADO'],
  'Metal': ['ALUMINIO_LATA', 'ALUMINIO_PERFIL', 'ACO'],
  'Alumínio': ['ALUMINIO_LATA', 'ALUMINIO_PERFIL'],
  'Laminado': ['LAMINADO_CAFE', 'LAMINADO_SALGADINHO', 'LAMINADO_OUTROS']
};

const LABELS_SUBMATERIAL: Record<string, string> = {
  'PET': 'PET (Garrafas)',
  'PP': 'PP (Potes)',
  'PEAD': 'PEAD (Embalagens rígidas)',
  'PEBD': 'PEBD (Sacolas)',
  'PVC': 'PVC',
  'PS': 'PS (Isopor)',
  'OUTROS_PLASTICOS': 'Outros Plásticos',
  'PAPEL_BRANCO': 'Papel Branco',
  'PAPEL_COLORIDO': 'Papel Colorido',
  'PAPELAO_ONDULADO': 'Papelão Ondulado',
  'VIDRO_TRANSPARENTE': 'Vidro Transparente',
  'VIDRO_COLORIDO': 'Vidro Colorido',
  'VIDRO_TEMPERADO': 'Vidro Temperado',
  'ALUMINIO_LATA': 'Lata de Alumínio',
  'ALUMINIO_PERFIL': 'Perfil de Alumínio',
  'ACO': 'Aço',
  'LAMINADO_CAFE': 'Laminado de Café',
  'LAMINADO_SALGADINHO': 'Laminado de Salgadinho',
  'LAMINADO_OUTROS': 'Outros Laminados',
  'REJEITO': 'Rejeito (Não Reciclável)'
};

export default function CooperativeRegisterMaterials() {
  const navigate = useNavigate();
  const { entregaId } = useParams();
  const { user } = useAuth();
  
  const [entrega, setEntrega] = useState<any>(null);
  const [cooperativaId, setCooperativaId] = useState<string>("");
  const [materiaisRegistrados, setMateriaisRegistrados] = useState<MaterialRegistrado[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
  const [subtipoSelecionado, setSubtipoSelecionado] = useState<string>("");
  const [peso, setPeso] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [salvandoAuto, setSalvandoAuto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Auto-save quando materiais mudam
  useEffect(() => {
    if (materiaisRegistrados.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setSalvandoAuto(true);
        setTimeout(() => setSalvandoAuto(false), 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [materiaisRegistrados, loading]);

  useEffect(() => {
    loadEntrega();
    loadMateriaisRegistrados();
  }, [entregaId]);

  const loadEntrega = async () => {
    try {
      // Buscar cooperativa
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .maybeSingle();

      if (coopError) throw coopError;
      if (!coopData) throw new Error("Cooperativa não encontrada");
      
      setCooperativaId(coopData.id);

      // Buscar entrega
      const { data: entregaData, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id', entregaId)
        .maybeSingle();

      if (entregaError) throw entregaError;
      if (!entregaData) throw new Error("Entrega não encontrada");
      
      setEntrega(entregaData);
    } catch (error: any) {
      toast.error("Erro ao carregar entrega", {
        description: error.message
      });
      navigate('/cooperative');
    } finally {
      setLoading(false);
    }
  };

  const loadMateriaisRegistrados = async () => {
    const { data, error } = await supabase
      .from('materiais_coletados_detalhado')
      .select('*')
      .eq('id_entrega', entregaId);

    if (!error && data) {
      setMateriaisRegistrados(data);
    }
  };

  const adicionarMaterial = async () => {
    if (!tipoSelecionado || !peso) {
      toast.error("Preencha tipo e peso");
      return;
    }

    if (tipoSelecionado !== 'Rejeito' && !subtipoSelecionado) {
      toast.error("Selecione o submaterial");
      return;
    }

    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      toast.error("Peso inválido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('materiais_coletados_detalhado')
        .insert({
          id_entrega: entregaId,
          id_cooperativa: cooperativaId,
          tipo_material: tipoSelecionado,
          subtipo_material: tipoSelecionado === 'Rejeito' ? 'REJEITO' : subtipoSelecionado,
          peso_kg: pesoNum
        })
        .select()
        .single();

      if (error) throw error;

      setMateriaisRegistrados([...materiaisRegistrados, data]);
      
      // Limpar campos
      setTipoSelecionado("");
      setSubtipoSelecionado("");
      setPeso("");
      
      toast.success("✓ Salvo", { duration: 1500 });
    } catch (error: any) {
      toast.error("Erro ao registrar", {
        description: error.message
      });
    }
  };

  const removerMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materiais_coletados_detalhado')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMateriaisRegistrados(materiaisRegistrados.filter(m => m.id !== id));
      toast.success("✓ Removido", { duration: 1500 });
    } catch (error: any) {
      toast.error("Erro ao remover", {
        description: error.message
      });
    }
  };

  const finalizarColeta = async () => {
    if (materiaisRegistrados.length === 0) {
      toast.error("Adicione pelo menos um material antes de finalizar");
      return;
    }

    setFinalizando(true);

    try {
      // Verificar se a entrega já está finalizada
      const { data: entregaAtual, error: checkError } = await supabase
        .from('entregas_reciclaveis')
        .select('status_promessa, status')
        .eq('id', entregaId)
        .single();

      if (checkError) throw checkError;

      if (entregaAtual.status_promessa === 'finalizada') {
        toast.error("Esta entrega já foi finalizada anteriormente");
        setTimeout(() => navigate('/cooperative'), 1500);
        return;
      }

      // Calcular totais
      const pesoTotal = materiaisRegistrados.reduce((sum, m) => sum + m.peso_kg, 0);
      const pesoRejeito = materiaisRegistrados
        .filter(m => m.subtipo_material === 'REJEITO')
        .reduce((sum, m) => sum + m.peso_kg, 0);
      const pesoReciclavel = pesoTotal - pesoRejeito;

      // Calcular pontos
      const { data: pontosData, error: pontosError } = await supabase
        .rpc('calcular_pontos_entrega_finalizada', { 
          p_id_entrega: entregaId 
        });

      if (pontosError) throw pontosError;
      const pontos = pontosData || 0;

      // Atualizar pontos do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('score_verde')
        .eq('id', entrega.id_usuario)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ score_verde: (profileData.score_verde || 0) + pontos })
          .eq('id', entrega.id_usuario);
      }

      // Finalizar entrega - CRÍTICO: Garantir que ambos os status sejam atualizados
      const { error: finalizarError } = await supabase
        .from('entregas_reciclaveis')
        .update({
          status_promessa: 'finalizada',
          status: 'validada',
          peso_validado: pesoReciclavel,
          peso_rejeito_kg: pesoRejeito,
          data_validacao: new Date().toISOString()
        })
        .eq('id', entregaId)
        .eq('status_promessa', 'em_coleta'); // Garantir que só atualize se estiver em_coleta

      if (finalizarError) throw finalizarError;

      // Atualizar status dos materiais do usuário
      if (entrega.itens_vinculados && entrega.itens_vinculados.length > 0) {
        await supabase
          .from('materiais_reciclaveis_usuario')
          .update({ 
            status: 'entregue',
            data_entrega: new Date().toISOString()
          })
          .in('id', entrega.itens_vinculados);
      }

      // Inserir resíduos no estoque CDV (exceto rejeito)
      const residuosParaEstoque = materiaisRegistrados
        .filter(m => m.subtipo_material !== 'REJEITO')
        .map(material => ({
          id_usuario: entrega.id_usuario,
          id_cooperativa: entrega.id_cooperativa,
          id_entrega: entregaId,
          kg: material.peso_kg,
          submaterial: material.subtipo_material,
          data_entrega: new Date().toISOString(),
          status: 'disponivel'
        }));

      if (residuosParaEstoque.length > 0) {
        await supabase
          .from('estoque_residuos')
          .insert(residuosParaEstoque);
      }

      // Criar notificação para o usuário
      await supabase
        .from('notificacoes')
        .insert({
          id_usuario: entrega.id_usuario,
          tipo: 'entrega_finalizada',
          mensagem: `Sua entrega foi processada! Peso: ${formatWeight(pesoReciclavel)} | Pontos: +${pontos}`
        });

      toast.success("Coleta finalizada com sucesso!", {
        description: `${pontos} pontos creditados ao usuário`
      });

      setTimeout(() => {
        navigate('/cooperative');
      }, 2000);

    } catch (error: any) {
      toast.error("Erro ao finalizar coleta", {
        description: error.message
      });
    } finally {
      setFinalizando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const pesoTotal = materiaisRegistrados.reduce((sum, m) => sum + m.peso_kg, 0);
  const pesoRejeito = materiaisRegistrados
    .filter(m => m.subtipo_material === 'REJEITO')
    .reduce((sum, m) => sum + m.peso_kg, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button
          onClick={() => navigate('/cooperative')}
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Registrar Materiais Coletados
              {salvandoAuto && (
                <Badge variant="outline" className="ml-auto">
                  <Save className="h-3 w-3 mr-1" />
                  Salvando...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Entrega #{entrega?.id?.slice(0, 8)} | Peso estimado: {formatWeight(entrega?.peso_estimado || 0)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alerta Informativo */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ✓ Adicione todos os materiais coletados (mesmo além dos prometidos)<br />
                ✓ Os dados são salvos automaticamente<br />
                ✓ Use "Rejeito" para materiais não recicláveis
              </AlertDescription>
            </Alert>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Registrado</p>
                  <p className="text-2xl font-bold text-primary">{formatWeight(pesoTotal)}</p>
                </CardContent>
              </Card>
              <Card className="bg-success/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Reciclável</p>
                  <p className="text-2xl font-bold text-success">{formatWeight(pesoTotal - pesoRejeito)}</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Rejeito</p>
                  <p className="text-2xl font-bold text-destructive">{formatWeight(pesoRejeito)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de Adição */}
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Material</Label>
                    <Select value={tipoSelecionado} onValueChange={(val) => {
                      setTipoSelecionado(val);
                      setSubtipoSelecionado("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(TIPOS_MATERIAL).map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                        <SelectItem value="Rejeito">Rejeito (Não Reciclável)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoSelecionado && tipoSelecionado !== 'Rejeito' && (
                    <div className="space-y-2">
                      <Label>Submaterial</Label>
                      <Select value={subtipoSelecionado} onValueChange={setSubtipoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_MATERIAL[tipoSelecionado as keyof typeof TIPOS_MATERIAL]?.map(sub => (
                            <SelectItem key={sub} value={sub}>
                              {LABELS_SUBMATERIAL[sub]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex: 1.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          adicionarMaterial();
                        }
                      }}
                    />
                  </div>
                </div>

                <Button onClick={adicionarMaterial} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Material
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Materiais */}
            {materiaisRegistrados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Materiais Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Submaterial</TableHead>
                        <TableHead className="text-right">Peso (kg)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materiaisRegistrados.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.tipo_material}</TableCell>
                          <TableCell>
                            <Badge variant={material.subtipo_material === 'REJEITO' ? 'destructive' : 'secondary'}>
                              {LABELS_SUBMATERIAL[material.subtipo_material]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatWeight(material.peso_kg)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Finalizar */}
            <Button
              onClick={finalizarColeta}
              disabled={finalizando || materiaisRegistrados.length === 0}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {finalizando ? 'Finalizando...' : 'Finalizar Coleta'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
