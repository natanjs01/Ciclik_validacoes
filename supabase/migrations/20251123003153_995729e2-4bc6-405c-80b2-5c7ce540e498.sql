-- Criar tabela para múltiplas embalagens por produto
CREATE TABLE IF NOT EXISTS public.produto_embalagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos_ciclik(id) ON DELETE CASCADE,
  tipo_embalagem tipo_embalagem_enum NOT NULL,
  reciclavel BOOLEAN NOT NULL DEFAULT true,
  percentual_reciclabilidade NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_produto_embalagens_produto_id ON public.produto_embalagens(produto_id);

-- Habilitar RLS
ALTER TABLE public.produto_embalagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mesmas do produtos_ciclik)
CREATE POLICY "Admins podem gerenciar embalagens de produtos"
ON public.produto_embalagens
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos podem visualizar embalagens de produtos"
ON public.produto_embalagens
FOR SELECT
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_produto_embalagens_updated_at
BEFORE UPDATE ON public.produto_embalagens
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_data_atualizacao();