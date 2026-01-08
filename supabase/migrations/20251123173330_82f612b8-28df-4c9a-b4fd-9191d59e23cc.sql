-- =====================================================
-- FASE 1: ADICIONAR CAMPOS DE EMAIL ÀS COOPERATIVAS
-- =====================================================

ALTER TABLE cooperativas 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS nome_responsavel TEXT,
ADD COLUMN IF NOT EXISTS convite_enviado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- FASE 2: REMOVER CAMPOS DE WHATSAPP
-- =====================================================

ALTER TABLE entregas_reciclaveis 
DROP COLUMN IF EXISTS numero_whatsapp_conversa,
DROP COLUMN IF EXISTS logs_conversa,
DROP COLUMN IF EXISTS conversa_iniciada_em,
DROP COLUMN IF EXISTS conversa_finalizada_em;

-- =====================================================
-- FASE 3: ADICIONAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_entregas_status_promessa 
ON entregas_reciclaveis(status_promessa);

CREATE INDEX IF NOT EXISTS idx_entregas_cooperativa 
ON entregas_reciclaveis(id_cooperativa);

CREATE INDEX IF NOT EXISTS idx_materiais_entrega 
ON materiais_coletados_detalhado(id_entrega);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida
ON notificacoes(id_usuario, lida);

-- =====================================================
-- FASE 4: ATUALIZAR FUNÇÃO DE EXPIRAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION expirar_promessas_antigas_v2()
RETURNS void AS $$
BEGIN
  -- Marcar como expiradas as promessas com mais de 24h
  UPDATE entregas_reciclaveis
  SET status_promessa = 'expirada',
      status = 'expirada'
  WHERE data_geracao < (NOW() - INTERVAL '24 hours')
    AND status_promessa = 'ativa';
    
  -- Liberar materiais de entregas expiradas
  UPDATE materiais_reciclaveis_usuario
  SET status = 'disponivel',
      id_entrega = NULL
  WHERE id_entrega IN (
    SELECT id FROM entregas_reciclaveis
    WHERE status_promessa = 'expirada'
  )
  AND status != 'disponivel';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FASE 5: RLS POLICIES PARA SEGURANÇA
-- =====================================================

-- Cooperativas só veem entregas destinadas a elas
DROP POLICY IF EXISTS "Cooperativas veem suas entregas" ON entregas_reciclaveis;
CREATE POLICY "Cooperativas veem suas entregas"
ON entregas_reciclaveis FOR SELECT
TO authenticated
USING (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
  OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

-- Cooperativas só registram materiais de suas entregas
DROP POLICY IF EXISTS "Cooperativas registram seus materiais" ON materiais_coletados_detalhado;
CREATE POLICY "Cooperativas registram seus materiais"
ON materiais_coletados_detalhado FOR INSERT
TO authenticated
WITH CHECK (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
);