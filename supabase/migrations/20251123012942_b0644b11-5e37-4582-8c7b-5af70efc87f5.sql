-- Criar tabela de materiais recicláveis por usuário
CREATE TABLE IF NOT EXISTS public.materiais_reciclaveis_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_nota_fiscal UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
  
  -- Dados do produto
  gtin TEXT,
  descricao TEXT NOT NULL,
  tipo_embalagem tipo_embalagem_enum,
  reciclavel BOOLEAN DEFAULT true,
  percentual_reciclabilidade NUMERIC DEFAULT 0,
  
  -- Origem do cadastro
  origem_cadastro TEXT NOT NULL CHECK (origem_cadastro IN ('nota_fiscal', 'manual')),
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Controle de entrega
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_entrega', 'entregue')),
  id_entrega UUID REFERENCES public.entregas_reciclaveis(id) ON DELETE SET NULL,
  data_entrega TIMESTAMP WITH TIME ZONE,
  
  -- Gamificação
  pontos_ganhos INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna para vincular itens às entregas
ALTER TABLE public.entregas_reciclaveis 
ADD COLUMN IF NOT EXISTS itens_vinculados JSONB;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_materiais_usuario ON public.materiais_reciclaveis_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_materiais_status ON public.materiais_reciclaveis_usuario(status);
CREATE INDEX IF NOT EXISTS idx_materiais_entrega ON public.materiais_reciclaveis_usuario(id_entrega);
CREATE INDEX IF NOT EXISTS idx_materiais_nota ON public.materiais_reciclaveis_usuario(id_nota_fiscal);

-- Habilitar RLS
ALTER TABLE public.materiais_reciclaveis_usuario ENABLE ROW LEVEL SECURITY;

-- RLS: Usuários veem apenas seus materiais
CREATE POLICY "Usuários veem seus próprios materiais"
ON public.materiais_reciclaveis_usuario
FOR SELECT
USING (auth.uid() = id_usuario);

-- RLS: Usuários podem inserir seus materiais
CREATE POLICY "Usuários inserem seus próprios materiais"
ON public.materiais_reciclaveis_usuario
FOR INSERT
WITH CHECK (auth.uid() = id_usuario);

-- RLS: Usuários podem atualizar seus materiais
CREATE POLICY "Usuários atualizam seus próprios materiais"
ON public.materiais_reciclaveis_usuario
FOR UPDATE
USING (auth.uid() = id_usuario);

-- RLS: Cooperativas podem atualizar materiais das entregas delas
CREATE POLICY "Cooperativas atualizam materiais de suas entregas"
ON public.materiais_reciclaveis_usuario
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.entregas_reciclaveis er
    JOIN public.cooperativas c ON c.id = er.id_cooperativa
    WHERE er.id = materiais_reciclaveis_usuario.id_entrega
    AND c.id_user = auth.uid()
  )
);

-- RLS: Admins veem tudo
CREATE POLICY "Admins veem todos os materiais"
ON public.materiais_reciclaveis_usuario
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Função para conceder pontos ao cadastrar material
CREATE OR REPLACE FUNCTION public.conceder_pontos_cadastro_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Conceder pontos baseado na origem
  IF NEW.origem_cadastro = 'nota_fiscal' THEN
    NEW.pontos_ganhos := 5;
    UPDATE profiles 
    SET score_verde = score_verde + 5
    WHERE id = NEW.id_usuario;
  ELSIF NEW.origem_cadastro = 'manual' THEN
    NEW.pontos_ganhos := 10;
    UPDATE profiles 
    SET score_verde = score_verde + 10
    WHERE id = NEW.id_usuario;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para conceder pontos ao cadastrar material
CREATE TRIGGER trigger_conceder_pontos_cadastro_material
BEFORE INSERT ON public.materiais_reciclaveis_usuario
FOR EACH ROW
EXECUTE FUNCTION public.conceder_pontos_cadastro_material();

-- Função para conceder pontos ao entregar material
CREATE OR REPLACE FUNCTION public.conceder_pontos_entrega_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos_entrega INTEGER := 20;
BEGIN
  -- Só conceder pontos quando status mudar para 'entregue'
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN
    UPDATE profiles 
    SET score_verde = score_verde + v_pontos_entrega
    WHERE id = NEW.id_usuario;
    
    -- Atualizar pontos ganhos no material
    NEW.pontos_ganhos := NEW.pontos_ganhos + v_pontos_entrega;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para conceder pontos ao entregar material
CREATE TRIGGER trigger_conceder_pontos_entrega_material
BEFORE UPDATE ON public.materiais_reciclaveis_usuario
FOR EACH ROW
EXECUTE FUNCTION public.conceder_pontos_entrega_material();