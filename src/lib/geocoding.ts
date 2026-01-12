import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Geocodifica uma cooperativa diretamente usando API do Nominatim
 * @param cooperativaId - ID da cooperativa a ser geocodificada
 * @param forceUpdate - Forçar re-geocodificação mesmo se já existirem coordenadas
 * @returns Objeto com sucesso, coordenadas e precisão
 */
export async function geocodificarCooperativa(cooperativaId: string, forceUpdate = false) {
  try {
    console.log(`🗺️ Iniciando geocodificação para cooperativa ${cooperativaId}`);
    
    // Buscar dados da cooperativa
    const { data: cooperativa, error: fetchError } = await supabase
      .from('cooperativas')
      .select('id, nome_fantasia, logradouro, numero, bairro, cidade, uf, cep, latitude, longitude')
      .eq('id', cooperativaId)
      .single();

    if (fetchError || !cooperativa) {
      throw new Error('Cooperativa não encontrada');
    }

    // Verificar se já tem coordenadas (apenas se não forçar atualização)
    if (!forceUpdate && cooperativa.latitude && cooperativa.longitude) {
      console.log(`✅ Cooperativa já tem coordenadas: ${cooperativa.latitude}, ${cooperativa.longitude}`);
      return {
        success: true,
        latitude: cooperativa.latitude,
        longitude: cooperativa.longitude,
        precision: 'cached',
        cached: true,
        message: 'Cooperativa já possui coordenadas'
      };
    }

    if (forceUpdate && cooperativa.latitude && cooperativa.longitude) {
      console.log(`🔄 Forçando atualização de coordenadas existentes: ${cooperativa.latitude}, ${cooperativa.longitude}`);
    }

    // Montar endereço completo
    const enderecoPartes = [
      cooperativa.logradouro,
      cooperativa.numero,
      cooperativa.bairro,
      cooperativa.cidade,
      cooperativa.uf,
      cooperativa.cep,
      'Brasil'
    ].filter(Boolean);

    const enderecoCompleto = enderecoPartes.join(', ');
    console.log(`🔍 Buscando coordenadas para: ${enderecoCompleto}`);

    let latitude: number | null = null;
    let longitude: number | null = null;
    let precision = 'unknown';

    // Tentativa 1: Endereço completo
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1`;
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'Ciclik-App/1.0',
        'Accept': 'application/json'
      }
    });

    const results = await response.json();

    if (results.length > 0) {
      latitude = parseFloat(results[0].lat);
      longitude = parseFloat(results[0].lon);
      precision = 'address';
      console.log(`✅ Coordenadas encontradas (endereço completo): ${latitude}, ${longitude}`);
    } else {
      // Tentativa 2: Cidade + UF (fallback)
      console.log('⚠️ Endereço completo não encontrado, tentando cidade + UF');
      const enderecoSimples = `${cooperativa.cidade}, ${cooperativa.uf}, Brasil`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoSimples)}&limit=1`;

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Ciclik-App/1.0',
          'Accept': 'application/json'
        }
      });

      const fallbackResults = await fallbackResponse.json();

      if (fallbackResults.length > 0) {
        latitude = parseFloat(fallbackResults[0].lat);
        longitude = parseFloat(fallbackResults[0].lon);
        precision = 'city';
        console.log(`✅ Coordenadas encontradas (cidade): ${latitude}, ${longitude}`);
      } else {
        throw new Error(`Não foi possível encontrar coordenadas para: ${cooperativa.cidade}, ${cooperativa.uf}`);
      }
    }

    // Atualizar cooperativa com coordenadas
    const { error: updateError } = await supabase
      .from('cooperativas')
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString() // Força atualização do timestamp
      })
      .eq('id', cooperativaId);

    if (updateError) {
      throw new Error(`Erro ao atualizar coordenadas: ${updateError.message}`);
    }

    console.log(`✅ Cooperativa atualizada com sucesso!`);
    
    return {
      success: true,
      latitude,
      longitude,
      precision,
      cached: false,
      message: 'Coordenadas adicionadas com sucesso'
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

/**
 * Hook para RE-geocodificar cooperativa ao atualizar endereço
 * Força a atualização mesmo se já existirem coordenadas
 * Use esta função quando o endereço for alterado
 */
export async function geocodificarAposAtualizacao(cooperativaId: string) {
  try {
    toast.loading('Atualizando localização no mapa...', { id: 'geocoding' });
    
    const resultado = await geocodificarCooperativa(cooperativaId, true); // forceUpdate = true
    
    toast.dismiss('geocoding');
    
    const precisao = resultado.precision === 'address' 
      ? 'endereço completo' 
      : 'centro da cidade';
    
    toast.success('Localização atualizada!', {
      description: `Coordenadas baseadas em: ${precisao}`
    });
    
    return resultado;
  } catch (error: any) {
    toast.dismiss('geocoding');
    toast.error('Erro ao atualizar localização', {
      description: error.message
    });
    throw error;
  }
}

/**
 * 🛡️ Verifica se coordenadas já existem no banco (duplicadas)
 * @param latitude - Latitude a verificar
 * @param longitude - Longitude a verificar
 * @param cooperativaId - ID da cooperativa atual (para excluir na busca ao editar)
 * @returns Objeto indicando se é duplicada e qual cooperativa já usa essas coordenadas
 */
export async function verificarCoordenadasDuplicadas(
  latitude: number,
  longitude: number,
  cooperativaId?: string
): Promise<{ duplicada: boolean; cooperativaNome?: string; cooperativaId?: string }> {
  try {
    let query = supabase
      .from('cooperativas')
      .select('id, nome_fantasia')
      .eq('latitude', latitude)
      .eq('longitude', longitude)
      .eq('status', 'aprovada')
      .limit(1);
    
    // Se está editando, excluir a própria cooperativa da busca
    if (cooperativaId) {
      query = query.neq('id', cooperativaId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return { duplicada: false };
    }
    
    if (data && data.length > 0) {
      return {
        duplicada: true,
        cooperativaNome: data[0].nome_fantasia,
        cooperativaId: data[0].id
      };
    }
    
    return { duplicada: false };
  } catch (error) {
    console.error('Erro ao verificar coordenadas duplicadas:', error);
    return { duplicada: false }; // Em caso de erro, permitir cadastro
  }
}

/**
 * 🤖 Geocodifica E verifica duplicatas em uma única chamada
 * Use esta função ao cadastrar/editar cooperativa
 * @param cooperativaId - ID da cooperativa a geocodificar
 * @returns Resultado com coordenadas e status de duplicata
 */
export async function geocodificarComValidacao(cooperativaId: string) {
  try {
    // Primeiro geocodifica
    const resultado = await geocodificarAposCadastro(cooperativaId);
    
    // Depois verifica se é duplicata
    if (resultado.latitude && resultado.longitude) {
      const verificacao = await verificarCoordenadasDuplicadas(
        resultado.latitude,
        resultado.longitude,
        cooperativaId
      );
      
      if (verificacao.duplicada) {
        toast.error('⚠️ Coordenadas duplicadas detectadas!', {
          description: `A cooperativa "${verificacao.cooperativaNome}" já está cadastrada neste local.`,
          duration: 8000
        });
        
        return {
          ...resultado,
          duplicada: true,
          cooperativaDuplicada: verificacao.cooperativaNome
        };
      }
    }
    
    return {
      ...resultado,
      duplicada: false
    };
  } catch (error: any) {
    throw error;
  }
}
