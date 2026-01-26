/**
 * 🧪 COMPONENTE DE TESTE - API de Consulta de Produtos
 * ====================================================
 * 
 * Componente React para testar o serviço de consulta à API
 * Adicione este componente temporariamente na página AdminProductsAnalysis
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Database, Loader2, XCircle } from 'lucide-react';
import { consultarAPIProdutos, getServiceStats, clearCache, resetCircuitBreaker } from '@/services/apiConsultaService';

// GTINs de teste
const GTINS_TESTE = [
  '7896629642331',
  '618231762644',
  '7897572020634'
];

interface ResultadoTeste {
  gtin: string;
  sucesso: boolean;
  encontrado?: boolean;
  mensagem?: string;
  tempoMs: number;
  usouCache: boolean;
  erro?: string;
  dados?: any;
}

export function TesteAPIConsulta() {
  const [testando, setTestando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultados, setResultados] = useState<ResultadoTeste[]>([]);
  const [stats, setStats] = useState<any>(null);

  const executarTeste = async () => {
    setTestando(true);
    setProgresso(0);
    setResultados([]);

    // Limpar cache e circuit breaker
    clearCache();
    resetCircuitBreaker();

    const novosResultados: ResultadoTeste[] = [];

    // Teste 1: Consultas iniciais (sem cache)
    for (let i = 0; i < GTINS_TESTE.length; i++) {
      const gtin = GTINS_TESTE[i];
      const resultado = await testarConsulta(gtin, false);
      novosResultados.push(resultado);
      setResultados([...novosResultados]);
      setProgresso(((i + 1) / (GTINS_TESTE.length * 2)) * 100);

      // Aguardar 2s entre consultas
      if (i < GTINS_TESTE.length - 1) {
        await delay(2000);
      }
    }

    // Aguardar um pouco antes do teste 2
    await delay(1000);

    // Teste 2: Consultas com cache
    for (let i = 0; i < GTINS_TESTE.length; i++) {
      const gtin = GTINS_TESTE[i];
      const resultado = await testarConsulta(gtin, true);
      novosResultados.push(resultado);
      setResultados([...novosResultados]);
      setProgresso(((GTINS_TESTE.length + i + 1) / (GTINS_TESTE.length * 2)) * 100);
    }

    // Obter estatísticas finais
    setStats(getServiceStats());
    setTestando(false);
  };

  const testarConsulta = async (gtin: string, segundaRodada: boolean): Promise<ResultadoTeste> => {
    const temCache = localStorage.getItem(`ciclik_api_cache_${gtin}`) !== null;
    const inicio = Date.now();

    try {
      const resultado = await consultarAPIProdutos(gtin);
      const tempoMs = Date.now() - inicio;

      return {
        gtin,
        sucesso: true,
        encontrado: resultado.encontrado,
        mensagem: resultado.mensagem,
        tempoMs,
        usouCache: temCache && segundaRodada,
        dados: resultado
      };
    } catch (error: any) {
      const tempoMs = Date.now() - inicio;
      return {
        gtin,
        sucesso: false,
        tempoMs,
        usouCache: temCache && segundaRodada,
        erro: error.message
      };
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Calcular estatísticas dos resultados
  const calcularEstatisticas = () => {
    if (resultados.length === 0) return null;

    const sucessos = resultados.filter(r => r.sucesso).length;
    const encontrados = resultados.filter(r => r.encontrado).length;
    const comCache = resultados.filter(r => r.usouCache).length;
    const semCache = resultados.filter(r => !r.usouCache);
    const tempoMedioSemCache = semCache.length > 0
      ? semCache.reduce((acc, r) => acc + r.tempoMs, 0) / semCache.length
      : 0;
    const tempoMedioComCache = comCache > 0
      ? resultados.filter(r => r.usouCache).reduce((acc, r) => acc + r.tempoMs, 0) / comCache
      : 0;

    return {
      sucessos,
      encontrados,
      comCache,
      tempoMedioSemCache: Math.round(tempoMedioSemCache),
      tempoMedioComCache: Math.round(tempoMedioComCache),
      economia: tempoMedioSemCache > 0
        ? Math.round(((tempoMedioSemCache - tempoMedioComCache) / tempoMedioSemCache) * 100)
        : 0
    };
  };

  const estatisticas = calcularEstatisticas();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Teste do Serviço de Consulta de Produtos
        </CardTitle>
        <CardDescription>
          Testa consultas à API com cache, circuit breaker e retry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de controle */}
        <div className="flex gap-2">
          <Button
            onClick={executarTeste}
            disabled={testando}
            className="flex-1"
          >
            {testando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              '▶️ Executar Teste'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearCache();
              resetCircuitBreaker();
              setResultados([]);
              setStats(null);
            }}
            disabled={testando}
          >
            🧹 Limpar
          </Button>
        </div>

        {/* Barra de progresso */}
        {testando && (
          <div className="space-y-2">
            <Progress value={progresso} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progresso)}% concluído
            </p>
          </div>
        )}

        {/* Estatísticas gerais */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Sucessos</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {estatisticas.sucessos}/{resultados.length}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Com Cache</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {estatisticas.comCache}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Economia</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {estatisticas.economia}%
              </p>
            </div>
          </div>
        )}

        {/* Tempos médios */}
        {estatisticas && (
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Tempo médio SEM cache</p>
              <p className="text-lg font-bold">{estatisticas.tempoMedioSemCache}ms</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Tempo médio COM cache</p>
              <p className="text-lg font-bold text-green-600">{estatisticas.tempoMedioComCache}ms</p>
            </div>
          </div>
        )}

        {/* Resultados individuais */}
        {resultados.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Resultados Individuais:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultados.map((resultado, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">
                          {resultado.gtin}
                        </span>
                        {resultado.usouCache && (
                          <Badge variant="secondary" className="text-xs">
                            📦 Cache
                          </Badge>
                        )}
                      </div>
                      
                      {resultado.sucesso ? (
                        resultado.encontrado ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Produto encontrado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{resultado.mensagem}</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-1">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">{resultado.erro}</span>
                        </div>
                      )}

                      {resultado.dados?.descricao && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {resultado.dados.descricao}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {resultado.tempoMs}ms
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{idx + 1}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estatísticas do serviço */}
        {stats && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-semibold text-sm mb-2">Estatísticas do Serviço:</h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Circuit Breaker:</strong>{' '}
                {stats.circuitBreaker.isOpen ? '🚫 Aberto' : '✅ Fechado'}{' '}
                ({stats.circuitBreaker.failures} falhas)
              </p>
              <p>
                <strong>Cache:</strong> {stats.cache.total} itens{' '}
                ({stats.cache.sizeKB.toFixed(2)} KB)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
