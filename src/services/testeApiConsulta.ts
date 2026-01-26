/**
 * 🧪 SCRIPT DE TESTE - API de Consulta de Produtos
 * ================================================
 * 
 * Este script testa o serviço de consulta à API com os GTINs fornecidos.
 * 
 * Como usar:
 * 1. Abra o console do navegador na página admin/products/analysis
 * 2. Cole este código no console
 * 3. Execute: testarAPIConsulta()
 */

import { consultarAPIProdutos, getServiceStats, clearCache, resetCircuitBreaker } from './apiConsultaService';

// GTINs de teste fornecidos
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
}

/**
 * 🧪 Executar bateria de testes
 */
export async function testarAPIConsulta() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE DO SERVIÇO DE CONSULTA DE PRODUTOS');
  console.log('🧪 ========================================\n');

  // Limpar cache e circuit breaker para teste limpo
  console.log('🧹 Limpando cache e resetando circuit breaker...');
  clearCache();
  resetCircuitBreaker();
  console.log('✅ Ambiente limpo para teste\n');

  const resultados: ResultadoTeste[] = [];

  // TESTE 1: Consultas iniciais (sem cache)
  console.log('📋 TESTE 1: Consultas Iniciais (Sem Cache)');
  console.log('==========================================\n');

  for (const gtin of GTINS_TESTE) {
    const resultado = await testarConsulta(gtin, 1);
    resultados.push(resultado);
    
    // Aguardar 2s entre consultas (como na aplicação real)
    if (GTINS_TESTE.indexOf(gtin) < GTINS_TESTE.length - 1) {
      console.log('⏳ Aguardando 2s antes da próxima consulta...\n');
      await delay(2000);
    }
  }

  // TESTE 2: Consultas com cache (repetir mesmos GTINs)
  console.log('\n📋 TESTE 2: Consultas com Cache (Repetição)');
  console.log('==========================================\n');

  for (const gtin of GTINS_TESTE) {
    const resultado = await testarConsulta(gtin, 2);
    resultados.push(resultado);
  }

  // TESTE 3: Estatísticas do serviço
  console.log('\n📊 TESTE 3: Estatísticas do Serviço');
  console.log('===================================\n');
  
  const stats = getServiceStats();
  console.log('Circuit Breaker:', stats.circuitBreaker);
  console.log('Cache:', stats.cache);

  // Relatório final
  console.log('\n📊 ========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('📊 ========================================\n');

  imprimirRelatorio(resultados);

  return resultados;
}

/**
 * 🔍 Testar consulta individual
 */
async function testarConsulta(gtin: string, rodada: number): Promise<ResultadoTeste> {
  console.log(`🔍 Testando GTIN: ${gtin} (Rodada ${rodada})`);
  
  const inicio = Date.now();
  let usouCache = false;
  
  try {
    // Verificar se tem cache antes
    const temCache = localStorage.getItem(`ciclik_api_cache_${gtin}`) !== null;
    if (temCache) {
      console.log('   📦 Cache disponível');
      usouCache = true;
    }

    const resultado = await consultarAPIProdutos(gtin);
    const tempoMs = Date.now() - inicio;

    if (resultado.encontrado) {
      console.log(`   ✅ Produto encontrado em ${tempoMs}ms`);
      console.log(`   📝 ${resultado.descricao || 'Sem descrição'}`);
      console.log(`   🏷️  Marca: ${resultado.marca || 'N/A'}`);
    } else {
      console.log(`   ⚠️  Produto não encontrado em ${tempoMs}ms`);
      console.log(`   💬 ${resultado.mensagem}`);
    }

    return {
      gtin,
      sucesso: true,
      encontrado: resultado.encontrado,
      mensagem: resultado.mensagem,
      tempoMs,
      usouCache
    };

  } catch (error: any) {
    const tempoMs = Date.now() - inicio;
    console.error(`   ❌ Erro após ${tempoMs}ms:`, error.message);
    
    return {
      gtin,
      sucesso: false,
      tempoMs,
      usouCache,
      erro: error.message
    };
  }
}

/**
 * 📊 Imprimir relatório formatado
 */
function imprimirRelatorio(resultados: ResultadoTeste[]) {
  const sucessos = resultados.filter(r => r.sucesso).length;
  const falhas = resultados.filter(r => !r.sucesso).length;
  const encontrados = resultados.filter(r => r.encontrado).length;
  const comCache = resultados.filter(r => r.usouCache).length;
  
  const tempoTotal = resultados.reduce((acc, r) => acc + r.tempoMs, 0);
  const tempoMedio = tempoTotal / resultados.length;
  const tempoSemCache = resultados
    .filter(r => !r.usouCache)
    .reduce((acc, r, _, arr) => acc + r.tempoMs / arr.length, 0);
  const tempoComCache = resultados
    .filter(r => r.usouCache)
    .reduce((acc, r, _, arr) => acc + r.tempoMs / (arr.length || 1), 0);

  console.log(`Total de testes: ${resultados.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📦 Produtos encontrados: ${encontrados}`);
  console.log(`💾 Consultas com cache: ${comCache}`);
  console.log('');
  console.log(`⏱️  Tempo total: ${tempoTotal}ms`);
  console.log(`⏱️  Tempo médio: ${Math.round(tempoMedio)}ms`);
  console.log(`⏱️  Tempo médio SEM cache: ${Math.round(tempoSemCache)}ms`);
  console.log(`⏱️  Tempo médio COM cache: ${Math.round(tempoComCache)}ms`);
  console.log('');
  
  // Economia de tempo com cache
  if (comCache > 0) {
    const economia = ((tempoSemCache - tempoComCache) / tempoSemCache) * 100;
    console.log(`💰 Economia com cache: ${Math.round(economia)}%`);
  }

  console.log('\n📋 Detalhes por GTIN:');
  console.log('─────────────────────────────────────────');
  
  // Agrupar por GTIN
  const porGtin: { [key: string]: ResultadoTeste[] } = {};
  resultados.forEach(r => {
    if (!porGtin[r.gtin]) porGtin[r.gtin] = [];
    porGtin[r.gtin].push(r);
  });

  Object.keys(porGtin).forEach(gtin => {
    const testes = porGtin[gtin];
    console.log(`\n📦 GTIN: ${gtin}`);
    testes.forEach((teste, idx) => {
      const rodada = idx + 1;
      const status = teste.sucesso ? '✅' : '❌';
      const cache = teste.usouCache ? '(cache)' : '(API)';
      console.log(`   ${status} Rodada ${rodada}: ${teste.tempoMs}ms ${cache}`);
      if (teste.encontrado !== undefined) {
        console.log(`      ${teste.encontrado ? '📦 Encontrado' : '⚠️  Não encontrado'}`);
      }
      if (teste.erro) {
        console.log(`      💬 Erro: ${teste.erro}`);
      } else if (teste.mensagem) {
        console.log(`      💬 ${teste.mensagem}`);
      }
    });
  });

  console.log('\n🎉 ========================================');
  console.log('🎉 TESTE CONCLUÍDO!');
  console.log('🎉 ========================================');
}

/**
 * ⏱️ Helper para delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🧪 Teste rápido de um único GTIN
 */
export async function testarUmGTIN(gtin: string) {
  console.log(`🧪 Testando GTIN único: ${gtin}\n`);
  
  const inicio = Date.now();
  const resultado = await consultarAPIProdutos(gtin);
  const tempo = Date.now() - inicio;

  console.log('Resultado:');
  console.log('─────────────────────────────');
  console.log(`GTIN: ${resultado.ean_gtin}`);
  console.log(`Encontrado: ${resultado.encontrado ? '✅ Sim' : '❌ Não'}`);
  console.log(`Tempo: ${tempo}ms`);
  
  if (resultado.encontrado) {
    console.log(`\nDados do Produto:`);
    console.log(`Descrição: ${resultado.descricao || 'N/A'}`);
    console.log(`Marca: ${resultado.marca || 'N/A'}`);
    console.log(`Fabricante: ${resultado.fabricante || 'N/A'}`);
    console.log(`NCM: ${resultado.ncm || 'N/A'}`);
    console.log(`Categoria: ${resultado.categoria_api || 'N/A'}`);
    console.log(`Preço médio: ${resultado.preco_medio ? `R$ ${resultado.preco_medio.toFixed(2)}` : 'N/A'}`);
  } else {
    console.log(`\nMensagem: ${resultado.mensagem}`);
  }

  console.log('\n─────────────────────────────');
  
  return resultado;
}

/**
 * 🧹 Limpar tudo e começar do zero
 */
export function limparTudo() {
  console.log('🧹 Limpando cache e resetando circuit breaker...');
  clearCache();
  resetCircuitBreaker();
  console.log('✅ Tudo limpo! Pronto para novos testes.');
}

// Exportar para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).testarAPIConsulta = testarAPIConsulta;
  (window as any).testarUmGTIN = testarUmGTIN;
  (window as any).limparTudo = limparTudo;
  
  console.log('🧪 Funções de teste disponíveis:');
  console.log('   - testarAPIConsulta()    → Bateria completa de testes');
  console.log('   - testarUmGTIN(gtin)     → Testar um GTIN específico');
  console.log('   - limparTudo()           → Limpar cache e circuit breaker');
}
