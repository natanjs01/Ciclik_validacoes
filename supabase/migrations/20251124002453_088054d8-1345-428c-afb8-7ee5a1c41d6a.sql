-- Criar tabela para histórico de ajustes manuais de pontos
CREATE TABLE IF NOT EXISTS public.ajustes_pontos_manuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_admin UUID NOT NULL REFERENCES profiles(id),
  pontos_antes INTEGER NOT NULL,
  pontos_depois INTEGER NOT NULL,
  diferenca INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ajustes_pontos_usuario ON ajustes_pontos_manuais(id_usuario);
CREATE INDEX idx_ajustes_pontos_admin ON ajustes_pontos_manuais(id_admin);
CREATE INDEX idx_ajustes_pontos_data ON ajustes_pontos_manuais(created_at DESC);

-- RLS policies
ALTER TABLE public.ajustes_pontos_manuais ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os ajustes
CREATE POLICY "Admins veem todos ajustes"
  ON ajustes_pontos_manuais
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem inserir ajustes
CREATE POLICY "Admins podem inserir ajustes"
  ON ajustes_pontos_manuais
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver seus próprios ajustes
CREATE POLICY "Usuários veem seus ajustes"
  ON ajustes_pontos_manuais
  FOR SELECT
  USING (auth.uid() = id_usuario);

COMMENT ON TABLE ajustes_pontos_manuais IS 'Histórico de ajustes manuais de pontos feitos por administradores';
COMMENT ON COLUMN ajustes_pontos_manuais.motivo IS 'Motivo do ajuste (recalculo_automatico, correcao_manual, etc)';
COMMENT ON COLUMN ajustes_pontos_manuais.detalhes IS 'Detalhes adicionais sobre o ajuste em formato JSON ou texto';