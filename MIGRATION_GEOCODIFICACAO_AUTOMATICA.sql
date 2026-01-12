-- ============================================================================
-- GEOCODIFICAÇÃO AUTOMÁTICA DE COOPERATIVAS
-- ============================================================================
-- Este script adiciona geocodificação automática quando uma cooperativa é
-- criada ou quando o endereço é atualizado
-- ============================================================================

-- 1️⃣ CRIAR FUNÇÃO QUE CHAMA A EDGE FUNCTION
-- ============================================================================
-- Esta função será chamada por um trigger sempre que uma cooperativa
-- for criada ou tiver o endereço atualizado

CREATE OR REPLACE FUNCTION public.geocodificar_cooperativa_automatico()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Só geocodifica se NÃO tiver coordenadas
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    
    -- Log para debug
    RAISE NOTICE 'Geocodificando cooperativa: % (%, %)', NEW.nome_fantasia, NEW.cidade, NEW.uf;
    
    -- Chamar edge function de forma assíncrona via pg_net
    -- IMPORTANTE: Isso requer a extensão pg_net estar instalada
    -- Se não estiver, será necessário chamar manualmente ou via client
    
    -- Nota: Como pg_net pode não estar disponível em todos ambientes,
    -- vamos apenas logar que é necessário geocodificar
    -- A geocodificação real será feita via botão no admin ou via client
    
    RAISE NOTICE 'Cooperativa % precisa de geocodificação', NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ CRIAR TRIGGER PARA NOVOS CADASTROS
-- ============================================================================
-- Trigger executado APÓS INSERT de uma nova cooperativa

DROP TRIGGER IF EXISTS trigger_geocodificar_cooperativa_insert ON public.cooperativas;

CREATE TRIGGER trigger_geocodificar_cooperativa_insert
  AFTER INSERT ON public.cooperativas
  FOR EACH ROW
  EXECUTE FUNCTION public.geocodificar_cooperativa_automatico();

-- 3️⃣ CRIAR TRIGGER PARA ATUALIZAÇÕES DE ENDEREÇO
-- ============================================================================
-- Trigger executado APÓS UPDATE dos campos de endereço
-- Só executa se os campos de endereço mudarem

DROP TRIGGER IF EXISTS trigger_geocodificar_cooperativa_update ON public.cooperativas;

CREATE TRIGGER trigger_geocodificar_cooperativa_update
  AFTER UPDATE OF logradouro, numero, bairro, cidade, uf, cep
  ON public.cooperativas
  FOR EACH ROW
  WHEN (
    NEW.logradouro IS DISTINCT FROM OLD.logradouro OR
    NEW.numero IS DISTINCT FROM OLD.numero OR
    NEW.bairro IS DISTINCT FROM OLD.bairro OR
    NEW.cidade IS DISTINCT FROM OLD.cidade OR
    NEW.uf IS DISTINCT FROM OLD.uf OR
    NEW.cep IS DISTINCT FROM OLD.cep
  )
  EXECUTE FUNCTION public.geocodificar_cooperativa_automatico();

-- 4️⃣ COMENTÁRIOS
-- ============================================================================
COMMENT ON FUNCTION public.geocodificar_cooperativa_automatico() IS 
  'Função que detecta quando uma cooperativa precisa de geocodificação. A geocodificação real é feita via edge function geocodificar-cooperativa.';

-- 5️⃣ VERIFICAR COOPERATIVAS QUE PRECISAM DE GEOCODIFICAÇÃO
-- ============================================================================
SELECT 
  id,
  nome_fantasia,
  cidade || ', ' || uf as localizacao,
  CASE 
    WHEN latitude IS NULL OR longitude IS NULL THEN '❌ Precisa geocodificar'
    ELSE '✅ Já tem coordenadas'
  END as status
FROM public.cooperativas
WHERE status = 'aprovada'
ORDER BY 
  CASE WHEN latitude IS NULL THEN 0 ELSE 1 END,
  nome_fantasia;

-- 6️⃣ TESTAR TRIGGERS (OPCIONAL - DESCOMENTE PARA TESTAR)
-- ============================================================================
/*
-- Inserir cooperativa de teste
INSERT INTO public.cooperativas (
  id_user,
  nome_fantasia,
  razao_social,
  cnpj,
  cep,
  logradouro,
  numero,
  bairro,
  cidade,
  uf,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Usar um user existente
  'Cooperativa Teste',
  'Cooperativa Teste LTDA',
  '12.345.678/0001-90',
  '40000-000',
  'Rua Teste',
  '123',
  'Centro',
  'Salvador',
  'BA',
  'aprovada'
);

-- Verificar se foi criada
SELECT id, nome_fantasia, latitude, longitude 
FROM public.cooperativas 
WHERE nome_fantasia = 'Cooperativa Teste';

-- Deletar cooperativa de teste
DELETE FROM public.cooperativas WHERE nome_fantasia = 'Cooperativa Teste';
*/

-- ============================================================================
-- ⚠️ IMPORTANTE: PRÓXIMOS PASSOS
-- ============================================================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Deploy da edge function: supabase functions deploy geocodificar-cooperativa
-- 3. Adicione botão no Admin para geocodificar cooperativas existentes
-- 4. Ao cadastrar nova cooperativa, chame a edge function manualmente no client
-- ============================================================================
