-- Criar tabela de leads de investidores CDV
CREATE TABLE public.cdv_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT NOT NULL,
  telefone TEXT,
  origem TEXT DEFAULT 'landing_cdv',
  status TEXT DEFAULT 'novo', -- novo, em_contato, convertido, descartado
  data_cadastro TIMESTAMPTZ DEFAULT now(),
  data_contato TIMESTAMPTZ,
  notas TEXT,
  id_investidor UUID REFERENCES cdv_investidores(id)
);

-- Habilitar RLS
ALTER TABLE public.cdv_leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins gerenciam leads CDV" 
ON public.cdv_leads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para inserção pública (formulário da landing)
CREATE POLICY "Qualquer um pode criar lead" 
ON public.cdv_leads 
FOR INSERT 
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_cdv_leads_status ON public.cdv_leads(status);
CREATE INDEX idx_cdv_leads_data_cadastro ON public.cdv_leads(data_cadastro DESC);