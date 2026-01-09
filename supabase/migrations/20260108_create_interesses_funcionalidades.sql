-- Tabela para rastrear interesses de usuários em funcionalidades por estado/cidade
CREATE TABLE IF NOT EXISTS public.interesses_funcionalidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES public.profiles(id),
  funcionalidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2),
  cidade VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_interesses_funcionalidade ON public.interesses_funcionalidades(funcionalidade);
CREATE INDEX IF NOT EXISTS idx_interesses_estado ON public.interesses_funcionalidades(estado);
CREATE INDEX IF NOT EXISTS idx_interesses_cidade ON public.interesses_funcionalidades(cidade);

-- Enable RLS
ALTER TABLE public.interesses_funcionalidades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Usuários podem registrar interesse" ON public.interesses_funcionalidades;
CREATE POLICY "Usuários podem registrar interesse"
ON public.interesses_funcionalidades
FOR INSERT
WITH CHECK (auth.uid() = id_usuario OR id_usuario IS NULL);

DROP POLICY IF EXISTS "Admins podem ver todos os interesses" ON public.interesses_funcionalidades;
CREATE POLICY "Admins podem ver todos os interesses"
ON public.interesses_funcionalidades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Usuários podem ver próprios interesses" ON public.interesses_funcionalidades;
CREATE POLICY "Usuários podem ver próprios interesses"
ON public.interesses_funcionalidades
FOR SELECT
USING (auth.uid() = id_usuario);
