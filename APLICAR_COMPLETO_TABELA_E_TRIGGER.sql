-- ============================================
-- SCRIPT COMPLETO: Criar Tabela + Trigger de Limite 100 Consultas/Dia
-- Data: 22/01/2026
-- ============================================
-- Este script faz TUDO de uma vez:
-- 1. Cria tabela log_consultas_api (se não existir)
-- 2. Cria função de contagem
-- 3. Cria trigger de validação de limite
-- 4. Cria índices de performance
-- 5. Configura RLS
-- ============================================

-- ============================================
-- PARTE 1: CRIAR TABELA LOG_CONSULTAS_API
-- ============================================

CREATE TABLE IF NOT EXISTS log_consultas_api (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos_em_analise(id) ON DELETE SET NULL,
  ean_gtin TEXT NOT NULL,
  sucesso BOOLEAN NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resposta_api JSONB,
  tempo_resposta_ms INTEGER,
  erro_mensagem TEXT
);

-- Comentários da tabela
COMMENT ON TABLE log_consultas_api IS 
'Registra todas as consultas feitas pelos admins à API OnRender para busca de produtos';

COMMENT ON COLUMN log_consultas_api.admin_id IS 
'ID do admin que realizou a consulta';

COMMENT ON COLUMN log_consultas_api.produto_id IS 
'ID do produto em análise consultado (pode ser NULL se o produto foi deletado)';

COMMENT ON COLUMN log_consultas_api.ean_gtin IS 
'Código EAN/GTIN consultado na API';

COMMENT ON COLUMN log_consultas_api.sucesso IS 
'Se a consulta foi bem-sucedida (true) ou falhou (false)';

COMMENT ON COLUMN log_consultas_api.resposta_api IS 
'Resposta completa da API em formato JSON';

COMMENT ON COLUMN log_consultas_api.tempo_resposta_ms IS 
'Tempo de resposta da API em milissegundos';

-- ============================================
-- PARTE 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para busca rápida por admin e data (ESSENCIAL para o trigger)
CREATE INDEX IF NOT EXISTS idx_log_consultas_admin_data 
ON log_consultas_api(admin_id, DATE(timestamp));

-- Índice para busca por timestamp
CREATE INDEX IF NOT EXISTS idx_log_consultas_api_timestamp 
ON log_consultas_api(timestamp DESC);

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_log_consultas_api_produto 
ON log_consultas_api(produto_id);

-- Índice para busca por EAN/GTIN
CREATE INDEX IF NOT EXISTS idx_log_consultas_api_ean_gtin 
ON log_consultas_api(ean_gtin);

-- ============================================
-- PARTE 3: FUNÇÃO RPC PARA CONTAR CONSULTAS DO DIA
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
-- PARTE 4: FUNÇÃO DE VALIDAÇÃO DO LIMITE
-- ============================================

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

-- ============================================
-- PARTE 5: CRIAR TRIGGER DE VALIDAÇÃO
-- ============================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_validar_limite_consultas ON log_consultas_api;

-- Criar novo trigger
CREATE TRIGGER trigger_validar_limite_consultas
  BEFORE INSERT ON log_consultas_api
  FOR EACH ROW
  EXECUTE FUNCTION validar_limite_consultas_diarias();

COMMENT ON TRIGGER trigger_validar_limite_consultas ON log_consultas_api IS
'Dispara antes de cada INSERT para garantir que admin não ultrapasse 100 consultas/dia';

-- ============================================
-- PARTE 6: CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS
ALTER TABLE log_consultas_api ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver apenas suas próprias consultas
DROP POLICY IF EXISTS "Admins podem ver suas consultas" ON log_consultas_api;
CREATE POLICY "Admins podem ver suas consultas"
ON log_consultas_api
FOR SELECT
TO authenticated
USING (admin_id = auth.uid());

-- Política: Admins podem inserir suas próprias consultas
DROP POLICY IF EXISTS "Admins podem inserir consultas" ON log_consultas_api;
CREATE POLICY "Admins podem inserir consultas"
ON log_consultas_api
FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- Política: Service role pode fazer tudo (para triggers internos)
DROP POLICY IF EXISTS "Service role acesso total" ON log_consultas_api;
CREATE POLICY "Service role acesso total"
ON log_consultas_api
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se tabela foi criada
SELECT 
  'Tabela criada' AS status,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'log_consultas_api';

-- Verificar se trigger está ativo
SELECT 
  'Trigger criado' AS status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validar_limite_consultas';

-- Verificar se funções existem
SELECT 
  'Funções criadas' AS status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('contar_consultas_hoje', 'validar_limite_consultas_diarias');

-- Verificar se índices existem
SELECT 
  'Índices criados' AS status,
  indexname
FROM pg_indexes
WHERE tablename = 'log_consultas_api';

-- Verificar políticas RLS
SELECT 
  'Políticas RLS criadas' AS status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'log_consultas_api';

-- ============================================
-- TESTE RÁPIDO (OPCIONAL - DESCOMENTE PARA TESTAR)
-- ============================================

/*
-- Testar função de contagem
SELECT contar_consultas_hoje(); -- Deve retornar 0 se você não fez consultas hoje

-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'log_consultas_api'
ORDER BY ordinal_position;
*/

-- ============================================
-- ROLLBACK (caso necessário desfazer TUDO)
-- ============================================

/*
-- ATENÇÃO: Isso vai DELETAR a tabela e TODAS as consultas registradas!
-- Só execute se tiver certeza!

DROP TRIGGER IF EXISTS trigger_validar_limite_consultas ON log_consultas_api;
DROP FUNCTION IF EXISTS validar_limite_consultas_diarias();
DROP FUNCTION IF EXISTS contar_consultas_hoje();
DROP TABLE IF EXISTS log_consultas_api CASCADE;
*/

-- ============================================
-- ✅ SCRIPT CONCLUÍDO COM SUCESSO!
-- ============================================
-- Tudo foi criado:
-- ✅ Tabela log_consultas_api
-- ✅ Índices de performance
-- ✅ Função contar_consultas_hoje()
-- ✅ Função validar_limite_consultas_diarias()
-- ✅ Trigger trigger_validar_limite_consultas
-- ✅ Políticas RLS
--
-- Próximo passo: Testar na interface!
-- ============================================
