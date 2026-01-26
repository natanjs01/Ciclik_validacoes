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
  TIMEOUT_MS: 120000, // ✅ 120s - Render free tier pode demorar no cold start
  MAX_RETRIES: 2, // ✅ 2 retries para lidar com timeouts de cold start
  RETRY_DELAY_MS: 5000, // ✅ 5s entre tentativas (cold start precisa de tempo)
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24h de cache
  CIRCUIT_BREAKER_THRESHOLD: 10, // ✅ 10 falhas consecutivas (render pode falhar várias vezes no início)
  CIRCUIT_BREAKER_TIMEOUT_MS: 120000, // ✅ 2 minutos de pausa (dar tempo pro render acordar)
  
  // 🚦 RATE LIMITING - Render.com free tier
  // Baseado em: https://render.com/docs/free#free-web-services
  // Free tier: 100 req/min, 750h/mês, cold start após 15min inativo
  MAX_REQUESTS_PER_MINUTE: 30, // ✅ 30 req/min (MUITO CONSERVADOR - render free é limitado)
  MAX_CONCURRENT_REQUESTS: 2, // ✅ Máximo de 2 requisições simultâneas (render free tem pouca RAM)
  DELAY_BETWEEN_REQUESTS_MS: 3000, // ✅ 3s entre requisições (20 req/min efetivo)
  COLD_START_DELAY_MS: 15000, // ✅ 15s para primeira requisição (WAKE UP do render)
  COLD_START_EXTRA_TIMEOUT_MS: 180000, // ✅ 3min timeout extra APENAS na primeira requisição
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

// 🚦 Rate Limiter - Controle de requisições por minuto
class RateLimiter {
  private requestTimestamps: number[] = [];
  private activeRequests = 0;
  private isFirstRequest = true;

  /**
   * Aguarda até que seja seguro fazer uma nova requisição
   * Retorna o tempo de espera em ms
   */
  async waitForSlot(): Promise<number> {
    const now = Date.now();
    
    // Limpar timestamps antigos (> 1 minuto)
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < 60000
    );

    // ⏰ Verificar se é primeira requisição (cold start)
    if (this.isFirstRequest) {
      this.isFirstRequest = false;
      console.log('🥶 COLD START DETECTADO - Acordando Render.com...');
      console.log('⏰ Aguardando 15s para o servidor inicializar...');
      await this.sleep(API_CONFIG.COLD_START_DELAY_MS);
      console.log('✅ Render.com deve estar acordado - iniciando consultas');
    }

    // 🚦 Verificar requisições concorrentes
    while (this.activeRequests >= API_CONFIG.MAX_CONCURRENT_REQUESTS) {
      console.log(`⏳ Aguardando slot livre (${this.activeRequests}/${API_CONFIG.MAX_CONCURRENT_REQUESTS} ativas)...`);
      await this.sleep(1000);
    }

    // 🚦 Verificar requisições por minuto
    if (this.requestTimestamps.length >= API_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = this.requestTimestamps[0];
      const timeToWait = 60000 - (now - oldestRequest);
      
      if (timeToWait > 0) {
        console.warn(`⚠️ Rate limit: ${this.requestTimestamps.length} req/min. Aguardando ${Math.ceil(timeToWait / 1000)}s...`);
        await this.sleep(timeToWait);
        return timeToWait;
      }
    }

    // ⏱️ Delay mínimo entre requisições
    if (this.requestTimestamps.length > 0) {
      const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < API_CONFIG.DELAY_BETWEEN_REQUESTS_MS) {
        const delay = API_CONFIG.DELAY_BETWEEN_REQUESTS_MS - timeSinceLastRequest;
        await this.sleep(delay);
        return delay;
      }
    }

    return 0;
  }

  /**
   * Registra início de uma requisição
   */
  startRequest() {
    this.requestTimestamps.push(Date.now());
    this.activeRequests++;
    console.log(`📊 Requisições: ${this.activeRequests} ativas, ${this.requestTimestamps.length} no último minuto`);
  }

  /**
   * Registra fim de uma requisição
   */
  endRequest() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  /**
   * Retorna estatísticas do rate limiter
   */
  getStats() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < 60000
    );

    return {
      activeRequests: this.activeRequests,
      requestsLastMinute: this.requestTimestamps.length,
      maxPerMinute: API_CONFIG.MAX_REQUESTS_PER_MINUTE,
      maxConcurrent: API_CONFIG.MAX_CONCURRENT_REQUESTS,
    };
  }

  /**
   * Reseta o rate limiter
   */
  reset() {
    this.requestTimestamps = [];
    this.activeRequests = 0;
    this.isFirstRequest = true;
    console.log('🔄 Rate limiter resetado');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const rateLimiter = new RateLimiter();

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
 * 🔌 Consultar API de Produtos com proteções e otimizações
 * 
 * @param eanGtin - Código GTIN/EAN do produto
 * @param isFirstInBatch - Se é a primeira requisição do lote (para cold start)
 * @returns Promise com dados do produto ou erro tratado
 */
export async function consultarAPIProdutos(eanGtin: string, isFirstInBatch = false): Promise<DadosAPIOnRender> {
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

  // 4. 🚦 Aguardar slot de rate limiting
  await rateLimiter.waitForSlot();

  // 5. Fazer a requisição com retry (passando flag de primeira requisição)
  const resultado = await fazerRequisicaoComRetry(gtinNormalizado, isFirstInBatch);
  
  // 6. Salvar resultado em cache (mesmo se não encontrado)
  if (resultado.encontrado !== undefined) {
    apiCache.set(gtinNormalizado, resultado);
  }

  return resultado;
}

/**
 * 🔄 Fazer requisição com retry automático
 */
async function fazerRequisicaoComRetry(eanGtin: string, isFirstRequest = false): Promise<DadosAPIOnRender> {
  let lastError: any;

  // 🚦 Registrar início da requisição
  rateLimiter.startRequest();

  try {
    for (let tentativa = 1; tentativa <= API_CONFIG.MAX_RETRIES + 1; tentativa++) {
      try {
        console.log(`🔍 Tentativa ${tentativa}/${API_CONFIG.MAX_RETRIES + 1} - GTIN: ${eanGtin}`);
        
        const controller = new AbortController();
        // ✅ Timeout especial para primeira requisição (cold start)
        const timeout = isFirstRequest && tentativa === 1 
          ? API_CONFIG.COLD_START_EXTRA_TIMEOUT_MS 
          : API_CONFIG.TIMEOUT_MS;
        
        if (isFirstRequest && tentativa === 1) {
          console.log(`⏰ Timeout estendido para primeira requisição: ${timeout / 1000}s (cold start)`);
        }
        
        const timeoutId = setTimeout(() => controller.abort(), timeout);

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
            console.log(`✅ Sucesso - GTIN: ${eanGtin} (não encontrado)`);
            return {
              ean_gtin: eanGtin,
              encontrado: false,
              mensagem: 'Produto não encontrado na base Cosmos'
            };
          } else if (response.status === 429) {
            // ✅ 429 = Rate Limit da API Bluesoft Cosmos
            console.error('🚫 LIMITE DIÁRIO ATINGIDO: API Bluesoft Cosmos bloqueou novas consultas');
            throw new Error('RATE_LIMIT: Limite diário da API Bluesoft atingido. Aguarde até meia-noite (00:00) para continuar.');
          } else if (response.status === 401) {
            circuitBreaker.recordFailure();
            throw new Error('Token de autenticação inválido');
          } else if (response.status === 400) {
            circuitBreaker.recordFailure();
            throw new Error('GTIN inválido');
          } else if (response.status === 500 || response.status === 503) {
            // ⚠️ WORKAROUND: Verificar se é erro 429 disfarçado de 500
            try {
              const errorData = await response.json();
              if (errorData.mensagem && errorData.mensagem.includes('429')) {
                console.error('🚫 LIMITE DIÁRIO ATINGIDO: Erro 429 detectado em resposta 500');
                throw new Error('RATE_LIMIT: Limite diário da API Bluesoft atingido. Aguarde até meia-noite (00:00) para continuar.');
              }
            } catch (jsonError) {
              // Se não conseguir parsear JSON, continua com tratamento normal de 500
            }
            
            // ✅ 500/503 = servidor sobrecarregado no Render.com free tier
            circuitBreaker.recordFailure();
            throw new Error(`Servidor sobrecarregado (${response.status}) - Render.com acordando...`);
          } else {
            circuitBreaker.recordFailure();
            throw new Error(`Erro HTTP ${response.status}`);
          }
        }

        // Sucesso!
        const data = await response.json();
        circuitBreaker.recordSuccess();
        console.log(`✅ Sucesso - GTIN: ${eanGtin} (encontrado)`);
        return data;

      } catch (error: any) {
        lastError = error;

        // 🚫 Se for rate limit, NÃO FAZER RETRY - parar imediatamente
        if (error.message && error.message.includes('RATE_LIMIT')) {
          console.error('🚫 LIMITE DIÁRIO ATINGIDO - Interrompendo processamento');
          // NÃO incrementar circuit breaker (não é falha de servidor)
          throw error; // Propagar erro para interromper batch
        }

        // Se for timeout e ainda tem tentativas, aguarda e tenta novamente
        if (error.name === 'AbortError' && tentativa < API_CONFIG.MAX_RETRIES + 1) {
          const isFirstTimeout = isFirstRequest && tentativa === 1;
          if (isFirstTimeout) {
            console.warn(`⏱️ Timeout na primeira requisição após ${API_CONFIG.COLD_START_EXTRA_TIMEOUT_MS / 1000}s - Render.com pode estar frio demais`);
          } else {
            console.warn(`⏱️ Timeout na tentativa ${tentativa}`);
          }
          circuitBreaker.recordFailure();
          
          // ✅ Espera maior após timeouts de cold start
          const retryDelay = isFirstTimeout ? 30000 : API_CONFIG.RETRY_DELAY_MS;
          console.log(`⏰ Aguardando ${retryDelay / 1000}s antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // Se for erro 500/503 e ainda tem tentativas, aguarda e tenta novamente
        if ((error.message.includes('500') || error.message.includes('503')) && tentativa < API_CONFIG.MAX_RETRIES + 1) {
          console.warn(`⚠️ Servidor sobrecarregado na tentativa ${tentativa} - aguardando antes de retry...`);
          // ✅ Espera progressiva: 5s, 10s, 15s...
          const retryDelay = API_CONFIG.RETRY_DELAY_MS * tentativa;
          console.log(`⏰ Aguardando ${retryDelay / 1000}s para Render.com se recuperar...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // Outros erros não fazem retry
        throw error;
      }
    }

    // Se chegou aqui, esgotou as tentativas
    throw lastError;

  } finally {
    // 🚦 Sempre registrar fim da requisição
    rateLimiter.endRequest();
  }
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
    rateLimiter: rateLimiter.getStats(),
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
 * 🔄 Resetar rate limiter manualmente
 */
export function resetRateLimiter() {
  rateLimiter.reset();
}

/**
 * 🗑️ Limpar cache manualmente
 */
export function clearCache() {
  apiCache.clear();
}
