-- =============================================
-- MÓDULO CDV - CERTIFICADO DIGITAL VERDE
-- =============================================

-- Tabela de investidores CDV (empresas compradoras)
CREATE TABLE cdv_investidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user UUID NOT NULL REFERENCES auth.users(id),
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  nome_responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado'))
);

-- Tabela de quotas CDV adquiridas
CREATE TABLE cdv_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_investidor UUID NOT NULL REFERENCES cdv_investidores(id),
  numero_quota TEXT NOT NULL UNIQUE,
  valor_pago NUMERIC NOT NULL DEFAULT 2000.00,
  data_compra TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_maturacao TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'em_geracao' CHECK (status IN ('em_geracao', 'pronto', 'certificado_emitido')),
  
  -- Metas de impacto
  meta_kg_residuos NUMERIC DEFAULT 1000,
  meta_horas_educacao NUMERIC DEFAULT 1200,
  meta_embalagens INTEGER DEFAULT 18,
  
  -- Progresso atual
  kg_conciliados NUMERIC DEFAULT 0,
  horas_conciliadas NUMERIC DEFAULT 0,
  embalagens_conciliadas INTEGER DEFAULT 0,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque de resíduos (impactos reais)
CREATE TABLE estoque_residuos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kg NUMERIC NOT NULL,
  id_usuario UUID NOT NULL REFERENCES profiles(id),
  id_cooperativa UUID NOT NULL REFERENCES cooperativas(id),
  id_entrega UUID REFERENCES entregas_reciclaveis(id),
  data_entrega TIMESTAMP WITH TIME ZONE NOT NULL,
  submaterial TEXT NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'atribuido')),
  data_atribuicao TIMESTAMP WITH TIME ZONE,
  id_cdv UUID REFERENCES cdv_quotas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque de educação (horas de treinamento)
CREATE TABLE estoque_educacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES profiles(id),
  minutos_assistidos NUMERIC NOT NULL,
  modulo TEXT NOT NULL,
  id_missao UUID REFERENCES missoes(id),
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'atribuido')),
  data_atribuicao TIMESTAMP WITH TIME ZONE,
  id_cdv UUID REFERENCES cdv_quotas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Estoque de embalagens catalogadas
CREATE TABLE estoque_embalagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  id_produto UUID REFERENCES produtos_ciclik(id),
  reciclabilidade NUMERIC,
  tipo_embalagem TEXT,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'atribuido')),
  data_atribuicao TIMESTAMP WITH TIME ZONE,
  id_cdv UUID REFERENCES cdv_quotas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Certificados emitidos
CREATE TABLE cdv_certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_quota UUID NOT NULL REFERENCES cdv_quotas(id),
  id_investidor UUID NOT NULL REFERENCES cdv_investidores(id),
  numero_certificado TEXT NOT NULL UNIQUE,
  hash_validacao TEXT NOT NULL UNIQUE,
  
  -- Dados do certificado
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Impactos certificados
  kg_certificados NUMERIC NOT NULL,
  horas_certificadas NUMERIC NOT NULL,
  embalagens_certificadas INTEGER NOT NULL,
  
  -- URLs e documentos
  pdf_url TEXT,
  link_publico TEXT,
  qrcode_data TEXT,
  
  -- Controle
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valido BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log de conciliações (motor de baixa)
CREATE TABLE cdv_conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_quota UUID NOT NULL REFERENCES cdv_quotas(id),
  tipo_impacto TEXT NOT NULL CHECK (tipo_impacto IN ('residuos', 'educacao', 'embalagens')),
  quantidade_conciliada NUMERIC NOT NULL,
  ids_estoque JSONB NOT NULL,
  data_conciliacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processado_por TEXT DEFAULT 'sistema_automatico',
  observacoes TEXT
);

-- Índices para performance
CREATE INDEX idx_cdv_quotas_investidor ON cdv_quotas(id_investidor);
CREATE INDEX idx_cdv_quotas_status ON cdv_quotas(status);
CREATE INDEX idx_estoque_residuos_status ON estoque_residuos(status);
CREATE INDEX idx_estoque_residuos_cdv ON estoque_residuos(id_cdv);
CREATE INDEX idx_estoque_educacao_status ON estoque_educacao(status);
CREATE INDEX idx_estoque_educacao_cdv ON estoque_educacao(id_cdv);
CREATE INDEX idx_estoque_embalagens_status ON estoque_embalagens(status);
CREATE INDEX idx_estoque_embalagens_cdv ON estoque_embalagens(id_cdv);
CREATE INDEX idx_cdv_certificados_hash ON cdv_certificados(hash_validacao);

-- RLS Policies

-- cdv_investidores
ALTER TABLE cdv_investidores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investidores veem seus próprios dados"
  ON cdv_investidores FOR SELECT
  USING (auth.uid() = id_user);

CREATE POLICY "Admins veem todos investidores"
  ON cdv_investidores FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- cdv_quotas
ALTER TABLE cdv_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investidores veem suas quotas"
  ON cdv_quotas FOR SELECT
  USING (
    id_investidor IN (
      SELECT id FROM cdv_investidores WHERE id_user = auth.uid()
    )
  );

CREATE POLICY "Admins gerenciam todas quotas"
  ON cdv_quotas FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- estoque_residuos
ALTER TABLE estoque_residuos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam estoque de resíduos"
  ON estoque_residuos FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir resíduos"
  ON estoque_residuos FOR INSERT
  WITH CHECK (true);

-- estoque_educacao
ALTER TABLE estoque_educacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam estoque de educação"
  ON estoque_educacao FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir educação"
  ON estoque_educacao FOR INSERT
  WITH CHECK (true);

-- estoque_embalagens
ALTER TABLE estoque_embalagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam estoque de embalagens"
  ON estoque_embalagens FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir embalagens"
  ON estoque_embalagens FOR INSERT
  WITH CHECK (true);

-- cdv_certificados
ALTER TABLE cdv_certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificados são públicos para leitura"
  ON cdv_certificados FOR SELECT
  USING (true);

CREATE POLICY "Investidores veem seus certificados"
  ON cdv_certificados FOR SELECT
  USING (
    id_investidor IN (
      SELECT id FROM cdv_investidores WHERE id_user = auth.uid()
    )
  );

CREATE POLICY "Admins gerenciam certificados"
  ON cdv_certificados FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- cdv_conciliacoes
ALTER TABLE cdv_conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem conciliações"
  ON cdv_conciliacoes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode registrar conciliações"
  ON cdv_conciliacoes FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cdv_quotas_updated_at
  BEFORE UPDATE ON cdv_quotas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- Função para calcular data de maturação (12 meses)
CREATE OR REPLACE FUNCTION calcular_data_maturacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_maturacao IS NULL THEN
    NEW.data_maturacao := NEW.data_compra + INTERVAL '12 months';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_data_maturacao
  BEFORE INSERT ON cdv_quotas
  FOR EACH ROW
  EXECUTE FUNCTION calcular_data_maturacao();