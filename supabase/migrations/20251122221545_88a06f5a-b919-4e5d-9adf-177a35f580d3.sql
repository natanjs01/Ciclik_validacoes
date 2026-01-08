-- Criar tabela para cache de consultas SEFAZ
CREATE TABLE IF NOT EXISTS public.cache_notas_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave_acesso TEXT NOT NULL UNIQUE,
  numero_nota TEXT,
  serie TEXT,
  data_emissao DATE,
  valor_total NUMERIC(10,2),
  cnpj TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  itens JSONB,
  dados_completos JSONB,
  fonte TEXT, -- 'sefaz', 'brasil_api', 'scraping'
  data_consulta TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para busca rápida por chave de acesso
CREATE INDEX idx_cache_notas_chave ON public.cache_notas_fiscais(chave_acesso);

-- Criar índice para limpeza de cache expirado
CREATE INDEX idx_cache_notas_expiracao ON public.cache_notas_fiscais(data_expiracao);

-- Habilitar RLS
ALTER TABLE public.cache_notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (cache é público)
CREATE POLICY "Cache de notas é público para leitura"
ON public.cache_notas_fiscais
FOR SELECT
USING (true);

-- Política para inserção apenas por serviço
CREATE POLICY "Apenas sistema pode inserir cache"
ON public.cache_notas_fiscais
FOR INSERT
WITH CHECK (false);

-- Política para atualização apenas por serviço
CREATE POLICY "Apenas sistema pode atualizar cache"
ON public.cache_notas_fiscais
FOR UPDATE
USING (false);

COMMENT ON TABLE public.cache_notas_fiscais IS 'Cache de consultas de notas fiscais da SEFAZ e APIs externas';