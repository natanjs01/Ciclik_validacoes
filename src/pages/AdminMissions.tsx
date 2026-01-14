import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, FileText, Video, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminMissions() {
  const [missions, setMissions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    const { data } = await supabase
      .from('missoes')
      .select('*, questoes_missao(*)')
      .order('ordem', { ascending: true });
    
    if (data) setMissions(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return;

    try {
      const { error } = await supabase
        .from('missoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Missão excluída!' });
      loadMissions();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">Gerenciar Missões Educacionais</h1>
          </div>
          
          <Button onClick={() => navigate('/admin/missions/edit/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Missão
          </Button>
        </div>

        <div className="grid gap-4">
          {missions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Nenhuma missão cadastrada</p>
              </CardContent>
            </Card>
          ) : (
            missions.map((mission) => (
              <Card key={mission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{mission.titulo}</CardTitle>
                        <Badge variant={mission.status === 'ativa' ? 'default' : 'secondary'}>
                          {mission.status}
                        </Badge>
                      </div>
                      <CardDescription>{mission.descricao}</CardDescription>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {mission.apostila_pdf_url ? 'Com apostila' : 'Sem apostila'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          {mission.video_url ? 'Com vídeo' : 'Sem vídeo'}
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-4 w-4" />
                          {mission.questoes_missao?.length || 0} questões
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/missions/edit/${mission.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(mission.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span>Ordem: {mission.ordem}</span>
                    <span>{mission.pontos} pontos</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
