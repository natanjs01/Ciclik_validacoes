import { supabase } from "@/integrations/supabase/client";
import { ProdutoCiclik } from "@/types/produtos";

export interface ConfrontacaoResult {
  found: boolean;
  produto?: ProdutoCiclik;
}

export async function confrontarProduto(gtin: string): Promise<ConfrontacaoResult> {
  if (!gtin || gtin.trim() === '' || gtin.trim() === 'SEM GTIN') {
    return { found: false };
  }

  try {
    const { data, error } = await supabase
      .from('produtos_ciclik')
      .select('*')
      .eq('gtin', gtin.trim())
      .maybeSingle(); // Usa maybeSingle() ao invés de single() para evitar erro quando não encontra

    if (error) {
      // Log detalhado do erro para debug - COMENTADO
      // console.error('❌ Erro ao buscar produto:', {
      //   gtin: gtin.trim(),
      //   error: error,
      //   code: error.code,
      //   message: error.message,
      //   details: error.details
      // });
      return { found: false };
    }

    // Se encontrou o produto
    if (data) {
      // console.log('✅ Produto encontrado:', {
      //   gtin: gtin.trim(),
      //   descricao: data.descricao
      // });
      return {
        found: true,
        produto: data as ProdutoCiclik
      };
    }

    // Produto não existe na base
    // console.log('⚠️ Produto não cadastrado:', gtin.trim());
    return { found: false };
    
  } catch (error) {
    // console.error('💥 Erro inesperado ao confrontar produto:', error);
    return { found: false };
  }
}
