-- Adicionar role 'investidor' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'investidor';

-- Adicionar colunas de controle de convite em cdv_investidores
ALTER TABLE cdv_investidores 
ADD COLUMN IF NOT EXISTS convite_enviado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_convite TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT FALSE;

-- Criar tabela de histórico de emails para investidores
CREATE TABLE IF NOT EXISTS emails_investidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_investidor UUID REFERENCES cdv_investidores(id) ON DELETE CASCADE,
  email_destino TEXT NOT NULL,
  tipo_email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  status_envio TEXT DEFAULT 'pendente',
  mensagem_erro TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE emails_investidores ENABLE ROW LEVEL SECURITY;

-- Policies para emails_investidores
CREATE POLICY "Admins gerenciam emails de investidores"
ON emails_investidores FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir emails"
ON emails_investidores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Investidores veem seus emails"
ON emails_investidores FOR SELECT
USING (id_investidor IN (
  SELECT id FROM cdv_investidores WHERE id_user = auth.uid()
));