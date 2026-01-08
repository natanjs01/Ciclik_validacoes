import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, BarChart3, LogOut, TrendingUp } from 'lucide-react';

export default function CompanyDashboard() {
  const { user, profile, signOut } = useAuth();
  const [empresa, setEmpresa] = useState<any>(null);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEmpresa();
    loadLatestMetrics();
  }, [user]);

  const loadEmpresa = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('empresas')
      .select('*, profiles:id_user (nome, cnpj)')
      .eq('id_user', user.id)
      .single();
    
    if (data) setEmpresa(data);
  };

  const loadLatestMetrics = async () => {
    if (!user) return;

    const { data: empresaData } = await supabase
      .from('empresas')
      .select('id')
      .eq('id_user', user.id)
      .single();

    if (!empresaData) return;

    const { data } = await supabase
      .from('metricas_empresas')
      .select('*')
      .eq('id_empresa', empresaData.id)
      .order('data_registro', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setLatestMetrics(data);
  };

  if (!empresa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Empresa não encontrada</CardTitle>
            <CardDescription>
              Sua conta não está vinculada a nenhuma empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.nome}</h1>
              <p className="text-sm text-muted-foreground">Painel da Empresa</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo de Empresa</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {empresa.tipo_empresa}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Verde</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestMetrics?.percentual_faturamento_verde
                  ? `${latestMetrics.percentual_faturamento_verde.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Última atualização</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Recuperação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestMetrics?.taxa_recuperacao
                  ? `${latestMetrics.taxa_recuperacao.toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Última atualização</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas e Desempenho</CardTitle>
            <CardDescription>
              Acompanhe o desempenho e evolução da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/company/metrics')}
              className="w-full sm:w-auto"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Métricas Detalhadas
            </Button>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CNPJ:</span>
              <span className="text-sm font-medium">{empresa.profiles?.cnpj || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plano Atual:</span>
              <span className="text-sm font-medium">{empresa.plano_atual || 'Não definido'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
