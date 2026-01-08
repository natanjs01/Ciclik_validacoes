-- Corrigir função para seguir best practices de segurança
CREATE OR REPLACE FUNCTION atualizar_updated_at_projeto()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;