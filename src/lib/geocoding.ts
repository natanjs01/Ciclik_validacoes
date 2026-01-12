import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Geocodifica uma cooperativa usando a API do Nominatim via Edge Function
 * @param cooperativaId - ID da cooperativa a ser geocodificada
 * @returns Objeto com sucesso, coordenadas e precisão
 */
export async function geocodificarCooperativa(cooperativaId: string) {
  try {
    console.log(`🗺️ Iniciando geocodificação para cooperativa ${cooperativaId}`);
    
    const { data, error } = await supabase.functions.invoke(
      'geocodificar-cooperativa',
      {
        body: { cooperativaId }
      }
    );

    if (error) {
      console.error('❌ Erro ao geocodificar:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido');
    }

    console.log('✅ Geocodificação concluída:', data);
    
    return {
      success: true,
      latitude: data.latitude,
      longitude: data.longitude,
      precision: data.precision,
      cached: data.cached || false,
      message: data.message
    };
  } catch (error: any) {
    console.error('❌ Erro na geocodificação:', error);
    throw new Error(error.message || 'Erro ao geocodificar cooperativa');
  }
}

/**
 * Geocodifica múltiplas cooperativas em lote
 * @param cooperativaIds - Array de IDs de cooperativas
 * @returns Resultados da geocodificação
 */
export async function geocodificarCooperativasEmLote(cooperativaIds: string[]) {
  const resultados = {
    sucesso: [] as string[],
    erros: [] as { id: string; erro: string }[],
    jaGeoCodificadas: [] as string[]
  };

  toast.loading(`Geocodificando ${cooperativaIds.length} cooperativas...`, {
    id: 'geocoding-batch'
  });

  for (const id of cooperativaIds) {
    try {
      // Delay entre requisições para respeitar limite da API (1 req/seg)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const resultado = await geocodificarCooperativa(id);
      
      if (resultado.cached) {
        resultados.jaGeoCodificadas.push(id);
      } else {
        resultados.sucesso.push(id);
      }
    } catch (error: any) {
      resultados.erros.push({
        id,
        erro: error.message
      });
    }
  }

  toast.dismiss('geocoding-batch');

  if (resultados.sucesso.length > 0) {
    toast.success(
      `${resultados.sucesso.length} cooperativa${resultados.sucesso.length > 1 ? 's' : ''} geocodificada${resultados.sucesso.length > 1 ? 's' : ''}!`
    );
  }

  if (resultados.erros.length > 0) {
    toast.error(
      `${resultados.erros.length} erro${resultados.erros.length > 1 ? 's' : ''} ao geocodificar`,
      {
        description: resultados.erros.map(e => e.erro).join(', ')
      }
    );
  }

  return resultados;
}

/**
 * Hook para geocodificar cooperativa ao criar/atualizar
 * Chame esta função após criar ou atualizar uma cooperativa
 */
export async function geocodificarAposCadastro(cooperativaId: string) {
  try {
    toast.loading('Buscando localização...', { id: 'geocoding' });
    
    const resultado = await geocodificarCooperativa(cooperativaId);
    
    toast.dismiss('geocoding');
    
    if (resultado.cached) {
      toast.info('Cooperativa já possui coordenadas');
    } else {
      const precisao = resultado.precision === 'address' 
        ? 'endereço completo' 
        : 'centro da cidade';
      
      toast.success('Localização encontrada!', {
        description: `Coordenadas baseadas em: ${precisao}`
      });
    }
    
    return resultado;
  } catch (error: any) {
    toast.dismiss('geocoding');
    toast.error('Erro ao buscar localização', {
      description: error.message
    });
    throw error;
  }
}
