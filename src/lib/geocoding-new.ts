import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Geocodifica uma cooperativa diretamente usando APIs de geocodificação
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

    // Guardar coordenadas antigas para comparação
    const coordenadasAntigas = {
      latitude: cooperativa.latitude,
      longitude: cooperativa.longitude
    };

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

    // 🇧🇷 Tentativa 0: AwesomeAPI (API brasileira GRATUITA com lat/lng por CEP)
    // Esta API é específica para CEPs brasileiros e retorna lat/lng + endereço completo
    // Sem limite de requisições, totalmente gratuita!
    if (cooperativa.cep) {
      try {
        const cepLimpo = cooperativa.cep.replace(/\D/g, '');
        console.log(`🇧🇷 Tentando AwesomeAPI com CEP: ${cepLimpo}`);
        
        const awesomeApiUrl = `https://cep.awesomeapi.com.br/json/${cepLimpo}`;
        const awesomeApiResponse = await fetch(awesomeApiUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (awesomeApiResponse.ok) {
          const awesomeApiData = await awesomeApiResponse.json();
          
          // AwesomeAPI retorna lat e lng diretamente
          if (awesomeApiData.lat && awesomeApiData.lng) {
            latitude = parseFloat(awesomeApiData.lat);
            longitude = parseFloat(awesomeApiData.lng);
            precision = 'postal_code';
            console.log(`✅ Coordenadas encontradas via AwesomeAPI (CEP): ${latitude}, ${longitude}`);
            console.log(`📍 Endereço: ${awesomeApiData.address}, ${awesomeApiData.district} - ${awesomeApiData.city}/${awesomeApiData.state}`);
          }
        }
      } catch (awesomeApiError) {
        console.log('⚠️ AwesomeAPI não disponível ou CEP sem coordenadas, tentando outras fontes...');
      }
    }

    // Tentativa 1: Endereço completo via Nominatim (só se não encontrou via AwesomeAPI)
    if (!latitude || !longitude) {
      // IMPORTANTE: Adicionar countrycodes=br para restringir resultados ao Brasil
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&countrycodes=br&limit=1`;
      
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
      }
    }

    // Tentativa 2: Rua + Bairro + Cidade + UF (fallback intermediário)
    if (!latitude || !longitude) {
      console.log('⚠️ Endereço completo não encontrado, tentando rua + bairro + cidade');
      const enderecoIntermediario = [
        cooperativa.logradouro,
        cooperativa.bairro,
        cooperativa.cidade,
        cooperativa.uf,
        'Brasil'
      ].filter(Boolean).join(', ');
      
      const intermediateUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoIntermediario)}&countrycodes=br&limit=1`;

      // Delay de 1 segundo entre requisições (respeitar limites da API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const intermediateResponse = await fetch(intermediateUrl, {
        headers: {
          'User-Agent': 'Ciclik-App/1.0',
          'Accept': 'application/json'
        }
      });

      const intermediateResults = await intermediateResponse.json();

      if (intermediateResults.length > 0) {
        latitude = parseFloat(intermediateResults[0].lat);
        longitude = parseFloat(intermediateResults[0].lon);
        precision = 'street';
        console.log(`✅ Coordenadas encontradas (rua + bairro): ${latitude}, ${longitude}`);
      } else {
        // Tentativa 3: CEP via Nominatim (se AwesomeAPI falhou)
        if (cooperativa.cep && precision !== 'postal_code') {
          console.log('⚠️ Rua + bairro não encontrado, tentando CEP + cidade');
          const enderecoCep = `${cooperativa.cep}, ${cooperativa.cidade}, ${cooperativa.uf}, Brasil`;
          const cepUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCep)}&countrycodes=br&limit=1`;

          // Delay de 1 segundo entre requisições
          await new Promise(resolve => setTimeout(resolve, 1000));

          const cepResponse = await fetch(cepUrl, {
            headers: {
              'User-Agent': 'Ciclik-App/1.0',
              'Accept': 'application/json'
            }
          });

          const cepResults = await cepResponse.json();

          if (cepResults.length > 0) {
            latitude = parseFloat(cepResults[0].lat);
            longitude = parseFloat(cepResults[0].lon);
            precision = 'postal_code';
            console.log(`✅ Coordenadas encontradas (CEP): ${latitude}, ${longitude}`);
          }
        }
        
        // Tentativa 4: Cidade + UF (fallback genérico - último recurso)
        if (!latitude || !longitude) {
          console.log('⚠️ CEP não encontrado, tentando apenas cidade + UF (último recurso)');
          const enderecoSimples = `${cooperativa.cidade}, ${cooperativa.uf}, Brasil`;
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoSimples)}&countrycodes=br&limit=1`;

          // Delay de 1 segundo entre requisições
          await new Promise(resolve => setTimeout(resolve, 1000));

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
            console.log(`⚠️ Coordenadas encontradas (cidade - genérico): ${latitude}, ${longitude}`);
            
            // 🛡️ VALIDAÇÃO: Se já tinha coordenadas e as novas são apenas do centro da cidade,
            // NÃO substituir (manter as antigas que podem ser mais precisas)
            if (coordenadasAntigas.latitude && coordenadasAntigas.longitude) {
              console.warn('⚠️ Coordenadas genéricas (centro da cidade). Mantendo coordenadas existentes.');
              return {
                success: true,
                latitude: coordenadasAntigas.latitude,
                longitude: coordenadasAntigas.longitude,
                precision: 'cached',
                cached: true,
                message: 'Endereço não encontrado com precisão. Coordenadas anteriores mantidas.'
              };
            }
          } else {
            throw new Error(`Não foi possível encontrar coordenadas para: ${cooperativa.cidade}, ${cooperativa.uf}`);
          }
        }
      }
    }

    // 🛡️ VALIDAÇÃO FINAL: Verificar se coordenadas estão dentro do Brasil
    // Bounding box do Brasil: 
    // Latitude: -33.75 (sul) a 5.27 (norte)
    // Longitude: -73.99 (oeste) a -28.84 (leste)
    if (latitude && longitude) {
      const dentroDoBrasil = (
        latitude >= -34 && latitude <= 6 &&
        longitude >= -75 && longitude <= -28
      );
      
      if (!dentroDoBrasil) {
        console.error(`❌ ERRO: Coordenadas fora do Brasil! [${latitude}, ${longitude}]`);
        
        // Se tinha coordenadas antigas válidas, manter
        if (coordenadasAntigas.latitude && coordenadasAntigas.longitude) {
          console.warn('⚠️ Mantendo coordenadas anteriores por segurança.');
          return {
            success: true,
            latitude: coordenadasAntigas.latitude,
            longitude: coordenadasAntigas.longitude,
            precision: 'cached',
            cached: true,
            message: 'Coordenadas encontradas estão fora do Brasil. Coordenadas anteriores mantidas.'
          };
        }
        
        throw new Error(`Coordenadas encontradas estão fora do Brasil (${latitude}, ${longitude}). Verifique o endereço.`);
      }
      
      console.log(`✅ Coordenadas validadas: dentro do território brasileiro`);
    }

    // Atualizar cooperativa com coordenadas
    console.log(`💾 Salvando coordenadas no banco: [${latitude}, ${longitude}]`);
    
    // Para UPDATE: passamos o ID da cooperativa sendo atualizada para a trigger/policy
    // poder ignorá-la na verificação de duplicatas
    const { error: updateError } = await supabase
      .from('cooperativas')
      .update({
        latitude,
        longitude
      })
      .eq('id', cooperativaId)
      .select() // Força o retorno para confirmar update
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar coordenadas no banco:', updateError);
      
      // Se for erro de duplicatas e estamos atualizando (forceUpdate=true), 
      // pode ser que a trigger não esteja excluindo a própria cooperativa
      if (updateError.code === 'P0001' && forceUpdate) {
        console.warn('⚠️ Erro de duplicatas ao atualizar a mesma cooperativa. Isso indica um problema na trigger/policy do banco.');
        throw new Error(`Erro ao atualizar coordenadas: A validação de duplicatas não está considerando que é a mesma cooperativa sendo atualizada. Por favor, ajuste a trigger/policy no Supabase para excluir a própria cooperativa (NEW.id ou id atual) da verificação durante UPDATE.`);
      }
      
      throw new Error(`Erro ao atualizar coordenadas: ${updateError.message}`);
    }

    console.log(`✅ Cooperativa atualizada com sucesso! Nova localização: [${latitude}, ${longitude}]`);
    
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
      let precisao = 'desconhecido';
      let icone = '📍';
      
      if (resultado.precision === 'address') {
        precisao = 'endereço completo (alta precisão)';
        icone = '🎯';
      } else if (resultado.precision === 'street') {
        precisao = 'rua + bairro (precisão média)';
        icone = '📍';
      } else if (resultado.precision === 'postal_code') {
        precisao = 'CEP brasileiro (precisão boa) 🇧🇷';
        icone = '📮';
      } else if (resultado.precision === 'city') {
        precisao = 'centro da cidade (precisão baixa)';
        icone = '⚠️';
      } else if (resultado.precision === 'cached') {
        precisao = 'coordenadas anteriores mantidas';
        icone = '💾';
      }
      
      toast.success('Localização encontrada!', {
        description: `${icone} Coordenadas baseadas em: ${precisao}`,
        duration: resultado.precision === 'city' ? 8000 : 4000 // Mais tempo para avisos
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
    
    let precisao = 'desconhecido';
    let icone = '📍';
    
    if (resultado.precision === 'address') {
      precisao = 'endereço completo (alta precisão)';
      icone = '🎯';
    } else if (resultado.precision === 'street') {
      precisao = 'rua + bairro (precisão média)';
      icone = '📍';
    } else if (resultado.precision === 'postal_code') {
      precisao = 'CEP brasileiro (precisão boa) 🇧🇷';
      icone = '📮';
    } else if (resultado.precision === 'city') {
      precisao = 'centro da cidade (precisão baixa)';
      icone = '⚠️';
    } else if (resultado.precision === 'cached') {
      precisao = 'coordenadas anteriores mantidas (endereço não encontrado)';
      icone = '💾';
    }
    
    const isWarning = resultado.precision === 'city' || resultado.precision === 'cached';
    
    toast[isWarning ? 'warning' : 'success']('Localização atualizada!', {
      description: `${icone} ${precisao}`,
      duration: isWarning ? 8000 : 4000
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
