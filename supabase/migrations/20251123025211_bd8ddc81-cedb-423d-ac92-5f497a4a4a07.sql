-- Remover trigger antigo que está causando erro
DROP TRIGGER IF EXISTS update_produto_embalagens_updated_at ON public.produto_embalagens;

-- Atualizar peso das embalagens existentes
UPDATE public.produto_embalagens SET peso_medio_gramas = 100 WHERE peso_medio_gramas IS NULL;