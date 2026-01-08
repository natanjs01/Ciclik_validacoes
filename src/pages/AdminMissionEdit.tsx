import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminMissionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    pontos: 0,
    valor_credito: 0,
    status: 'ativa' as string,
    video_url: '',
    ordem: 0,
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    pergunta: '',
    alternativa_a: '',
    alternativa_b: '',
    alternativa_c: '',
    alternativa_d: '',
    resposta_correta: 'A',
    explicacao: '',
    ordem: 0,
  });

  useEffect(() => {
    if (!isNew && id) {
      loadMission(id);
    }
  }, [id, isNew]);

  const loadMission = async (missionId: string) => {
    try {
      const { data: mission, error } = await supabase
        .from('missoes')
        .select('*')
        .eq('id', missionId)
        .single();

      if (error) throw error;

      if (mission) {
        setFormData({
          titulo: mission.titulo,
          descricao: mission.descricao,
          pontos: mission.pontos,
          valor_credito: mission.valor_credito || 0,
          status: mission.status || 'ativa',
          video_url: mission.video_url || '',
          ordem: mission.ordem,
        });

        // Load questions
        const { data: questionsData } = await supabase
          .from('questoes_missao')
          .select('*')
          .eq('id_missao', missionId)
          .order('ordem', { ascending: true });

        if (questionsData) {
          setQuestions(questionsData);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar missão',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/admin/missions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let missionId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from('missoes')
          .insert({ ...formData, tipo: 'educacao' })
          .select()
          .single();

        if (error) throw error;
        missionId = data.id;
      } else {
        const { error } = await supabase
          .from('missoes')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
      }

      // Save questions
      if (missionId) {
        // Delete old questions if editing
        if (!isNew) {
          await supabase
            .from('questoes_missao')
            .delete()
            .eq('id_missao', missionId);
        }

        if (questions.length > 0) {
          const questionsWithMissionId = questions.map((q, idx) => ({
            pergunta: q.pergunta,
            alternativa_a: q.alternativa_a,
            alternativa_b: q.alternativa_b,
            alternativa_c: q.alternativa_c,
            alternativa_d: q.alternativa_d,
            resposta_correta: q.resposta_correta,
            explicacao: q.explicacao,
            ordem: idx,
            id_missao: missionId,
          }));

          const { error: questionsError } = await supabase
            .from('questoes_missao')
            .insert(questionsWithMissionId);

          if (questionsError) throw questionsError;
        }
      }

      toast({ title: isNew ? 'Missão criada!' : 'Missão atualizada!' });
      navigate('/admin/missions');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.pergunta) {
      toast({ title: 'Preencha a pergunta', variant: 'destructive' });
      return;
    }
    setQuestions([...questions, { ...currentQuestion, ordem: questions.length }]);
    setCurrentQuestion({
      pergunta: '',
      alternativa_a: '',
      alternativa_b: '',
      alternativa_c: '',
      alternativa_d: '',
      resposta_correta: 'A',
      explicacao: '',
      ordem: 0,
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/missions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Nova Missão' : 'Editar Missão'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Missão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pontos">Pontos</Label>
                  <Input
                    id="pontos"
                    type="number"
                    value={formData.pontos}
                    onChange={(e) => setFormData({ ...formData, pontos: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valor_credito">Valor de Crédito (R$)</Label>
                  <Input
                    id="valor_credito"
                    type="number"
                    step="0.01"
                    value={formData.valor_credito}
                    onChange={(e) => setFormData({ ...formData, valor_credito: parseFloat(e.target.value) || 0 })}
                    placeholder="20.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Créditos concedidos ao completar esta missão
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="video_url">URL do Vídeo</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/embed/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode abrir o YouTube em outra aba para copiar o link
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questões do Quiz ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length > 0 && (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{idx + 1}. {q.pergunta}</p>
                        <p className="text-sm text-muted-foreground">Resposta: {q.resposta_correta}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label>Pergunta</Label>
                  <Input
                    value={currentQuestion.pergunta}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, pergunta: e.target.value })}
                    placeholder="Digite a pergunta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Alternativa A</Label>
                    <Input
                      value={currentQuestion.alternativa_a}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, alternativa_a: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Alternativa B</Label>
                    <Input
                      value={currentQuestion.alternativa_b}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, alternativa_b: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Alternativa C</Label>
                    <Input
                      value={currentQuestion.alternativa_c}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, alternativa_c: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Alternativa D</Label>
                    <Input
                      value={currentQuestion.alternativa_d}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, alternativa_d: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Resposta Correta</Label>
                  <Select
                    value={currentQuestion.resposta_correta}
                    onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, resposta_correta: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Explicação da Resposta (opcional)</Label>
                  <Textarea
                    value={currentQuestion.explicacao}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explicacao: e.target.value })}
                    placeholder="Explique por que esta é a resposta correta..."
                    rows={3}
                  />
                </div>

                <Button type="button" onClick={addQuestion} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Questão
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/missions')} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : (isNew ? 'Criar Missão' : 'Salvar Alterações')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
