-- ============================================================================
-- ADICIONAR LOCALIZAÇÃO PARA COOPERATIVAS
-- ============================================================================
-- Este script adiciona latitude e longitude para cooperativas que não têm
-- ============================================================================

-- 1️⃣ VERIFICAR COOPERATIVAS SEM LOCALIZAÇÃO
-- ============================================================================
SELECT 
    id,
    nome_fantasia,
    logradouro,
    bairro,
    cidade,
    uf,
    cep,
    latitude,
    longitude,
    status
FROM cooperativas
WHERE status = 'aprovada'
AND (latitude IS NULL OR longitude IS NULL);

-- 2️⃣ COOPERATIVA CICLIK - Salvador/BA
-- ============================================================================
-- Endereço exemplo: Plataforma - Salvador, BA
-- Coordenadas: Latitude -12.9704, Longitude -38.5124 (Centro de Salvador)

-- ⚠️ IMPORTANTE: Verifique o endereço correto da cooperativa antes de executar!
-- Use Google Maps ou outro serviço para obter as coordenadas exatas

-- Exemplo para cooperativa "Ciclik" em Salvador:
UPDATE cooperativas
SET 
    latitude = -12.9704,  -- Ajuste com a coordenada correta
    longitude = -38.5124   -- Ajuste com a coordenada correta
WHERE nome_fantasia ILIKE '%ciclik%'
AND cidade ILIKE '%salvador%'
AND uf = 'BA';

-- 3️⃣ VERIFICAR SE FOI ATUALIZADO
-- ============================================================================
SELECT 
    nome_fantasia,
    cidade,
    uf,
    latitude,
    longitude
FROM cooperativas
WHERE status = 'aprovada';

-- ============================================================================
-- 📍 COMO OBTER COORDENADAS:
-- ============================================================================
-- 1. Acesse Google Maps (https://www.google.com/maps)
-- 2. Pesquise o endereço completo da cooperativa
-- 3. Clique com botão direito no marcador/local
-- 4. Clique em "Ver detalhes" ou nas coordenadas que aparecem
-- 5. Copie os números (formato: -12.9704, -38.5124)
--    - Primeiro número = Latitude
--    - Segundo número = Longitude
-- ============================================================================

-- 4️⃣ EXEMPLOS DE COORDENADAS DE CIDADES BRASILEIRAS
-- ============================================================================
-- Salvador, BA:     -12.9704, -38.5124
-- São Paulo, SP:    -23.5505, -46.6333
-- Rio de Janeiro:   -22.9068, -43.1729
-- Brasília, DF:     -15.7939, -47.8828
-- Belo Horizonte:   -19.9167, -43.9345
-- Recife, PE:       -8.0476, -34.8770
-- Porto Alegre, RS: -30.0346, -51.2177
-- Curitiba, PR:     -25.4284, -49.2733
-- ============================================================================

-- 5️⃣ ADICIONAR MÚLTIPLAS COOPERATIVAS (SE NECESSÁRIO)
-- ============================================================================
-- Template para adicionar coordenadas:
/*
UPDATE cooperativas
SET 
    latitude = LATITUDE_AQUI,
    longitude = LONGITUDE_AQUI
WHERE id = 'ID_DA_COOPERATIVA';
*/
