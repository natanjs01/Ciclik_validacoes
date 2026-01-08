import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  table: string;
  status: 'success' | 'error' | 'notFound' | 'noPermission';
  message: string;
  count?: number;
}

export default function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [authStatus, setAuthStatus] = useState<string>('');
  const [storageInfo, setStorageInfo] = useState<string>('');
  const [connectionOk, setConnectionOk] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    const testResults: TestResult[] = [];

    // Lista de tabelas para testar (TODAS as 45 tabelas do banco)
    const tables = [
      'ajustes_pontos_manuais',
      'alertas_estoque',
      'cache_notas_fiscais',
      'cdv_certificados',
      'cdv_conciliacoes',
      'cdv_config',
      'cdv_investidores',
      'cdv_leads',
      'cdv_novo',
      'cdv_projetos',
      'cdv_quotas',
      'chatbot_conversas',
      'configuracoes_sistema',
      'cooperativas',
      'cupons',
      'cupons_resgates',
      'emails_cooperativas',
      'emails_investidores',
      'empresas',
      'entregas_reciclaveis',
      'estoque_educacao',
      'estoque_embalagens',
      'estoque_residuos',
      'impacto_bruto',
      'indicacoes',
      'kpis',
      'materiais_coletados_detalhado',
      'materiais_pontuacao',
      'materiais_reciclaveis_usuario',
      'metricas_empresas',
      'missoes',
      'missoes_usuarios',
      'notas_fiscais',
      'notas_fiscais_cooperativa',
      'notificacoes',
      'pontos_mensais_usuarios',
      'produto_embalagens',
      'produtos_ciclik',
      'profiles',
      'questoes_missao',
      'respostas_quiz',
      'saldo_parcial',
      'uib',
      'user_roles',
      'variacoes_peso_entrega'
    ];

    // Testar cada tabela
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(1);

        if (!error) {
          testResults.push({
            table,
            status: 'success',
            message: 'Acessível',
            count: count || 0
          });
          setConnectionOk(true);
        } else if (error.code === 'PGRST116') {
          testResults.push({
            table,
            status: 'notFound',
            message: 'Tabela não existe'
          });
        } else if (error.code === '42501') {
          testResults.push({
            table,
            status: 'noPermission',
            message: 'Sem permissão RLS'
          });
        } else if (error.code === 'PGRST301') {
          testResults.push({
            table,
            status: 'noPermission',
            message: 'JWT expirado ou inválido'
          });
        } else {
          testResults.push({
            table,
            status: 'error',
            message: `[${error.code}] ${error.message.substring(0, 50)}`
          });
        }
      } catch (err: any) {
        testResults.push({
          table,
          status: 'error',
          message: err.message.substring(0, 50)
        });
      }
    }

    setResults(testResults);

    // Testar autenticação
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthStatus(`✅ Autenticado como: ${session.user.email}`);
      } else {
        setAuthStatus('ℹ️ Nenhum usuário autenticado');
      }
    } catch (err: any) {
      setAuthStatus(`⚠️ Erro: ${err.message}`);
    }

    // Testar Storage
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        setStorageInfo(`⚠️ Erro ao acessar storage: ${error.message}`);
      } else if (buckets && buckets.length > 0) {
        setStorageInfo(`✅ ${buckets.length} bucket(s) configurado(s): ${buckets.map(b => b.name).join(', ')}`);
      } else {
        setStorageInfo('ℹ️ Nenhum bucket configurado');
      }
    } catch (err: any) {
      setStorageInfo(`⚠️ Erro: ${err.message}`);
    }

    setIsLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'notFound':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'noPermission':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], { variant: any; label: string }> = {
      success: { variant: 'default', label: 'Acessível' },
      notFound: { variant: 'secondary', label: 'Não existe' },
      noPermission: { variant: 'destructive', label: 'Sem permissão' },
      error: { variant: 'destructive', label: 'Erro' }
    };
    return variants[status];
  };

  const successCount = results.filter(r => r.status === 'success').length;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🧪 Teste de Conexão Supabase</h1>
        <p className="text-muted-foreground">
          Verificando conectividade e acessibilidade das tabelas do banco de dados
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg">Testando conexão com Supabase...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Status Geral */}
          <Card className={connectionOk ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connectionOk ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Conexão Estabelecida
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    Problemas na Conexão
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {successCount} de {results.length} tabelas acessíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <strong>URL:</strong>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {import.meta.env.VITE_SUPABASE_URL}
                </code>
              </div>
              <div>
                <strong>Autenticação:</strong> {authStatus}
              </div>
              <div>
                <strong>Storage:</strong> {storageInfo}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Tabelas */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Tabelas do Banco de Dados</CardTitle>
              <CardDescription>
                Status de acesso às tabelas do projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((result) => (
                  <div
                    key={result.table}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-mono font-semibold">{result.table}</div>
                        {result.count !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            {result.count} registro(s)
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusBadge(result.status).variant}>
                      {getStatusBadge(result.status).label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
