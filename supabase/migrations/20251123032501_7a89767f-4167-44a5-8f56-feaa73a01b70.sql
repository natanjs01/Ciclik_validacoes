-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar configurações
CREATE POLICY "Admins podem gerenciar configurações"
ON public.configuracoes_sistema
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Todos podem ler configurações
CREATE POLICY "Todos podem ler configurações"
ON public.configuracoes_sistema
FOR SELECT
USING (true);

-- Inserir configuração padrão do WhatsApp
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES ('whatsapp_ciclik', '5511999999999', 'Número do WhatsApp da Ciclik para atendimento de cooperativas')
ON CONFLICT (chave) DO NOTHING;