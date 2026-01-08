import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Users, Gift, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface ReferralSectionProps {
  codigoIndicacao: string;
  userId: string;
}

interface Indicacao {
  id: string;
  data_indicacao: string;
  pontos_primeira_missao_concedidos: boolean;
  profiles: {
    nome: string;
    email: string;
  };
}

export default function ReferralSection({ codigoIndicacao, userId }: ReferralSectionProps) {
  const { toast } = useToast();
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndicacoes();
  }, [userId]);

  const loadIndicacoes = async () => {
    const { data } = await supabase
      .from('indicacoes')
      .select(`
        id,
        data_indicacao,
        pontos_primeira_missao_concedidos,
        id_indicado
      `)
      .eq('id_indicador', userId)
      .order('data_indicacao', { ascending: false });

    if (data) {
      // Buscar nomes dos indicados
      const indicadosComNomes = await Promise.all(
        data.map(async (ind) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, email')
            .eq('id', ind.id_indicado)
            .single();
          
          return {
            ...ind,
            profiles: profile || { nome: 'Usuário', email: '' }
          };
        })
      );
      setIndicacoes(indicadosComNomes as Indicacao[]);
    }
    setLoading(false);
  };

  const shareUrl = `${window.location.origin}/auth?ref=${codigoIndicacao}`;
  const whatsappMessage = encodeURIComponent(
    `🌱 Junte-se a mim no Ciclik - Digital Verde!\n\n` +
    `Use meu código de indicação: ${codigoIndicacao}\n\n` +
    `Você ganha pontos ao se cadastrar e eu também ganho quando você completar sua primeira missão! ♻️\n\n` +
    `${shareUrl}`
  );

  const copyCodigo = () => {
    navigator.clipboard.writeText(codigoIndicacao);
    toast({
      title: 'Código copiado!',
      description: 'Seu código de indicação foi copiado',
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copiado!',
      description: 'Link de indicação copiado para área de transferência',
    });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
  };

  const totalPontosGanhos = indicacoes.reduce((total, ind) => {
    return total + 40 + (ind.pontos_primeira_missao_concedidos ? 20 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600" />
            Indique Amigos e Ganhe Pontos!
          </CardTitle>
          <CardDescription>
            Ganhe +40 pontos quando um amigo se cadastrar com seu código, e mais +20 pontos quando ele completar a primeira missão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seu Código de Indicação</Label>
            <div className="flex gap-2">
              <Input 
                value={codigoIndicacao} 
                readOnly 
                className="font-mono text-lg font-bold text-center"
              />
              <Button onClick={copyCodigo} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={shareWhatsApp} className="w-full" variant="default">
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar via WhatsApp
            </Button>
            <Button onClick={copyLink} variant="outline" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link de Indicação
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                <Users className="h-5 w-5" />
                {indicacoes.length}
              </div>
              <p className="text-xs text-muted-foreground">Amigos Indicados</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                <Gift className="h-5 w-5" />
                {totalPontosGanhos}
              </div>
              <p className="text-xs text-muted-foreground">Pontos Ganhos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {indicacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Minhas Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {indicacoes.map((indicacao) => (
                <div 
                  key={indicacao.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{indicacao.profiles.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(indicacao.data_indicacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default">+40pts</Badge>
                    {indicacao.pontos_primeira_missao_concedidos && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        +20pts
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
