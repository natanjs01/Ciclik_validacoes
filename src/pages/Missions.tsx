import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Video, HelpCircle, CheckCircle, Star, Zap, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import CiclikHeader from '@/components/CiclikHeader';

const getMissionIcon = (tipo: string) => {
  switch (tipo) {
    case 'quiz':
      return <HelpCircle className="h-5 w-5 text-primary" />;
    case 'estudo':
      return <Video className="h-5 w-5 text-primary" />;
    default:
      return <Star className="h-5 w-5 text-primary" />;
  }
};

const getMissionTypeName = (tipo: string) => {
  switch (tipo) {
    case 'quiz':
      return 'Quiz';
    case 'estudo':
      return 'Vídeo Educativo';
    default:
      return tipo;
  }
};

export default function Missions() {
  const { user, profile, refreshProfile } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
    loadCompletedMissions();
  }, [user]);

  const loadMissions = async () => {
    const { data } = await supabase
      .from('missoes')
      .select('*')
      .eq('status', 'ativa')
      .order('ordem', { ascending: true });
    
    if (data) setMissions(data);
  };

  const loadCompletedMissions = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('missoes_usuarios')
      .select('id_missao')
      .eq('id_usuario', user.id);
    
    if (data) {
      setCompletedMissions(new Set(data.map(m => m.id_missao)));
    }
  };

  const handleMissionClick = (mission: any) => {
    if (completedMissions.has(mission.id)) {
      toast({
        title: 'Missão já completada',
        description: 'Você já completou esta missão!',
      });
      return;
    }

    navigate(`/mission/content/${mission.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <CiclikHeader showBackButton backTo="/user" />
      
      <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Central de Educação
          </h1>
          <p className="text-muted-foreground mt-2">Aprenda, jogue e ganhe pontos verdes</p>
        </motion.div>

        {profile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border-primary/20 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Aulas Concluídas
                    </p>
                    <p className="text-4xl font-bold text-primary">{profile.missoes_concluidas}</p>
                    <p className="text-xs text-muted-foreground">
                      {missions.length - completedMissions.size} aulas disponíveis
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Trophy className="h-16 w-16 text-primary relative animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {missions.map((mission) => {
            const isCompleted = completedMissions.has(mission.id);
            
            return (
              <Card 
                key={mission.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isCompleted ? 'opacity-60 bg-muted/50' : 'hover:scale-[1.02]'
                }`}
                onClick={() => handleMissionClick(mission)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`rounded-lg p-2 ${
                        isCompleted ? 'bg-success/20' : 'bg-primary/10'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          getMissionIcon(mission.tipo)
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {mission.titulo}
                          {isCompleted && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success">
                              Concluída
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {mission.descricao}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">
                            {getMissionTypeName(mission.tipo)}
                          </Badge>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            +{mission.pontos} pontos
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}

          {missions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma aula disponível no momento
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}