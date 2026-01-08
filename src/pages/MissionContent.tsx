import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Video, CheckCircle, XCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SocialShareButtons from '@/components/SocialShareButtons';
import { getYouTubeEmbedUrl } from '@/utils/youtube';
import CiclikHeader from '@/components/CiclikHeader';

type Step = 'video' | 'quiz' | 'review';

export default function MissionContent() {
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [mission, setMission] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('video');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [quizResults, setQuizResults] = useState<Array<{
    question: any;
    userAnswer: string;
    isCorrect: boolean;
  }>>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMissionData();
  }, [id]);

  const loadMissionData = async () => {
    const { data: missionData } = await supabase
      .from('missoes')
      .select('*')
      .eq('id', id)
      .single();

    const { data: questionsData } = await supabase
      .from('questoes_missao')
      .select('*')
      .eq('id_missao', id)
      .order('ordem', { ascending: true });

    if (missionData) setMission(missionData);
    if (questionsData) setQuestions(questionsData);
  };

  const handleNextStep = () => {
    if (currentStep === 'video') {
      setCurrentStep('quiz');
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!user || !mission) return;

    let correctCount = 0;
    const quizAnswers = [];
    const results = [];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.resposta_correta;
      if (isCorrect) correctCount++;

      results.push({
        question,
        userAnswer,
        isCorrect,
      });

      quizAnswers.push({
        id_usuario: user.id,
        id_missao: mission.id,
        id_questao: question.id,
        resposta_usuario: userAnswer,
        correta: isCorrect,
      });
    }

    const percentualAcerto = (correctCount / questions.length) * 100;
    setScore(percentualAcerto);
    setQuizResults(results);
    setCurrentStep('review');

    try {
      // Salvar respostas
      const { error: answersError } = await supabase
        .from('respostas_quiz')
        .upsert(quizAnswers, { onConflict: 'id_usuario,id_questao' });

      if (answersError) throw answersError;

    // Se acertou 80% ou mais, completar a missão e conceder créditos
    if (percentualAcerto >= 80) {
      // Conceder créditos da missão
      const { data: pontosData } = await supabase.rpc('conceder_pontos_missao', {
        p_usuario_id: user.id,
        p_missao_id: mission.id
      });

      if (pontosData?.success) {
        toast({
          title: 'Missão Concluída! 🎉',
          description: `Você ganhou +${pontosData.pontos_concedidos} pontos! Score total: ${pontosData.score_total} pontos`,
          duration: 7000
        });
      }

      // Registrar conclusão da missão
      const { error: missionError } = await supabase
        .from('missoes_usuarios')
        .insert({
          id_usuario: user.id,
          id_missao: mission.id,
          percentual_acerto: percentualAcerto,
            quiz_completo: true,
          });

        if (missionError) throw missionError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            score_verde: (profile?.score_verde || 0) + mission.pontos,
            missoes_concluidas: (profile?.missoes_concluidas || 0) + 1,
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
          title: 'Missão concluída! 🎉',
          description: `Você acertou ${percentualAcerto.toFixed(0)}% e ganhou ${mission.pontos} pontos verdes!`,
        });
      } else {
        toast({
          title: 'Quiz incompleto',
          description: `Você precisa de 80% de acertos. Você acertou ${percentualAcerto.toFixed(0)}%. Revise e tente novamente!`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!mission) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const quizProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const steps = [
    { id: 'video', label: 'Vídeo', icon: Video, completed: currentStep === 'quiz' || currentStep === 'review' },
    { id: 'quiz', label: 'Quiz', icon: CheckCircle, completed: currentStep === 'review' },
  ];

  const overallProgress = 
    currentStep === 'video' ? 50 : 
    currentStep === 'review' ? 100 : 50 + (quizProgress * 0.5);

  return (
    <div className="min-h-screen bg-background pb-20">
      <CiclikHeader showBackButton backTo="/missions" />
      
      <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.completed;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                          isCompleted && 'bg-primary border-primary text-primary-foreground',
                          isActive && !isCompleted && 'border-primary text-primary',
                          !isActive && !isCompleted && 'border-muted text-muted-foreground'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-sm font-medium',
                          isActive && 'text-primary',
                          !isActive && 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'h-0.5 flex-1 mx-2 transition-all',
                          isCompleted ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>


        {/* Vídeo */}
        {currentStep === 'video' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeo Educativo
              </CardTitle>
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
              <div className="sticky bottom-0 bg-card pt-4 pb-2 -mx-6 px-6">
                <Button onClick={handleNextStep} className="w-full" size="lg">
                  Continuar para o Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz */}
        {currentStep === 'quiz' && (
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Quiz - Questão {currentQuestionIndex + 1} de {questions.length}</CardTitle>
                <Progress value={quizProgress} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{currentQuestion.pergunta}</h3>
                    <RadioGroup
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                    >
                      <div className="space-y-3">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const optionText = currentQuestion[`alternativa_${letter.toLowerCase()}`];
                          if (!optionText) return null;

                          return (
                            <div key={letter} className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                              <RadioGroupItem value={letter} id={`${currentQuestion.id}-${letter}`} />
                              <Label htmlFor={`${currentQuestion.id}-${letter}`} className="flex-1 cursor-pointer">
                                <span className="font-semibold">{letter})</span> {optionText}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="sticky bottom-0 bg-card pt-4 pb-2 -mx-6 px-6 border-t border-border">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={!answers[currentQuestion.id]}
                      className="w-full"
                      size="lg"
                    >
                      {currentQuestionIndex < questions.length - 1 ? 'Próxima Questão' : 'Finalizar Quiz'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4 text-center">
                {score >= 80 ? (
                  <>
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Parabéns! 🎉</h2>
                      <p className="text-lg">Você acertou {score.toFixed(0)}% das questões!</p>
                      <p className="text-muted-foreground">Você ganhou {mission.pontos} pontos verdes!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-20 w-20 text-destructive mx-auto" />
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Quase lá!</h2>
                      <p className="text-lg">Você acertou {score.toFixed(0)}% das questões.</p>
                      <p className="text-muted-foreground">Você precisa de 80% para completar a missão.</p>
                      <p className="text-sm text-muted-foreground mt-2">Revise o material e tente novamente!</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revisão das Questões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quizResults.map((result, index) => {
                  const question = result.question;
                  const userAnswerText = question[`alternativa_${result.userAnswer?.toLowerCase()}`];
                  const correctAnswerText = question[`alternativa_${question.resposta_correta.toLowerCase()}`];

                  return (
                    <div 
                      key={question.id}
                      className={cn(
                        "p-4 rounded-lg border-2",
                        result.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">
                              Questão {index + 1}: {question.pergunta}
                            </h3>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Sua resposta: </span>
                                <span className={result.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                                  {result.userAnswer}) {userAnswerText}
                                </span>
                              </div>
                              
                              {!result.isCorrect && (
                                <div>
                                  <span className="font-medium">Resposta correta: </span>
                                  <span className="text-green-700 dark:text-green-400">
                                    {question.resposta_correta}) {correctAnswerText}
                                  </span>
                                </div>
                              )}

                              {question.explicacao && (
                                <div className="mt-3 p-3 bg-background rounded border">
                                  <span className="font-medium">Explicação: </span>
                                  <span className="text-muted-foreground">{question.explicacao}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {score >= 80 && mission && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <SocialShareButtons
                      shareData={{
                        type: 'missao_concluida',
                        titulo_missao: mission.titulo,
                      }}
                      nomeUsuario={profile?.nome.split(' ')[0]}
                      conquistaTitulo={mission.titulo}
                      className="mb-4"
                    />
                  </div>
                )}

                <div className="flex gap-3 sticky bottom-0 bg-card pt-4 pb-4 -mx-6 px-6 border-t border-border">
                  {score >= 80 ? (
                    <Button onClick={() => navigate('/missions')} className="flex-1" size="lg">
                      Voltar para Missões
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => navigate('/missions')} variant="outline" className="flex-1" size="lg">
                        Voltar para Missões
                      </Button>
                      <Button 
                        onClick={() => {
                          setCurrentStep('video');
                          setCurrentQuestionIndex(0);
                          setAnswers({});
                          setQuizResults([]);
                          setScore(0);
                        }} 
                        className="flex-1"
                        size="lg"
                      >
                        Tentar Novamente
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
