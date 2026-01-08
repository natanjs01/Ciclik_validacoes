import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MissionQuiz() {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [mission, setMission] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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

  const handleSubmit = async () => {
    if (!selectedAnswer || !mission) return;

    const correct = selectedAnswer === mission.resposta_correta;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      try {
        const { error: missionError } = await supabase
          .from('missoes_usuarios')
          .insert({
            id_usuario: user?.id,
            id_missao: mission.id
          });

        if (missionError) throw missionError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            score_verde: (profile?.score_verde || 0) + mission.pontos,
            missoes_concluidas: (profile?.missoes_concluidas || 0) + 1
          })
          .eq('id', user?.id);

        if (profileError) throw profileError;

        await refreshProfile();

        toast({
          title: 'Resposta correta!',
          description: `Você ganhou ${mission.pontos} pontos verdes!`,
        });

        setTimeout(() => navigate('/missions'), 2000);
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Resposta incorreta',
        description: 'Tente novamente!',
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
            <CardTitle>{mission.pergunta}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const optionText = mission[`alternativa_${letter.toLowerCase()}`];
                  if (!optionText) return null;

                  return (
                    <div key={letter} className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value={letter} id={letter} />
                      <Label htmlFor={letter} className="flex-1 cursor-pointer">
                        <span className="font-semibold">{letter})</span> {optionText}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {showResult && (
              <Card className={isCorrect ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-success" />
                        <div>
                          <p className="font-semibold text-success">Correto!</p>
                          <p className="text-sm text-muted-foreground">
                            Parabéns! Você ganhou {mission.pontos} pontos.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-destructive" />
                        <div>
                          <p className="font-semibold text-destructive">Incorreto</p>
                          <p className="text-sm text-muted-foreground">
                            A resposta correta é: {mission.resposta_correta}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={!selectedAnswer || showResult}
            >
              Confirmar Resposta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}