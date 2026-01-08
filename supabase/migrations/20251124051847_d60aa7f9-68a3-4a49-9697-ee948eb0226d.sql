-- Fix function search_path issues for security

-- Fix atualizar_data_atualizacao
DROP TRIGGER IF EXISTS atualizar_data_atualizacao_trigger ON produtos_ciclik;

CREATE OR REPLACE FUNCTION public.atualizar_data_atualizacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.data_atualizacao = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER atualizar_data_atualizacao_trigger
BEFORE UPDATE ON produtos_ciclik
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_data_atualizacao();

-- Fix update_chatbot_updated_at
DROP TRIGGER IF EXISTS update_chatbot_updated_at_trigger ON chatbot_conversas;

CREATE OR REPLACE FUNCTION public.update_chatbot_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_chatbot_updated_at_trigger
BEFORE UPDATE ON chatbot_conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_chatbot_updated_at();

-- Fix atualizar_updated_at
DROP TRIGGER IF EXISTS atualizar_updated_at_trigger ON cdv_quotas;

CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER atualizar_updated_at_trigger
BEFORE UPDATE ON cdv_quotas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_updated_at();

-- Fix update_user_level
DROP TRIGGER IF EXISTS update_user_level_trigger ON profiles;

CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE TRIGGER update_user_level_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.score_verde IS DISTINCT FROM NEW.score_verde)
EXECUTE FUNCTION public.update_user_level();

-- Fix verificar_estoque_cupom
DROP TRIGGER IF EXISTS verificar_estoque_cupom_trigger ON cupons;

CREATE OR REPLACE FUNCTION public.verificar_estoque_cupom()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.quantidade_disponivel <= NEW.limite_alerta AND NEW.quantidade_disponivel > 0 THEN
    INSERT INTO alertas_estoque (id_cupom, tipo_alerta, mensagem)
    VALUES (
      NEW.id,
      'estoque_baixo',
      format('Cupom %s (%s) está com estoque baixo: %s restantes', 
        NEW.marketplace, NEW.codigo, NEW.quantidade_disponivel)
    );
  END IF;
  
  IF NEW.quantidade_disponivel = 0 AND OLD.quantidade_disponivel > 0 THEN
    INSERT INTO alertas_estoque (id_cupom, tipo_alerta, mensagem)
    VALUES (
      NEW.id,
      'esgotado',
      format('Cupom %s (%s) ESGOTADO!', NEW.marketplace, NEW.codigo)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER verificar_estoque_cupom_trigger
AFTER UPDATE ON cupons
FOR EACH ROW
WHEN (OLD.quantidade_disponivel IS DISTINCT FROM NEW.quantidade_disponivel)
EXECUTE FUNCTION public.verificar_estoque_cupom();