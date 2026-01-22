// ============================================================
// 📡 SERVIÇO DE CONSULTA À API COSMOS (VIA RENDER)
// ============================================================
// Arquivo: src/services/cosmosApi.ts
// Descrição: Serviço para consultar produtos na API Cosmos
//            hospedada no Render

// Configurações da API
const RENDER_API_URL = 'https://ciclik-api-produtos.onrender.com';
const API_TOKEN = 'ciclik_secret_token_2026';
const TIMEOUT_MS = 30000; // 30 segundos (considerar cold start)

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface ProdutoCosmosResponse {
  encontrado: boolean;
  ean_gtin: string;
  descricao?: string;
  marca?: string;
  fabricante?: string;
  categoria_api?: string;
  ncm?: string;
  ncm_completo?: string;
  preco_medio?: number;
  peso_liquido_em_gramas?: number;  // ✅ Corrigido para o nome correto
  peso_bruto_em_gramas?: number;     // ✅ Corrigido para o nome correto
  imagem_url?: string;
  mensagem: string;
}

export interface ConsultaCosmosError {
  erro: string;
  mensagem: string;
  ean_gtin?: string;
}

// ============================================================
// FUNÇÃO PRINCIPAL: CONSULTAR PRODUTO
// ============================================================

/**
 * Consulta um produto na API Cosmos via Render
 * 
 * @param gtin - Código GTIN de 13 dígitos
 * @returns Dados do produto ou null se não encontrado
 * @throws Error se houver problema na requisição
 */
export async function consultarProdutoCosmos(
  gtin: string
): Promise<ProdutoCosmosResponse | null> {
  
  // Validar GTIN localmente (evitar requisições desnecessárias)
  if (!validarGTIN(gtin)) {
    throw new Error(`GTIN inválido: deve ter 13 dígitos numéricos`);
  }

  // Configurar timeout para a requisição
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${RENDER_API_URL}/api/produtos/${gtin}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Tratar erros HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Token de autenticação inválido');
      }
      
      if (response.status === 400) {
        throw new Error(errorData.mensagem || 'GTIN inválido');
      }
      
      if (response.status === 500) {
        throw new Error('Erro no servidor da API');
      }
      
      throw new Error(`Erro ${response.status}: ${errorData.mensagem || 'Erro desconhecido'}`);
    }

    const dados: ProdutoCosmosResponse = await response.json();
    
    // Se produto não foi encontrado, retornar null (não é erro)
    if (!dados.encontrado) {
      return null;
    }

    return dados;

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Tratar timeout
    if (error.name === 'AbortError') {
      throw new Error(
        'Timeout na consulta. A API pode estar hibernando (cold start). Tente novamente.'
      );
    }
    
    // Tratar erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
    
    // Re-lançar outros erros
    throw error;
  }
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Valida formato do GTIN (13 dígitos numéricos)
 */
function validarGTIN(gtin: string): boolean {
  if (!gtin) return false;
  if (!/^\d{13}$/.test(gtin)) return false;
  return true;
}

/**
 * Verifica se a API está disponível (health check)
 */
export async function verificarApiDisponivel(): Promise<boolean> {
  try {
    const response = await fetch(`${RENDER_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 segundos
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.status === 'healthy';
    
  } catch {
    return false;
  }
}

/**
 * Extrai dados úteis para preencher formulário
 */
export function extrairDadosParaFormulario(
  produto: ProdutoCosmosResponse
) {
  return {
    categoria: produto.categoria_api || null,
    ncm: produto.ncm || null,
    peso_liquido_em_gramas: produto.peso_liquido_em_gramas || null,  // ✅ Corrigido
    descricao: produto.descricao || null,
    marca: produto.marca || null,
    imagem_url: produto.imagem_url || null
  };
}

// ============================================================
// CACHE SIMPLES (OPCIONAL)
// ============================================================

interface CacheEntry {
  data: ProdutoCosmosResponse | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/**
 * Consulta produto com cache (evita requisições repetidas)
 */
export async function consultarProdutoComCache(
  gtin: string
): Promise<ProdutoCosmosResponse | null> {
  
  // Verificar cache
  const cached = cache.get(gtin);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CACHE HIT] Produto ${gtin} retornado do cache`);
    return cached.data;
  }

  // Consultar API
  const dados = await consultarProdutoCosmos(gtin);
  
  // Salvar no cache
  cache.set(gtin, {
    data: dados,
    timestamp: Date.now()
  });

  return dados;
}

/**
 * Limpar cache (útil em logout ou refresh)
 */
export function limparCache() {
  cache.clear();
}
