/**
 * 🧪 TESTE STANDALONE - API de Consulta de Produtos
 * ==================================================
 * 
 * Script Node.js para testar a API diretamente
 * 
 * Como executar:
 * node teste-api-standalone.js
 */

// GTINs de teste
const GTINS_TESTE = [
  '7896629642331',
  '618231762644',
  '7897572020634'
];

const API_URL = 'https://ciclik-api-produtos.onrender.com';
const API_TOKEN = 'ciclik_secret_token_2026';
const TIMEOUT_MS = 30000;

async function testarAPI() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE STANDALONE - API DE PRODUTOS');
  console.log('🧪 ========================================\n');

  const resultados = [];

  for (let i = 0; i < GTINS_TESTE.length; i++) {
    const gtin = GTINS_TESTE[i];
    console.log(`\n📦 Testando GTIN ${i + 1}/${GTINS_TESTE.length}: ${gtin}`);
    console.log('─────────────────────────────────────────');

    const resultado = await consultarGTIN(gtin);
    resultados.push(resultado);

    // Aguardar 2s entre consultas
    if (i < GTINS_TESTE.length - 1) {
      console.log('⏳ Aguardando 2s antes da próxima consulta...');
      await delay(2000);
    }
  }

  // Relatório final
  console.log('\n\n📊 ========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('📊 ========================================\n');

  const sucessos = resultados.filter(r => r.sucesso).length;
  const encontrados = resultados.filter(r => r.encontrado).length;
  const tempoTotal = resultados.reduce((acc, r) => acc + r.tempoMs, 0);
  const tempoMedio = Math.round(tempoTotal / resultados.length);

  console.log(`Total de testes: ${resultados.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${resultados.length - sucessos}`);
  console.log(`📦 Produtos encontrados: ${encontrados}`);
  console.log(`⏱️  Tempo total: ${tempoTotal}ms`);
  console.log(`⏱️  Tempo médio: ${tempoMedio}ms`);

  console.log('\n📋 Detalhes:');
  console.log('─────────────────────────────────────────');
  resultados.forEach((r, idx) => {
    console.log(`\n${idx + 1}. GTIN: ${r.gtin}`);
    console.log(`   Status: ${r.sucesso ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`   Tempo: ${r.tempoMs}ms`);
    if (r.encontrado !== undefined) {
      console.log(`   Encontrado: ${r.encontrado ? '✅ Sim' : '⚠️  Não'}`);
    }
    if (r.descricao) {
      console.log(`   Descrição: ${r.descricao}`);
    }
    if (r.marca) {
      console.log(`   Marca: ${r.marca}`);
    }
    if (r.mensagem) {
      console.log(`   Mensagem: ${r.mensagem}`);
    }
    if (r.erro) {
      console.log(`   Erro: ${r.erro}`);
    }
  });

  console.log('\n🎉 ========================================');
  console.log('🎉 TESTE CONCLUÍDO!');
  console.log('🎉 ========================================\n');
}

async function consultarGTIN(gtin) {
  const inicio = Date.now();

  try {
    // Normalizar GTIN (converter UPC de 12 dígitos para EAN-13)
    const gtinNormalizado = normalizarGTIN(gtin);
    if (gtinNormalizado !== gtin) {
      console.log(`� Convertendo UPC → EAN-13: ${gtin} → ${gtinNormalizado}`);
    }

    console.log(`�🔍 Consultando API...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${API_URL}/api/produtos/${gtinNormalizado}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const tempoMs = Date.now() - inicio;

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️  Produto não encontrado (${tempoMs}ms)`);
        return {
          gtin,
          sucesso: true,
          encontrado: false,
          tempoMs,
          mensagem: 'Produto não encontrado na base de dados'
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const dados = await response.json();
    console.log(`✅ Sucesso (${tempoMs}ms)`);

    if (dados.encontrado) {
      console.log(`   📝 ${dados.descricao || 'Sem descrição'}`);
      console.log(`   🏷️  Marca: ${dados.marca || 'N/A'}`);
    }

    return {
      gtin,
      sucesso: true,
      encontrado: dados.encontrado,
      tempoMs,
      descricao: dados.descricao,
      marca: dados.marca,
      fabricante: dados.fabricante,
      mensagem: dados.mensagem
    };

  } catch (error) {
    const tempoMs = Date.now() - inicio;
    console.error(`❌ Erro (${tempoMs}ms):`, error.message);

    return {
      gtin,
      sucesso: false,
      tempoMs,
      erro: error.message
    };
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizarGTIN(gtin) {
  // Remove espaços e caracteres especiais
  const gtinLimpo = gtin.replace(/[^0-9]/g, '');
  
  // Converter UPC (12 dígitos) para EAN-13 (adiciona 0 no início)
  if (gtinLimpo.length === 12) {
    return '0' + gtinLimpo;
  }
  
  return gtinLimpo;
}

// Executar teste
testarAPI().catch(console.error);
