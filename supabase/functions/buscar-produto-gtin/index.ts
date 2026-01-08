import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestedPackaging {
  tipo_embalagem: 'vidro' | 'plastico' | 'papel' | 'papelao' | 'aluminio' | 'laminado' | 'misto';
  reciclavel: boolean;
  percentual_reciclabilidade: number;
}

interface ProductResult {
  found: boolean;
  source?: string;
  data?: {
    gtin: string;
    descricao: string;
    marca?: string;
    ncm?: string;
    categoria?: string;
    imagem_url?: string;
  };
  suggested_packaging?: SuggestedPackaging[];
  error?: string;
}

// Função para sugerir embalagens baseadas na categoria/descrição do produto
function suggestPackaging(descricao: string, categoria: string = ''): SuggestedPackaging[] {
  const text = `${descricao} ${categoria}`.toLowerCase();
  const suggestions: SuggestedPackaging[] = [];
  
  // Bebidas e líquidos
  if (text.includes('refrigerante') || text.includes('suco') || text.includes('bebida')) {
    if (text.includes('garrafa') || text.includes('vidro')) {
      suggestions.push({ tipo_embalagem: 'vidro', reciclavel: true, percentual_reciclabilidade: 100 });
    }
    if (text.includes('pet') || text.includes('plástico') || text.includes('plastico')) {
      suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 95 });
    }
    if (text.includes('lata') || text.includes('alumínio') || text.includes('aluminio')) {
      suggestions.push({ tipo_embalagem: 'aluminio', reciclavel: true, percentual_reciclabilidade: 100 });
    }
    if (text.includes('tetra pak') || text.includes('caixinha')) {
      suggestions.push({ tipo_embalagem: 'laminado', reciclavel: true, percentual_reciclabilidade: 70 });
    }
  }
  
  // Alimentos secos
  else if (text.includes('biscoito') || text.includes('bolacha') || text.includes('cookies') || 
           text.includes('macarrão') || text.includes('macarrao') || text.includes('arroz') || 
           text.includes('feijão') || text.includes('feijao')) {
    suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 90 });
    suggestions.push({ tipo_embalagem: 'papel', reciclavel: true, percentual_reciclabilidade: 85 });
  }
  
  // Produtos de limpeza
  else if (text.includes('detergente') || text.includes('sabão') || text.includes('sabao') || 
           text.includes('limpeza') || text.includes('desinfetante')) {
    suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 95 });
  }
  
  // Laticínios
  else if (text.includes('leite') || text.includes('iogurte') || text.includes('queijo')) {
    if (text.includes('caixinha') || text.includes('tetra')) {
      suggestions.push({ tipo_embalagem: 'laminado', reciclavel: true, percentual_reciclabilidade: 70 });
    } else {
      suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 90 });
    }
  }
  
  // Conservas
  else if (text.includes('conserva') || text.includes('enlatado') || text.includes('molho')) {
    if (text.includes('vidro')) {
      suggestions.push({ tipo_embalagem: 'vidro', reciclavel: true, percentual_reciclabilidade: 100 });
    } else if (text.includes('lata')) {
      suggestions.push({ tipo_embalagem: 'aluminio', reciclavel: true, percentual_reciclabilidade: 100 });
    } else {
      suggestions.push({ tipo_embalagem: 'vidro', reciclavel: true, percentual_reciclabilidade: 100 });
      suggestions.push({ tipo_embalagem: 'aluminio', reciclavel: true, percentual_reciclabilidade: 100 });
    }
  }
  
  // Produtos de higiene pessoal
  else if (text.includes('shampoo') || text.includes('condicionador') || text.includes('creme') ||
           text.includes('sabonete') || text.includes('pasta de dente')) {
    suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 90 });
  }
  
  // Papelão para embalagens grandes
  if (text.includes('caixa') || text.includes('papelão') || text.includes('papelao')) {
    suggestions.push({ tipo_embalagem: 'papelao', reciclavel: true, percentual_reciclabilidade: 95 });
  }
  
  // Se não encontrou nenhuma sugestão específica, retorna sugestões genéricas
  if (suggestions.length === 0) {
    suggestions.push({ tipo_embalagem: 'plastico', reciclavel: true, percentual_reciclabilidade: 85 });
  }
  
  // Remover duplicatas
  const unique = suggestions.filter((item, index, self) =>
    index === self.findIndex((t) => t.tipo_embalagem === item.tipo_embalagem)
  );
  
  return unique;
}

// Busca na API do Cosmos (gratuita)
async function searchCosmos(gtin: string): Promise<ProductResult> {
  try {
    const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
      headers: {
        'User-Agent': 'Ciclik App',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { found: false, error: 'Produto não encontrado no Cosmos' };
    }

    const data = await response.json();

    const productData = {
      gtin: data.gtin || gtin,
      descricao: data.description || data.brand?.name || '',
      marca: data.brand?.name || '',
      ncm: data.ncm?.code || '',
      categoria: data.ncm?.description || '',
      imagem_url: data.thumbnail || ''
    };

    return {
      found: true,
      source: 'Cosmos',
      data: productData,
      suggested_packaging: suggestPackaging(productData.descricao, productData.categoria)
    };
  } catch (error) {
    console.error('Erro ao buscar no Cosmos:', error);
    return { found: false, error: 'Erro ao consultar Cosmos' };
  }
}

// Busca na Open Food Facts (produtos alimentícios)
async function searchOpenFoodFacts(gtin: string): Promise<ProductResult> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${gtin}.json`);
    
    if (!response.ok) {
      return { found: false, error: 'Produto não encontrado no Open Food Facts' };
    }

    const result = await response.json();
    
    if (result.status === 0) {
      return { found: false, error: 'Produto não encontrado' };
    }

    const product = result.product;

    const productData = {
      gtin: product.code || gtin,
      descricao: product.product_name || product.generic_name || '',
      marca: product.brands || '',
      categoria: product.categories || '',
      imagem_url: product.image_url || ''
    };

    return {
      found: true,
      source: 'Open Food Facts',
      data: productData,
      suggested_packaging: suggestPackaging(productData.descricao, productData.categoria)
    };
  } catch (error) {
    console.error('Erro ao buscar no Open Food Facts:', error);
    return { found: false, error: 'Erro ao consultar Open Food Facts' };
  }
}

// Busca na UPC Database (alternativa)
async function searchUPCDatabase(gtin: string): Promise<ProductResult> {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${gtin}`);
    
    if (!response.ok) {
      return { found: false, error: 'Produto não encontrado no UPC Database' };
    }

    const result = await response.json();
    
    if (!result.items || result.items.length === 0) {
      return { found: false, error: 'Produto não encontrado' };
    }

    const product = result.items[0];

    const productData = {
      gtin: product.ean || product.upc || gtin,
      descricao: product.title || '',
      marca: product.brand || '',
      categoria: product.category || '',
      imagem_url: product.images?.[0] || ''
    };

    return {
      found: true,
      source: 'UPC Database',
      data: productData,
      suggested_packaging: suggestPackaging(productData.descricao, productData.categoria)
    };
  } catch (error) {
    console.error('Erro ao buscar no UPC Database:', error);
    return { found: false, error: 'Erro ao consultar UPC Database' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gtin } = await req.json();

    if (!gtin) {
      return new Response(
        JSON.stringify({ success: false, error: 'GTIN não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar GTIN (remover espaços e caracteres especiais)
    const cleanGtin = gtin.replace(/\D/g, '');

    if (cleanGtin.length < 8 || cleanGtin.length > 14) {
      return new Response(
        JSON.stringify({ success: false, error: 'GTIN inválido (deve ter entre 8 e 14 dígitos)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Buscando produto com GTIN: ${cleanGtin}`);

    // Tentar buscar em diferentes APIs em sequência
    let result: ProductResult;

    // 1. Tentar Cosmos primeiro (mais completa para produtos brasileiros)
    result = await searchCosmos(cleanGtin);
    if (result.found) {
      console.log('Produto encontrado no Cosmos');
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Tentar Open Food Facts (bom para alimentos)
    result = await searchOpenFoodFacts(cleanGtin);
    if (result.found) {
      console.log('Produto encontrado no Open Food Facts');
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Tentar UPC Database como último recurso
    result = await searchUPCDatabase(cleanGtin);
    if (result.found) {
      console.log('Produto encontrado no UPC Database');
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Nenhuma API encontrou o produto
    console.log('Produto não encontrado em nenhuma base de dados');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Produto não encontrado em nenhuma base de dados',
        message: 'Por favor, preencha os dados manualmente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na busca de produto:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar produto' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
