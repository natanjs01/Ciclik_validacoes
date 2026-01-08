-- Criar tabela de projetos CDV
CREATE TABLE IF NOT EXISTS cdv_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  
  -- 5 Metas principais (JSON array)
  metas_principais JSONB DEFAULT '[]'::jsonb,
  
  -- Público alvo
  publico_alvo TEXT,
  
  -- Prazo de vigência
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  
  -- Metas de impacto ambiental TOTAL do projeto
  meta_co2_evitado_kg NUMERIC DEFAULT 0,
  meta_kg_residuos NUMERIC DEFAULT 0,
  meta_minutos_educacao NUMERIC DEFAULT 0,
  meta_produtos_catalogados INTEGER DEFAULT 0,
  
  -- Totais conciliados
  co2_conciliado_kg NUMERIC DEFAULT 0,
  kg_conciliados NUMERIC DEFAULT 0,
  minutos_conciliados NUMERIC DEFAULT 0,
  produtos_conciliados INTEGER DEFAULT 0,
  
  -- Contadores
  total_quotas INTEGER DEFAULT 0,
  quotas_vendidas INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'ativo', -- ativo, encerrado, cancelado
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Modificar tabela cdv_quotas
ALTER TABLE cdv_quotas 
  ADD COLUMN IF NOT EXISTS id_projeto UUID REFERENCES cdv_projetos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS meta_co2_evitado_kg NUMERIC DEFAULT 450,
  ADD COLUMN IF NOT EXISTS co2_conciliado_kg NUMERIC DEFAULT 0;

-- Corrigir valores padrão das metas por quota
ALTER TABLE cdv_quotas 
  ALTER COLUMN meta_kg_residuos SET DEFAULT 500,
  ALTER COLUMN meta_horas_educacao SET DEFAULT 600,
  ALTER COLUMN meta_embalagens SET DEFAULT 20,
  ALTER COLUMN valor_pago SET DEFAULT 2000.00;

-- Habilitar RLS
ALTER TABLE cdv_projetos ENABLE ROW LEVEL SECURITY;

-- Policies para cdv_projetos
CREATE POLICY "Admins gerenciam todos projetos"
ON cdv_projetos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos podem ver projetos ativos"
ON cdv_projetos
FOR SELECT
TO authenticated
USING (status = 'ativo' OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at_projeto()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_updated_at_projeto
BEFORE UPDATE ON cdv_projetos
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_projeto();