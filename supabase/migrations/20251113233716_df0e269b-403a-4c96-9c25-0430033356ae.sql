-- Create table for historical company metrics
CREATE TABLE IF NOT EXISTS public.metricas_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  faturamento_verde NUMERIC,
  faturamento_total NUMERIC,
  percentual_faturamento_verde NUMERIC,
  taxa_recuperacao NUMERIC,
  toneladas_recuperadas NUMERIC,
  cupons_emitidos INTEGER DEFAULT 0,
  notas_fiscais_validadas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_empresa, data_registro)
);

-- Enable RLS
ALTER TABLE public.metricas_empresas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all company metrics"
ON public.metricas_empresas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their own metrics"
ON public.metricas_empresas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empresas
    WHERE empresas.id = metricas_empresas.id_empresa
    AND empresas.id_user = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for performance
CREATE INDEX idx_metricas_empresas_empresa_data ON metricas_empresas(id_empresa, data_registro DESC);