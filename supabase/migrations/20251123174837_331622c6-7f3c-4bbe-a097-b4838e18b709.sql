-- Criar tabela de histórico de emails para cooperativas
CREATE TABLE IF NOT EXISTS public.emails_cooperativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cooperativa UUID NOT NULL REFERENCES public.cooperativas(id) ON DELETE CASCADE,
  email_destino TEXT NOT NULL,
  tipo_email TEXT NOT NULL, -- 'convite', 'notificacao', 'lembrete', etc
  assunto TEXT NOT NULL,
  status_envio TEXT NOT NULL DEFAULT 'enviado', -- 'enviado', 'erro', 'pendente'
  mensagem_erro TEXT,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_emails_cooperativas_id_cooperativa ON public.emails_cooperativas(id_cooperativa);
CREATE INDEX idx_emails_cooperativas_data_envio ON public.emails_cooperativas(data_envio DESC);
CREATE INDEX idx_emails_cooperativas_tipo_email ON public.emails_cooperativas(tipo_email);

-- RLS Policies
ALTER TABLE public.emails_cooperativas ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os emails
CREATE POLICY "Admins podem ver histórico de emails"
  ON public.emails_cooperativas
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Cooperativas podem ver seus próprios emails
CREATE POLICY "Cooperativas veem seus emails"
  ON public.emails_cooperativas
  FOR SELECT
  TO authenticated
  USING (
    id_cooperativa IN (
      SELECT id FROM public.cooperativas
      WHERE id_user = auth.uid()
    )
  );

-- Sistema pode inserir registros de email
CREATE POLICY "Sistema pode registrar emails"
  ON public.emails_cooperativas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.emails_cooperativas IS 'Histórico de todos os emails enviados para cooperativas';
COMMENT ON COLUMN public.emails_cooperativas.tipo_email IS 'Tipo do email: convite, notificacao, lembrete, validacao, etc';
COMMENT ON COLUMN public.emails_cooperativas.status_envio IS 'Status do envio: enviado, erro, pendente';
COMMENT ON COLUMN public.emails_cooperativas.metadata IS 'Dados adicionais sobre o email em formato JSON';