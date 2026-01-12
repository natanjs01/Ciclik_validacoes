-- ========================================
-- 🔍 SCRIPT RÁPIDO: Encontrar Coordenadas Duplicadas
-- ========================================
-- Execute este SQL no Supabase para encontrar o problema

-- ✅ PASSO 1: Ver todas cooperativas aprovadas
SELECT 
  id,
  nome_fantasia,
  cidade,
  uf,
  latitude,
  longitude
FROM cooperativas
WHERE status = 'aprovada'
ORDER BY nome_fantasia;

-- ========================================

-- ✅ PASSO 2: Encontrar DUPLICATAS (se existirem)
SELECT 
  latitude,
  longitude,
  COUNT(*) as qtd_duplicatas,
  json_agg(
    json_build_object(
      'nome', nome_fantasia,
      'id', id,
      'cidade', cidade
    )
  ) as cooperativas_afetadas
FROM cooperativas
WHERE status = 'aprovada'
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 1;

-- ========================================
-- 📋 INTERPRETAÇÃO DOS RESULTADOS:
-- ========================================
--
-- Se o PASSO 2 retornar RESULTADOS:
--   🚨 Você TEM coordenadas duplicadas!
--   ➡️ Essas cooperativas aparecem no MESMO ponto do mapa
--   ➡️ Use o guia CORRECAO_COOPERADOS_MESMO_ENDERECO.md
--
-- Se o PASSO 2 NÃO retornar nada:
--   ✅ Não há duplicatas!
--   ➡️ O problema pode ser outra coisa
--   ➡️ Verifique o console do navegador
-- ========================================

-- ✅ PASSO 3: Template para CORRIGIR (após encontrar endereço correto)
-- EXEMPLO: Substitua os valores conforme necessário

/*
-- Atualizar cooperativa específica
UPDATE cooperativas
SET 
  latitude = -23.5505199,    -- 👈 Coordenada CORRETA do Google Maps
  longitude = -46.6333094    -- 👈 Coordenada CORRETA do Google Maps
WHERE id = 'cole-o-id-aqui'   -- 👈 ID da cooperativa (do PASSO 2)
  AND status = 'aprovada';

-- Confirmar mudança
SELECT 
  nome_fantasia,
  latitude,
  longitude
FROM cooperativas
WHERE id = 'cole-o-id-aqui';
*/
