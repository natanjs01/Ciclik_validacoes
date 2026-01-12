-- ========================================
-- 🤖 GEOCODIFICAÇÃO AUTOMÁTICA + VALIDAÇÃO
-- ========================================
-- Este script implementa:
-- 1. Validação de coordenadas duplicadas (impede cadastro)
-- 2. Preparação para geocodificação automática futura
-- ========================================

-- ========================================
-- 🛡️ FUNÇÃO 1: Validar Coordenadas Duplicadas
-- ========================================
-- Impede que duas cooperativas tenham coordenadas idênticas

CREATE OR REPLACE FUNCTION validar_coordenadas_duplicadas()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_cooperativa_existente TEXT;
BEGIN
  -- Só valida se latitude E longitude foram fornecidas
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    
    -- Buscar se já existe outra cooperativa com as mesmas coordenadas
    SELECT COUNT(*), MAX(nome_fantasia)
    INTO v_count, v_cooperativa_existente
    FROM cooperativas
    WHERE latitude = NEW.latitude
      AND longitude = NEW.longitude
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status = 'aprovada';
    
    -- Se encontrou duplicata, bloquear o cadastro
    IF v_count > 0 THEN
      RAISE EXCEPTION 
        'Coordenadas duplicadas detectadas! A cooperativa "%" já está cadastrada com as mesmas coordenadas (Lat: %, Long: %). Por favor, verifique o endereço e use coordenadas precisas.',
        v_cooperativa_existente,
        NEW.latitude,
        NEW.longitude
        USING HINT = 'Use o Google Maps para obter coordenadas exatas do endereço completo.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🎯 TRIGGER: Aplicar Validação Automaticamente
-- ========================================
-- Executa ANTES de INSERT ou UPDATE na tabela cooperativas

DROP TRIGGER IF EXISTS trigger_validar_coordenadas ON cooperativas;

CREATE TRIGGER trigger_validar_coordenadas
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON cooperativas
  FOR EACH ROW
  EXECUTE FUNCTION validar_coordenadas_duplicadas();

-- ========================================
-- ✅ TESTE 1: Tentar inserir coordenadas duplicadas (deve falhar)
-- ========================================
-- Descomente para testar:

/*
INSERT INTO cooperativas (
  id,
  nome_fantasia,
  razao_social,
  cnpj,
  logradouro,
  cidade,
  uf,
  latitude,
  longitude,
  status
) VALUES (
  gen_random_uuid(),
  'TESTE DUPLICATA',
  'TESTE DUPLICATA LTDA',
  '12345678000100',
  'Rua Teste 123',
  'Salvador',
  'BA',
  -12.9896780,  -- 👈 Mesma coordenada da CANORE
  -38.4728350,  -- 👈 Mesma coordenada da CANORE
  'aprovada'
);

-- Resultado esperado:
-- ❌ ERRO: Coordenadas duplicadas detectadas! 
--    A cooperativa "CANORE" já está cadastrada com as mesmas coordenadas...
*/

-- ========================================
-- ✅ TESTE 2: Inserir com coordenadas diferentes (deve funcionar)
-- ========================================
-- Descomente para testar:

/*
INSERT INTO cooperativas (
  id,
  nome_fantasia,
  razao_social,
  cnpj,
  logradouro,
  cidade,
  uf,
  latitude,
  longitude,
  status
) VALUES (
  gen_random_uuid(),
  'TESTE OK',
  'TESTE OK LTDA',
  '12345678000199',
  'Rua Teste 456',
  'Salvador',
  'BA',
  -12.9999999,  -- 👈 Coordenadas diferentes
  -38.4444444,  -- 👈 Coordenadas diferentes
  'aprovada'
);

-- Resultado esperado:
-- ✅ SUCESSO: Cooperativa cadastrada!
*/

-- ========================================
-- 📝 NOTA SOBRE GEOCODIFICAÇÃO AUTOMÁTICA
-- ========================================
-- A geocodificação automática (buscar lat/long pelo endereço)
-- requer uma API externa como:
-- 
-- 1. Google Maps Geocoding API (requer chave paga)
-- 2. OpenStreetMap Nominatim (gratuita, mas com limites)
-- 3. MapBox Geocoding (tem plano gratuito)
-- 
-- Por segurança e confiabilidade, recomendo implementar
-- isso no FRONTEND (TypeScript) em vez do banco de dados.
-- 
-- Vou criar essa implementação no próximo arquivo!
-- ========================================

-- ========================================
-- 🔍 VERIFICAR SE A VALIDAÇÃO ESTÁ ATIVA
-- ========================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validar_coordenadas';

-- Deve retornar:
-- trigger_name: trigger_validar_coordenadas
-- event_manipulation: INSERT, UPDATE
-- action_statement: EXECUTE FUNCTION validar_coordenadas_duplicadas()
-- action_timing: BEFORE

-- ========================================
-- 📋 RESUMO DO QUE FOI IMPLEMENTADO
-- ========================================
--
-- ✅ Validação automática de coordenadas duplicadas
-- ✅ Trigger executa ANTES de INSERT/UPDATE
-- ✅ Mensagem de erro clara e informativa
-- ✅ Sugestão de solução (usar Google Maps)
-- ✅ Não bloqueia updates na mesma cooperativa
-- ✅ Só valida cooperativas aprovadas
--
-- ❌ Geocodificação automática (requer implementação no frontend)
-- ========================================

-- ========================================
-- 🎯 PRÓXIMOS PASSOS
-- ========================================
-- 1. Execute este script no Supabase
-- 2. Abra o próximo arquivo: GEOCODIFICACAO_AUTOMATICA_FRONTEND.tsx
-- 3. Implemente a geocodificação no formulário de cadastro
-- ========================================
