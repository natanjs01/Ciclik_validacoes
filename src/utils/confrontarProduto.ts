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
    // TODO: Verificar permissões RLS da tabela produtos_ciclik
    // Temporariamente desabilitado devido a erro 406 (Not Acceptable)
    return { found: false };
    
    /* CÓDIGO COMENTADO ATÉ RESOLVER PERMISSÕES RLS
    const { data, error } = await supabase
      .from('produtos_ciclik')
      .select('*')
      .eq('gtin', gtin.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return { found: false };
      }
      console.error('Erro ao buscar produto:', error);
      return { found: false };
    }

    return {
      found: true,
      produto: data as ProdutoCiclik
    };
    */
  } catch (error) {
    console.error('Erro ao confrontar produto:', error);
    return { found: false };
  }
}
