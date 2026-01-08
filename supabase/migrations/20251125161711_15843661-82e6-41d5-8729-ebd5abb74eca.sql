-- Permitir quotas sem investidor (disponíveis para venda)
ALTER TABLE cdv_quotas 
  ALTER COLUMN id_investidor DROP NOT NULL;

-- Adicionar campos para rastrear atribuição e maturação
ALTER TABLE cdv_quotas 
  ADD COLUMN data_atribuicao TIMESTAMPTZ,
  ADD COLUMN status_maturacao TEXT DEFAULT 'no_prazo';

-- Comentários para status_maturacao: 'no_prazo', 'em_maturacao', 'atrasada'
COMMENT ON COLUMN cdv_quotas.status_maturacao IS 'Status de maturação: no_prazo, em_maturacao, atrasada';

-- Adicionar campos de controle de prazo nos projetos
ALTER TABLE cdv_projetos 
  ADD COLUMN prazo_maturacao_meses INTEGER DEFAULT 12,
  ADD COLUMN quotas_por_periodo INTEGER DEFAULT NULL;

COMMENT ON COLUMN cdv_projetos.prazo_maturacao_meses IS 'Prazo em meses para maturação de cada quota do projeto';
COMMENT ON COLUMN cdv_projetos.quotas_por_periodo IS 'Número de quotas disponibilizadas a cada período de 12 meses';

-- Modificar certificados para suportar múltiplas quotas
ALTER TABLE cdv_certificados
  ADD COLUMN id_projeto UUID REFERENCES cdv_projetos(id),
  ADD COLUMN quotas_incluidas JSONB DEFAULT '[]',
  ADD COLUMN total_quotas INTEGER DEFAULT 1;

-- Tornar id_quota opcional (agora pode ter múltiplas quotas por certificado)
ALTER TABLE cdv_certificados 
  ALTER COLUMN id_quota DROP NOT NULL;

COMMENT ON COLUMN cdv_certificados.quotas_incluidas IS 'Array de IDs das quotas incluídas neste certificado consolidado';
COMMENT ON COLUMN cdv_certificados.total_quotas IS 'Número total de quotas incluídas no certificado';

-- Criar índices para melhorar performance de queries
CREATE INDEX idx_cdv_quotas_projeto_investidor ON cdv_quotas(id_projeto, id_investidor) WHERE id_investidor IS NOT NULL;
CREATE INDEX idx_cdv_quotas_status_maturacao ON cdv_quotas(status_maturacao) WHERE id_investidor IS NOT NULL;
CREATE INDEX idx_cdv_certificados_projeto ON cdv_certificados(id_projeto);