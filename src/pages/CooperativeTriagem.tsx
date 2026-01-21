import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  CheckCircle, 
  Edit2, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Scale,
  Package,
  User,
  Calendar,
  FileText,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatWeight, formatNumber } from '@/lib/formatters';

interface MaterialTriagem {
  id: string;
  tipo_material: string;
  subtipo_material: string;
  peso_kg: number;
  peso_original?: number; // Peso da coleta original
  foi_alterado?: boolean;
}

interface HistoricoAlteracao {
  tipo_alteracao: 'ajuste_peso' | 'remocao' | 'adicao' | 'rejeicao';
  material?: string;
  peso_anterior?: number;
  peso_novo?: number;
  motivo?: string;
}

const LABELS_SUBMATERIAL: Record<string, string> = {
  // Plásticos
  'PET': 'PET (Garrafas)',
  'PP': 'PP (Potes)',
  'PEAD': 'PEAD (Embalagens rígidas)',
  'PEBD': 'PEBD (Sacolas)',
  'PVC': 'PVC',
  'PS': 'PS (Isopor)',
  'OUTROS_PLASTICOS': 'Outros Plásticos',
  
  // Papéis
  'PAPEL_BRANCO': 'Papel Branco',
  'PAPEL_MISTO': 'Papel Misto',
  'PAPELAO': 'Papelão',
  'PAPELAO_ONDULADO': 'Papelão Ondulado',
  'JORNAL': 'Jornal',
  'REVISTA': 'Revista',
  
  // Vidros
  'VIDRO_INCOLOR': 'Vidro Incolor',
  'VIDRO_VERDE': 'Vidro Verde',
  'VIDRO_AMBAR': 'Vidro Âmbar',
  
  // Metais
  'ALUMINIO': 'Alumínio',
  'ACO': 'Aço',
  'COBRE': 'Cobre',
  'OUTROS_METAIS': 'Outros Metais',
  
  // Laminados
  'TETRAPACK': 'Tetra Pak',
  
  // Rejeito
  'REJEITO': 'Rejeito'
};

export default function CooperativeTriagem() {
  const navigate = useNavigate();
  const { entregaId } = useParams();
  const { user } = useAuth();

  const [entrega, setEntrega] = useState<any>(null);
  const [materiais, setMateriais] = useState<MaterialTriagem[]>([]);
  const [materiaisOriginais, setMateriaisOriginais] = useState<MaterialTriagem[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pesoEdit, setPesoEdit] = useState('');
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [historicoAlteracoes, setHistoricoAlteracoes] = useState<HistoricoAlteracao[]>([]);

  useEffect(() => {
    loadDados();
  }, [entregaId]);

  const loadDados = async () => {
    try {
      setLoading(true);

      // Carregar entrega (sem join com profiles para evitar erro 400)
      const { data: entregaData, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id', entregaId)
        .single();

      if (entregaError) {
        console.error('Erro ao buscar entrega:', entregaError);
        throw new Error(`Erro ao buscar entrega: ${entregaError.message}`);
      }
      
      if (!entregaData) {
        throw new Error('Entrega não encontrada');
      }

      // Buscar dados do usuário separadamente
      if (entregaData.id_usuario) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('nome, cpf, cnpj')
          .eq('id', entregaData.id_usuario)
          .single();
        
        if (userData) {
          entregaData.profiles = userData;
        }
      }

      // Verificar se está em triagem
      if (entregaData.status_promessa !== 'em_triagem') {
        toast.error('Esta entrega não está em triagem');
        navigate('/cooperative');
        return;
      }

      setEntrega(entregaData);
      setObservacoes(entregaData.observacoes_triagem || '');

      // Carregar materiais coletados
      const { data: materiaisData, error: materiaisError } = await supabase
        .from('materiais_coletados_detalhado')
        .select('*')
        .eq('id_entrega', entregaId)
        .order('created_at', { ascending: true });

      if (materiaisError) throw materiaisError;

      const materiaisComOriginal = (materiaisData || []).map(m => ({
        ...m,
        peso_original: m.peso_kg,
        foi_alterado: false
      }));

      setMateriais(materiaisComOriginal);
      setMateriaisOriginais(JSON.parse(JSON.stringify(materiaisComOriginal)));

      // Atualizar data_inicio_triagem se for a primeira vez
      if (!entregaData.data_inicio_triagem) {
        await supabase
          .from('entregas_reciclaveis')
          .update({ data_inicio_triagem: new Date().toISOString() })
          .eq('id', entregaId);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da triagem', {
        description: error.message
      });
      navigate('/cooperative');
    } finally {
      setLoading(false);
    }
  };

  const getEntregadorInfo = () => {
    if (!entrega?.profiles?.nome) return 'Entregador não identificado';

    const documento = entrega.profiles.cpf || entrega.profiles.cnpj;
    if (!documento) return 'Entregador não identificado';

    const documentoLimpo = documento.replace(/\D/g, '');
    const isCNPJ = documentoLimpo.length === 14;
    const tresPrimeirosDigitos = documentoLimpo.substring(0, 3);

    if (isCNPJ) {
      return `${tresPrimeirosDigitos} - ${entrega.profiles.nome}`;
    } else {
      const primeiroNome = entrega.profiles.nome.split(' ')[0];
      return `${tresPrimeirosDigitos} - ${primeiroNome}`;
    }
  };

  const iniciarEdicao = (material: MaterialTriagem) => {
    setEditandoId(material.id);
    setPesoEdit(material.peso_kg.toString());
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setPesoEdit('');
  };

  const salvarEdicao = async (materialId: string) => {
    const pesoNum = parseFloat(pesoEdit);

    if (isNaN(pesoNum) || pesoNum < 0) {
      toast.error('Peso inválido');
      return;
    }

    const material = materiais.find(m => m.id === materialId);
    if (!material) return;

    const pesoAnterior = material.peso_kg;

    // Atualizar localmente
    setMateriais(prev => prev.map(m => 
      m.id === materialId 
        ? { ...m, peso_kg: pesoNum, foi_alterado: pesoNum !== m.peso_original }
        : m
    ));

    // Registrar alteração no histórico
    if (pesoNum !== pesoAnterior) {
      setHistoricoAlteracoes(prev => [...prev, {
        tipo_alteracao: 'ajuste_peso',
        material: `${material.tipo_material} - ${LABELS_SUBMATERIAL[material.subtipo_material]}`,
        peso_anterior: pesoAnterior,
        peso_novo: pesoNum
      }]);
    }

    setEditandoId(null);
    setPesoEdit('');
    toast.success('Peso atualizado');
  };

  const removerMaterial = (materialId: string) => {
    const material = materiais.find(m => m.id === materialId);
    if (!material) return;

    setMateriais(prev => prev.filter(m => m.id !== materialId));
    
    setHistoricoAlteracoes(prev => [...prev, {
      tipo_alteracao: 'remocao',
      material: `${material.tipo_material} - ${LABELS_SUBMATERIAL[material.subtipo_material]}`,
      peso_anterior: material.peso_kg
    }]);

    toast.success('Material removido');
  };

  const calcularResumo = () => {
    const pesoColeta = materiaisOriginais.reduce((acc, m) => acc + m.peso_kg, 0);
    const pesoTriagem = materiais.reduce((acc, m) => acc + m.peso_kg, 0);
    const diferenca = pesoTriagem - pesoColeta;
    const materiaisAlterados = materiais.filter(m => m.foi_alterado).length;
    const materiaisRemovidos = materiaisOriginais.length - materiais.length;

    return {
      pesoColeta,
      pesoTriagem,
      diferenca,
      materiaisAlterados,
      materiaisRemovidos,
      temDiferencas: materiaisAlterados > 0 || materiaisRemovidos > 0
    };
  };

  const finalizarTriagem = async () => {
    try {
      setFinalizando(true);

      const resumo = calcularResumo();

      // 1. Atualizar todos os materiais no banco
      for (const material of materiais) {
        await supabase
          .from('materiais_coletados_detalhado')
          .update({ peso_kg: material.peso_kg })
          .eq('id', material.id);
      }

      // 2. Deletar materiais removidos
      const materiaisRemovidos = materiaisOriginais.filter(
        original => !materiais.find(m => m.id === original.id)
      );

      for (const material of materiaisRemovidos) {
        await supabase
          .from('materiais_coletados_detalhado')
          .delete()
          .eq('id', material.id);
      }

      // 3. Registrar histórico de alterações
      if (historicoAlteracoes.length > 0) {
        const alteracoesParaSalvar = historicoAlteracoes.map(alt => ({
          id_entrega: entregaId,
          tipo_alteracao: alt.tipo_alteracao,
          peso_anterior: alt.peso_anterior,
          peso_novo: alt.peso_novo,
          motivo: `${alt.material}${alt.motivo ? ': ' + alt.motivo : ''}`,
          realizado_por: user?.id
        }));

        await supabase
          .from('triagem_alteracoes')
          .insert(alteracoesParaSalvar);
      }

      // 4. Atualizar status da entrega para finalizada
      // CRÍTICO: status: 'validada' aciona o trigger que calcula e credita pontos automaticamente
      const { error: updateError } = await supabase
        .from('entregas_reciclaveis')
        .update({
          status: 'validada',  // ✅ Aciona trigger_calcular_pontos_entrega
          status_promessa: 'finalizada',
          peso_validado: resumo.pesoTriagem,
          observacoes_triagem: observacoes,
          data_validacao: new Date().toISOString()
        })
        .eq('id', entregaId);

      if (updateError) throw updateError;

      // Criar notificação para o usuário sobre os pontos creditados
      await supabase
        .from('notificacoes')
        .insert({
          id_usuario: entrega.id_usuario,
          tipo: 'entrega_validada',
          mensagem: `🎉 Entrega validada! Peso: ${formatWeight(resumo.pesoTriagem)} | Pontos creditados automaticamente`
        });

      toast.success('Triagem finalizada com sucesso!', {
        description: `Peso validado: ${formatWeight(resumo.pesoTriagem)} | Pontos creditados ao usuário`
      });

      navigate('/cooperative');

    } catch (error: any) {
      console.error('Erro ao finalizar triagem:', error);
      toast.error('Erro ao finalizar triagem', {
        description: error.message
      });
    } finally {
      setFinalizando(false);
      setShowFinalizarDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando dados da triagem...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Proteção adicional: se entrega não foi carregada
  if (!entrega) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive font-medium mb-2">Entrega não encontrada</p>
              <p className="text-muted-foreground mb-4">Não foi possível carregar os dados da entrega.</p>
              <Button onClick={() => navigate('/cooperative')}>
                Voltar para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resumo = calcularResumo();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cooperative')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scale className="h-6 w-6 text-purple-500" />
                Triagem e Conferência
              </h1>
              <p className="text-sm text-muted-foreground">
                Validação final dos materiais coletados
              </p>
            </div>
          </div>
          <Badge className="bg-purple-500 text-white">Em Triagem</Badge>
        </div>

        {/* Info da Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações da Entrega</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Entregador</p>
                <p className="font-medium">{getEntregadorInfo()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data da Coleta</p>
                <p className="font-medium">
                  {new Date(entrega.data_recebimento).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">ID da Entrega</p>
                <p className="font-mono text-sm">{entregaId?.slice(0, 8)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Diferenças */}
        {resumo.temDiferencas && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription>
              <strong>Diferenças detectadas:</strong>
              {resumo.materiaisAlterados > 0 && ` ${resumo.materiaisAlterados} material(is) ajustado(s)`}
              {resumo.materiaisRemovidos > 0 && ` • ${resumo.materiaisRemovidos} material(is) removido(s)`}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela de Materiais */}
        <Card>
          <CardHeader>
            <CardTitle>Materiais Registrados</CardTitle>
            <CardDescription>
              Confira e ajuste as quantidades se necessário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Subtipo</TableHead>
                  <TableHead>Peso Coleta</TableHead>
                  <TableHead>Peso Triagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum material registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  materiais.map((material) => (
                    <TableRow key={material.id} className={material.foi_alterado ? 'bg-warning/5' : ''}>
                      <TableCell className="font-medium">
                        {material.tipo_material}
                        {material.foi_alterado && (
                          <Badge variant="outline" className="ml-2 text-xs">Ajustado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{LABELS_SUBMATERIAL[material.subtipo_material]}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatWeight(material.peso_original || 0)}
                      </TableCell>
                      <TableCell>
                        {editandoId === material.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pesoEdit}
                              onChange={(e) => setPesoEdit(e.target.value)}
                              className="w-24"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') salvarEdicao(material.id);
                                if (e.key === 'Escape') cancelarEdicao();
                              }}
                            />
                            <span className="text-sm text-muted-foreground">kg</span>
                          </div>
                        ) : (
                          <span className={material.foi_alterado ? 'font-bold text-warning' : ''}>
                            {formatWeight(material.peso_kg)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editandoId === material.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => salvarEdicao(material.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelarEdicao}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => iniciarEdicao(material)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removerMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Resumo da Triagem
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Peso Total Coleta</p>
              <p className="text-2xl font-bold">{formatWeight(resumo.pesoColeta)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peso Total Triagem</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatWeight(resumo.pesoTriagem)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diferença</p>
              <p className={`text-2xl font-bold ${
                resumo.diferenca < 0 ? 'text-destructive' : 
                resumo.diferenca > 0 ? 'text-success' : 
                'text-muted-foreground'
              }`}>
                {resumo.diferenca > 0 ? '+' : ''}{formatWeight(Math.abs(resumo.diferenca))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações da Triagem</CardTitle>
            <CardDescription>
              Registre aqui qualquer observação importante sobre a triagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Material PET estava contaminado com resíduos, Papelão estava úmido, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Ações Finais */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/cooperative')}
                disabled={finalizando}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                size="lg"
                onClick={() => setShowFinalizarDialog(true)}
                disabled={finalizando || materiais.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Finalizar Triagem
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showFinalizarDialog} onOpenChange={setShowFinalizarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Finalização da Triagem</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Você está prestes a finalizar a triagem desta entrega.</p>
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <p><strong>Peso Final:</strong> {formatWeight(resumo.pesoTriagem)}</p>
                  {resumo.temDiferencas && (
                    <>
                      <p><strong>Diferença:</strong> {formatWeight(Math.abs(resumo.diferenca))}</p>
                      <p><strong>Materiais Ajustados:</strong> {resumo.materiaisAlterados}</p>
                      <p><strong>Materiais Removidos:</strong> {resumo.materiaisRemovidos}</p>
                    </>
                  )}
                </div>
                <p className="text-warning font-medium">
                  Esta ação não poderá ser desfeita e a entrega será marcada como finalizada.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={finalizarTriagem}
              disabled={finalizando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {finalizando ? 'Finalizando...' : 'Confirmar Finalização'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
