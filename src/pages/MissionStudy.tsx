import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getYouTubeEmbedUrl } from '@/utils/youtube';

export default function MissionStudy() {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [mission, setMission] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMission();
  }, [id]);

  const loadMission = async () => {
    const { data } = await supabase
      .from('missoes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) setMission(data);
  };

  const completeMission = async () => {
    if (!user || !mission) return;

    try {
      // Create mission completion
      const { error: missionError } = await supabase
        .from('missoes_usuarios')
        .insert({
          id_usuario: user.id,
          id_missao: mission.id
        });

      if (missionError) throw missionError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          score_verde: (profile?.score_verde || 0) + mission.pontos,
          missoes_concluidas: (profile?.missoes_concluidas || 0) + 1
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Register education hours in CDV stock
      const { error: estoqueError } = await supabase
        .from('estoque_educacao')
        .insert({
          id_usuario: user.id,
          id_missao: mission.id,
          minutos_assistidos: mission.duracao_minutos || 10,
          modulo: mission.titulo,
          data: new Date().toISOString(),
          status: 'disponivel'
        });

      if (estoqueError) {
        console.error('Erro ao registrar educação no estoque CDV:', estoqueError);
      }

      await refreshProfile();

      toast({
        title: 'Missão concluída!',
        description: `Você ganhou ${mission.pontos} pontos verdes!`,
      });

      navigate('/missions');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível concluir a missão',
        variant: 'destructive',
      });
    }
  };

  if (!mission) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/missions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{mission.titulo}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assista ao vídeo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {mission.video_url ? (
                <iframe
                  src={getYouTubeEmbedUrl(mission.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={mission.titulo}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Vídeo não disponível</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">{mission.descricao}</p>
              
              <Button onClick={completeMission} className="w-full" size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Concluir Missão (+{mission.pontos} pontos)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}