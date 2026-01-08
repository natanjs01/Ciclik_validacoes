-- Corrige o search_path da função update_user_level para ser imutável
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.score_verde >= 1000 THEN
    NEW.nivel := 'Guardiao Verde';
  ELSIF NEW.score_verde >= 300 THEN
    NEW.nivel := 'Ativo';
  ELSE
    NEW.nivel := 'Iniciante';
  END IF;
  RETURN NEW;
END;
$$;