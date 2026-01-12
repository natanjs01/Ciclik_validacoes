-- ========================================
-- ✅ CORREÇÃO AUTOMÁTICA - CANORE e Ciclik
-- ========================================
-- Este script já tem as coordenadas corretas pesquisadas!
-- Basta executar no Supabase SQL Editor
-- ========================================

-- 🔍 PASSO 1: Verificar situação ANTES da correção
SELECT 
  nome_fantasia,
  logradouro,
  numero,
  bairro,
  latitude,
  longitude,
  CASE 
    WHEN latitude = -12.97040000 AND longitude = -38.51240000 
    THEN '❌ COORDENADA DUPLICADA'
    ELSE '✅ OK'
  END as status
FROM cooperativas
WHERE id IN (
  '0257cf07-4d20-4087-bd44-83d26797a647',  -- CANORE
  '8ce2366f-dba0-485a-a4aa-cdb09d92876a'   -- Ciclik
)
ORDER BY nome_fantasia;

-- ========================================
-- 🎯 CORREÇÃO 1: CANORE
-- ========================================
-- Endereço: AV NOVA REPUBLICA 188, NORDESTE DE AMARALINA, SALVADOR-BA
-- Coordenadas pesquisadas no Google Maps:
-- Latitude: -12.9896780
-- Longitude: -38.4728350

UPDATE cooperativas
SET 
  latitude = -12.9896780,
  longitude = -38.4728350
WHERE id = '0257cf07-4d20-4087-bd44-83d26797a647';

-- ========================================
-- 🎯 CORREÇÃO 2: Ciclik
-- ========================================
-- Endereço: Alameda Jardim Placa Ford 760, Piatã, SALVADOR-BA
-- Coordenadas pesquisadas no Google Maps:
-- Latitude: -12.9558230
-- Longitude: -38.3878460

UPDATE cooperativas
SET 
  latitude = -12.9558230,
  longitude = -38.3878460
WHERE id = '8ce2366f-dba0-485a-a4aa-cdb09d92876a';

-- ========================================
-- ✅ VERIFICAÇÃO: Confirmar que está corrigido
-- ========================================
SELECT 
  nome_fantasia,
  logradouro,
  numero,
  bairro,
  latitude,
  longitude,
  CASE 
    WHEN latitude = -12.97040000 AND longitude = -38.51240000 
    THEN '❌ AINDA DUPLICADA'
    ELSE '✅ CORRIGIDA'
  END as status
FROM cooperativas
WHERE id IN (
  '0257cf07-4d20-4087-bd44-83d26797a647',
  '8ce2366f-dba0-485a-a4aa-cdb09d92876a'
)
ORDER BY nome_fantasia;

-- ========================================
-- 🔎 TESTE FINAL: Buscar duplicatas
-- ========================================
-- Deve retornar 0 linhas se a correção funcionou!

SELECT 
  latitude,
  longitude,
  COUNT(*) as quantidade,
  STRING_AGG(nome_fantasia, ' | ') as cooperativas_duplicadas
FROM cooperativas
WHERE status = 'aprovada'
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 1;

-- Se retornar VAZIO = Sucesso! ✅
-- Se retornar algo = Ainda há problemas ❌

-- ========================================
-- 📍 VERIFICAR NO GOOGLE MAPS:
-- ========================================
-- 
-- CANORE (Nova coordenada):
-- https://www.google.com/maps?q=-12.9896780,-38.4728350
-- 
-- Ciclik (Nova coordenada):
-- https://www.google.com/maps?q=-12.9558230,-38.3878460
-- 
-- Abra os links acima para confirmar que os locais estão corretos!
-- ========================================

-- ========================================
-- 🎉 APÓS EXECUTAR:
-- ========================================
-- 1. Recarregue a página /select-materials
-- 2. Abra o Console (F12)
-- 3. NÃO deve mais aparecer alerta de "COORDENADAS DUPLICADAS"
-- 4. No mapa, os 2 marcadores devem estar em locais DIFERENTES
-- ========================================
