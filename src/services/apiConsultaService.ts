/**
 * 🔌 SERVIÇO APRIMORADO DE CONSULTA À API DE PRODUTOS
 * ====================================================
 * 
 * Melhorias implementadas:
 * - ✅ Cache local (24h) para evitar consultas repetidas
 * - ✅ Circuit Breaker para proteger contra APIs indisponíveis
 * - ✅ Retry automático com backoff
 * - ✅ Timeout reduzido e configurável
 * - ✅ Tratamento robusto de erros de rede
 * - ✅ Logs detalhados para debugging
 */

// ⚙️ Configurações da API
export const API_CONFIG = {
  URL: 'https://ciclik-api-produtos.onrender.com',
  TOKEN: 'ciclik_secret_token_2026',
  TIMEOUT_MS: 30000, // 30s (reduzido - se não responder em 30s, está com problema)
  MAX_RETRIES: 1, // Apenas 1 retry (reduzido para evitar espera excessiva)
  RETRY_DELAY_MS: 3000, // 3s entre tentativas
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24h de cache
  CIRCUIT_BREAKER_THRESHOLD: 3, // Após 3 falhas consecutivas, para temporariamente
  CIRCUIT_BREAKER_TIMEOUT_MS: 60000, // 1 minuto de pausa após circuit breaker
};

// Interface para resposta da API
export interface DadosAPIOnRender {
  ean_gtin: string;
  descricao?: string;
  marca?: string;
  fabricante?: string;
  ncm?: string;
  ncm_descricao?: string;
  preco_minimo?: number;
  preco_maximo?: number;
  preco_medio?: number;
  peso_liquido?: number;
  peso_bruto?: number;
  categoria_api?: string;
  imagem_url?: string;
  encontrado: boolean;
  mensagem?: string;
}

// 🧠 Circuit Breaker State
class CircuitBreaker {
  private failures = 0;
  private isOpen = false;
  private openedAt = 0;

  reset() {
    this.failures = 0;
    this.isOpen = false;
    this.openedAt = 0;
    console.log('✅ Circuit Breaker resetado');
  }

  recordSuccess() {
    if (this.failures > 0) {
      console.log(`✅ Sucesso após ${this.failures} falhas - resetando contador`);
    }
    this.failures = 0;
  }

  recordFailure() {
    this.failures++;
    console.warn(`⚠️ Falha registrada (${this.failures}/${API_CONFIG.CIRCUIT_BREAKER_THRESHOLD})`);
    
    if (this.failures >= API_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      this.isOpen = true;
      this.openedAt = Date.now();
      console.error('🚫 CIRCUIT BREAKER ATIVADO: API com muitas falhas consecutivas');
    }
  }

  canAttempt(): { allowed: boolean; waitTime?: number } {
    if (!this.isOpen) {
      return { allowed: true };
    }
    
    // Verifica se já passou o tempo de timeout
    const elapsed = Date.now() - this.openedAt;
    if (elapsed >= API_CONFIG.CIRCUIT_BREAKER_TIMEOUT_MS) {
      console.log('🔄 Circuit Breaker: Tempo expirado, tentando reconectar...');
      this.reset();
      return { allowed: true };
    }
    
    const waitTime = Math.ceil((API_CONFIG.CIRCUIT_BREAKER_TIMEOUT_MS - elapsed) / 1000);
    return { allowed: false, waitTime };
  }

  getStatus() {
    return {
      failures: this.failures,
      isOpen: this.isOpen,
      openedAt: this.openedAt
    };
  }
}

const circuitBreaker = new CircuitBreaker();

// 💾 Sistema de Cache Local
class APICache {
  private readonly PREFIX = 'ciclik_api_cache_';

  get(gtin: string): DadosAPIOnRender | null {
    try {
      const cached = localStorage.getItem(`${this.PREFIX}${gtin}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // Se cache expirou, remove e retorna null
      if (age > API_CONFIG.CACHE_DURATION_MS) {
        localStorage.removeItem(`${this.PREFIX}${gtin}`);
        console.log(`🗑️ Cache expirado para GTIN ${gtin}`);
        return null;
      }
      
      const ageMinutes = Math.round(age / 1000 / 60);
      console.log(`📦 Cache HIT para GTIN ${gtin} (idade: ${ageMinutes} min)`);
      return data;
    } catch (error) {
      console.warn(`⚠️ Erro ao ler cache para GTIN ${gtin}:`, error);
      return null;
    }
  }
  
  set(gtin: string, data: DadosAPIOnRender) {
    try {
      localStorage.setItem(`${this.PREFIX}${gtin}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log(`💾 Dados salvos em cache para GTIN ${gtin}`);
    } catch (error) {
      console.warn('⚠️ Falha ao salvar cache (localStorage cheio?):', error);
      // Tentar limpar caches antigos automaticamente
      this.cleanOldCache();
    }
  }
  
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
      console.log(`🗑️ Cache limpo: ${keys.length} itens removidos`);
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  }

  private cleanOldCache() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
      const now = Date.now();
      let cleaned = 0;

      keys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return;
          
          const { timestamp } = JSON.parse(item);
          if (now - timestamp > API_CONFIG.CACHE_DURATION_MS) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          // Se erro ao parsear, remove o item
          localStorage.removeItem(key);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🧹 Limpeza automática: ${cleaned} caches antigos removidos`);
      }
    } catch (error) {
      console.warn('⚠️ Erro na limpeza automática de cache:', error);
    }
  }

  getStats() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX));
    return {
      total: keys.length,
      sizeKB: new Blob([JSON.stringify(localStorage)]).size / 1024
    };
  }
}

const apiCache = new APICache();

/**
 * � Validar e normalizar GTIN
 * Aceita GTINs de 8, 12, 13 ou 14 dígitos
 * Converte UPC (12 dígitos) para EAN-13 automaticamente
 */
function validarENormalizarGTIN(gtin: string): { valido: boolean; gtinNormalizado: string; erro?: string } {
  // Remover espaços e caracteres especiais
  const gtinLimpo = gtin.replace(/[^0-9]/g, '');
  
  if (gtinLimpo.length === 0) {
    return { valido: false, gtinNormalizado: '', erro: 'GTIN vazio' };
  }
  
  // GTINs válidos: 8 (EAN-8), 12 (UPC), 13 (EAN-13), 14 (GTIN-14)
  if (![8, 12, 13, 14].includes(gtinLimpo.length)) {
    return { 
      valido: false, 
      gtinNormalizado: '', 
      erro: `GTIN inválido: ${gtinLimpo.length} dígitos (esperado: 8, 12, 13 ou 14)` 
    };
  }
  
  // Converter UPC (12 dígitos) para EAN-13 (adiciona 0 no início)
  let gtinNormalizado = gtinLimpo;
  if (gtinLimpo.length === 12) {
    gtinNormalizado = '0' + gtinLimpo;
    console.log(`🔄 Convertendo UPC para EAN-13: ${gtinLimpo} → ${gtinNormalizado}`);
  }
  
  return { valido: true, gtinNormalizado };
}

/**
 * �🔌 Consultar API de Produtos com proteções e otimizações
 * 
 * @param eanGtin - Código GTIN/EAN do produto
 * @returns Promise com dados do produto ou erro tratado
 */
export async function consultarAPIProdutos(eanGtin: string): Promise<DadosAPIOnRender> {
  // 1. Validação e normalização do GTIN
  if (!eanGtin || eanGtin.startsWith('SEM_GTIN_') || eanGtin === 'SEM GTIN') {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: 'Produto sem código GTIN válido - consulta impossível'
    };
  }

  const validacao = validarENormalizarGTIN(eanGtin);
  if (!validacao.valido) {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: validacao.erro || 'GTIN inválido'
    };
  }

  const gtinNormalizado = validacao.gtinNormalizado;

  // 2. Verificar cache primeiro
  const cached = apiCache.get(gtinNormalizado);
  if (cached) {
    return cached;
  }

  // 3. Verificar circuit breaker
  const cbStatus = circuitBreaker.canAttempt();
  if (!cbStatus.allowed) {
    return {
      ean_gtin: gtinNormalizado,
      encontrado: false,
      mensagem: `🚫 API temporariamente indisponível (muitas falhas consecutivas). Aguarde ${cbStatus.waitTime}s e tente novamente.`
    };
  }

  // 4. Fazer a requisição com retry
  const resultado = await fazerRequisicaoComRetry(gtinNormalizado);
  
  // 5. Salvar resultado em cache (mesmo se não encontrado)
  if (resultado.encontrado !== undefined) {
    apiCache.set(gtinNormalizado, resultado);
  }

  return resultado;
}

/**
 * 🔄 Fazer requisição com retry automático
 */
async function fazerRequisicaoComRetry(eanGtin: string): Promise<DadosAPIOnRender> {
  let lastError: any;

  for (let tentativa = 1; tentativa <= API_CONFIG.MAX_RETRIES + 1; tentativa++) {
    try {
      console.log(`🔍 Tentativa ${tentativa}/${API_CONFIG.MAX_RETRIES + 1} - GTIN: ${eanGtin}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

      const response = await fetch(`${API_CONFIG.URL}/api/produtos/${eanGtin}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Processar resposta
      if (!response.ok) {
        if (response.status === 404) {
          // 404 não é erro - produto simplesmente não existe
          circuitBreaker.recordSuccess();
          return {
            ean_gtin: eanGtin,
            encontrado: false,
            mensagem: 'Produto não encontrado na base de dados'
          };
        } else if (response.status === 401) {
          circuitBreaker.recordFailure();
          throw new Error('Token de autenticação inválido');
        } else if (response.status === 400) {
          return {
            ean_gtin: eanGtin,
            encontrado: false,
            mensagem: 'GTIN inválido'
          };
        } else if (response.status >= 500) {
          throw new Error(`Erro no servidor da API: ${response.status}`);
        } else {
          throw new Error(`Erro HTTP ${response.status}`);
        }
      }

      const dadosCosmos = await response.json();
      console.log(`✅ Sucesso - GTIN: ${eanGtin}`, dadosCosmos.encontrado ? '(encontrado)' : '(não encontrado)');

      // Registrar sucesso
      circuitBreaker.recordSuccess();

      // Mapear resposta
      return {
        ean_gtin: dadosCosmos.ean_gtin || eanGtin,
        descricao: dadosCosmos.descricao || undefined,
        marca: dadosCosmos.marca || undefined,
        fabricante: dadosCosmos.fabricante || undefined,
        ncm: dadosCosmos.ncm || undefined,
        ncm_descricao: dadosCosmos.ncm_completo ? dadosCosmos.ncm_completo.split(' - ')[1] : undefined,
        preco_medio: dadosCosmos.preco_medio || undefined,
        peso_liquido: dadosCosmos.peso_liquido_em_gramas || undefined,
        peso_bruto: dadosCosmos.peso_bruto_em_gramas || undefined,
        categoria_api: dadosCosmos.categoria_api || undefined,
        imagem_url: dadosCosmos.imagem_url || undefined,
        encontrado: dadosCosmos.encontrado,
        mensagem: dadosCosmos.mensagem || (dadosCosmos.encontrado ? 'Produto encontrado' : 'Produto não encontrado')
      };

    } catch (error: any) {
      lastError = error;
      
      // Timeout
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Timeout na tentativa ${tentativa}`);
        if (tentativa <= API_CONFIG.MAX_RETRIES) {
          await delay(API_CONFIG.RETRY_DELAY_MS);
          continue;
        }
      }
      
      // Erros de rede
      if (error.message && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('ERR_CONNECTION') ||
        error.message.includes('Failed to fetch')
      )) {
        console.warn(`🌐 Erro de rede na tentativa ${tentativa}:`, error.message);
        if (tentativa <= API_CONFIG.MAX_RETRIES) {
          await delay(API_CONFIG.RETRY_DELAY_MS);
          continue;
        }
      }
      
      // Outros erros não tentam retry
      break;
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  circuitBreaker.recordFailure();

  // Retornar erro tratado
  if (lastError.name === 'AbortError') {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: `⏱️ Timeout: API não respondeu em ${API_CONFIG.TIMEOUT_MS/1000}s`
    };
  }

  if (lastError.message && (
    lastError.message.includes('fetch') || 
    lastError.message.includes('network') ||
    lastError.message.includes('ERR_CONNECTION') ||
    lastError.message.includes('Failed to fetch')
  )) {
    return {
      ean_gtin: eanGtin,
      encontrado: false,
      mensagem: '🌐 API temporariamente indisponível (erro de conexão)'
    };
  }

  return {
    ean_gtin: eanGtin,
    encontrado: false,
    mensagem: `❌ Erro: ${lastError.message || 'Desconhecido'}`
  };
}

/**
 * ⏱️ Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 📊 Obter estatísticas do serviço
 */
export function getServiceStats() {
  return {
    circuitBreaker: circuitBreaker.getStatus(),
    cache: apiCache.getStats()
  };
}

/**
 * 🔄 Resetar circuit breaker manualmente
 */
export function resetCircuitBreaker() {
  circuitBreaker.reset();
}

/**
 * 🗑️ Limpar cache manualmente
 */
export function clearCache() {
  apiCache.clear();
}
