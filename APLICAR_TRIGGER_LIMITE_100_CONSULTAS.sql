-- ============================================
-- CORREÇÃO: Implementar TRIGGER para limite de 100 consultas/dia
-- Data: 22/01/2026
-- Descrição: Bloqueia inserções na tabela log_consultas_api 
--            quando admin já atingiu 100 consultas no dia
-- ============================================

-- PASSO 1: Criar função que valida limite antes de INSERT
CREATE OR REPLACE FUNCTION validar_limite_consultas_diarias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_admin_email TEXT;
BEGIN
  -- Contar consultas do admin no dia atual
  SELECT COUNT(*)
  INTO v_count
  FROM log_consultas_api
  WHERE admin_id = NEW.admin_id
    AND DATE(timestamp) = CURRENT_DATE;
  
  -- Se já atingiu 100 consultas, bloquear inserção
  IF v_count >= 100 THEN
    -- Buscar email do admin para mensagem de erro
    SELECT email INTO v_admin_email
    FROM auth.users
    WHERE id = NEW.admin_id;
    
    RAISE EXCEPTION 'Limite diário de 100 consultas atingido para o admin % (%). Tente novamente amanhã às 00:00.',
      COALESCE(v_admin_email, 'desconhecido'),
      NEW.admin_id
      USING ERRCODE = '23514'; -- check_violation
  END IF;
  
  -- Permitir inserção
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validar_limite_consultas_diarias() IS
'Valida que admin não exceda 100 consultas por dia. Bloqueia INSERT se limite atingido.';

-- PASSO 2: Criar TRIGGER que executa ANTES de cada INSERT
DROP TRIGGER IF EXISTS trigger_validar_limite_consultas ON log_consultas_api;

CREATE TRIGGER trigger_validar_limite_consultas
  BEFORE INSERT ON log_consultas_api
  FOR EACH ROW
  EXECUTE FUNCTION validar_limite_consultas_diarias();

COMMENT ON TRIGGER trigger_validar_limite_consultas ON log_consultas_api IS
'Dispara antes de cada INSERT para garantir que admin não ultrapasse 100 consultas/dia';

-- ============================================
-- PASSO 3: Melhorar função contar_consultas_hoje
-- (adicionar cache e otimização)
-- ============================================

CREATE OR REPLACE FUNCTION contar_consultas_hoje()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- Marca como estável para cache de query
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar consultas do usuário atual no dia de hoje
  SELECT COUNT(*)
  INTO v_count
  FROM log_consultas_api
  WHERE admin_id = auth.uid()
    AND DATE(timestamp) = CURRENT_DATE;
    
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION contar_consultas_hoje() IS 
'Retorna o número de consultas à API realizadas hoje pelo admin autenticado (versão otimizada com cache)';

-- ============================================
-- PASSO 4: Criar índice para performance
-- ============================================

-- Índice composto para acelerar contagem de consultas diárias
CREATE INDEX IF NOT EXISTS idx_log_consultas_admin_data 
ON log_consultas_api (admin_id, DATE(timestamp));

COMMENT ON INDEX idx_log_consultas_admin_data IS
'Acelera queries que contam consultas por admin e data';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Testar se trigger está ativo
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validar_limite_consultas';

-- Verificar função existe
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'validar_limite_consultas_diarias';

-- ============================================
-- EXEMPLO DE TESTE (não executar em produção!)
-- ============================================

/*
-- Simular inserção quando limite foi atingido (deve falhar):
INSERT INTO log_consultas_api (
  admin_id,
  produto_id,
  ean_gtin,
  sucesso,
  tempo_resposta_ms,
  resposta_api
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- admin fictício
  '11111111-1111-1111-1111-111111111111'::uuid, -- produto fictício
  '7891234567890',
  true,
  1500,
  '{"encontrado": true}'::jsonb
);

-- Resultado esperado:
-- ERROR: Limite diário de 100 consultas atingido para o admin...
*/

-- ============================================
-- ROLLBACK (caso necessário desfazer)
-- ============================================

/*
DROP TRIGGER IF EXISTS trigger_validar_limite_consultas ON log_consultas_api;
DROP FUNCTION IF EXISTS validar_limite_consultas_diarias();
DROP INDEX IF EXISTS idx_log_consultas_admin_data;
*/
