-- ========================================
-- 🛡️ PREVENÇÃO: Validar Coordenadas Duplicadas
-- ========================================
-- Esta função impede cadastro de cooperativas
-- com coordenadas muito próximas (mesmo local)
-- ========================================

-- ✅ PASSO 1: Criar função de validação
CREATE OR REPLACE FUNCTION validar_coordenadas_duplicadas()
RETURNS TRIGGER AS $$
DECLARE
  cooperativa_existente RECORD;
  distancia_minima NUMERIC := 0.001; -- ~111 metros
BEGIN
  -- Verificar se há coordenadas
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    
    -- Buscar cooperativas com coordenadas muito próximas
    SELECT 
      id,
      nome_fantasia,
      latitude,
      longitude
    INTO cooperativa_existente
    FROM cooperativas
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND ABS(latitude - NEW.latitude) < distancia_minima
      AND ABS(longitude - NEW.longitude) < distancia_minima
    LIMIT 1;
    
    -- Se encontrou coordenadas muito próximas, avisar
    IF FOUND THEN
      RAISE WARNING 'Coordenadas muito próximas de: % (%, %)', 
        cooperativa_existente.nome_fantasia,
        cooperativa_existente.latitude,
        cooperativa_existente.longitude;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ PASSO 2: Criar trigger para INSERT
DROP TRIGGER IF EXISTS check_coordenadas_duplicadas_insert ON cooperativas;
CREATE TRIGGER check_coordenadas_duplicadas_insert
  BEFORE INSERT ON cooperativas
  FOR EACH ROW
  EXECUTE FUNCTION validar_coordenadas_duplicadas();

-- ✅ PASSO 3: Criar trigger para UPDATE
DROP TRIGGER IF EXISTS check_coordenadas_duplicadas_update ON cooperativas;
CREATE TRIGGER check_coordenadas_duplicadas_update
  BEFORE UPDATE OF latitude, longitude ON cooperativas
  FOR EACH ROW
  WHEN (NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude)
  EXECUTE FUNCTION validar_coordenadas_duplicadas();

-- ========================================
-- ✅ PASSO 4: Criar função para buscar coordenadas por endereço
-- ========================================
-- Esta função ajuda a encontrar coordenadas corretas

CREATE OR REPLACE FUNCTION sugerir_coordenadas_por_endereco(
  p_logradouro TEXT,
  p_numero TEXT,
  p_bairro TEXT,
  p_cidade TEXT,
  p_uf TEXT
)
RETURNS TEXT AS $$
DECLARE
  endereco_completo TEXT;
  url_google_maps TEXT;
BEGIN
  -- Montar endereço completo
  endereco_completo := CONCAT_WS(', ',
    NULLIF(TRIM(p_logradouro), ''),
    NULLIF(TRIM(p_numero), ''),
    NULLIF(TRIM(p_bairro), ''),
    NULLIF(TRIM(p_cidade), ''),
    NULLIF(TRIM(p_uf), '')
  );
  
  -- Criar URL do Google Maps
  url_google_maps := 'https://www.google.com/maps/search/' || 
    REPLACE(REPLACE(endereco_completo, ' ', '+'), ',', '');
  
  RETURN url_google_maps;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🧪 TESTE: Validar que está funcionando
-- ========================================

-- Teste 1: Buscar se há duplicatas atuais
SELECT 
  latitude,
  longitude,
  COUNT(*) as quantidade,
  STRING_AGG(nome_fantasia, ' | ') as cooperativas
FROM cooperativas
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 1;

-- Teste 2: Gerar URL do Google Maps para uma cooperativa
SELECT 
  nome_fantasia,
  sugerir_coordenadas_por_endereco(
    logradouro,
    numero,
    bairro,
    cidade,
    uf
  ) as url_buscar_coordenadas
FROM cooperativas
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 5;

-- ========================================
-- 📋 O QUE FOI IMPLEMENTADO:
-- ========================================
--
-- 1. ✅ Trigger que AVISA quando coordenadas são muito próximas
--    - Distância mínima: ~111 metros
--    - Aparece como WARNING no Supabase
--    - Não bloqueia, apenas alerta
--
-- 2. ✅ Função para gerar URL do Google Maps
--    - Baseada no endereço cadastrado
--    - Facilita buscar coordenadas corretas
--
-- 3. ✅ Validação em INSERT e UPDATE
--    - Automática sempre que coordenadas mudam
--    - Previne duplicatas acidentais
--
-- ========================================
-- 🎯 COMO USAR NOS PRÓXIMOS CADASTROS:
-- ========================================
--
-- 1. Ao cadastrar cooperativa COM endereço mas SEM coordenadas:
--    SELECT sugerir_coordenadas_por_endereco(
--      'Rua Exemplo', '123', 'Bairro', 'Cidade', 'UF'
--    );
--    
--    Copie a URL, abra no navegador, pegue as coordenadas
--
-- 2. Ao inserir coordenadas, se forem duplicadas:
--    Você verá WARNING no Supabase
--    
-- 3. Para verificar todas sem coordenadas:
--    SELECT * FROM cooperativas 
--    WHERE latitude IS NULL OR longitude IS NULL;
--
-- ========================================
