-- Corrigir função que está causando erro
DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao ON public.produto_embalagens;

-- A tabela produto_embalagens usa updated_at, não data_atualizacao
-- Criar trigger correto
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger correto
CREATE TRIGGER trigger_atualizar_updated_at
  BEFORE UPDATE ON public.produto_embalagens
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();