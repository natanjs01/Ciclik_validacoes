-- Criar enum para tipos de embalagem
CREATE TYPE tipo_embalagem_enum AS ENUM (
  'vidro',
  'plastico', 
  'papel',
  'papelao',
  'aluminio',
  'laminado',
  'misto'
);

-- Criar tabela de produtos Ciclik
CREATE TABLE produtos_ciclik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin TEXT UNIQUE NOT NULL,
  ncm TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo_embalagem tipo_embalagem_enum NOT NULL,
  reciclavel BOOLEAN NOT NULL DEFAULT true,
  percentual_reciclabilidade NUMERIC(5,2) DEFAULT 0,
  observacoes TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_produtos_gtin ON produtos_ciclik(gtin);
CREATE INDEX idx_produtos_ncm ON produtos_ciclik(ncm);
CREATE INDEX idx_produtos_tipo_embalagem ON produtos_ciclik(tipo_embalagem);

-- RLS Policies
ALTER TABLE produtos_ciclik ENABLE ROW LEVEL SECURITY;

-- Admins têm acesso total
CREATE POLICY "Admins podem gerenciar produtos"
  ON produtos_ciclik FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Todos podem visualizar produtos
CREATE POLICY "Todos podem visualizar produtos"
  ON produtos_ciclik FOR SELECT
  USING (true);

-- Trigger para atualizar data_atualizacao
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_produtos
  BEFORE UPDATE ON produtos_ciclik
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_atualizacao();

-- Adicionar colunas na tabela notas_fiscais para tracking
ALTER TABLE notas_fiscais 
  ADD COLUMN IF NOT EXISTS itens_enriquecidos JSONB,
  ADD COLUMN IF NOT EXISTS produtos_nao_cadastrados INTEGER DEFAULT 0;