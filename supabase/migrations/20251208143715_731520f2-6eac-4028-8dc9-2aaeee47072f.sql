
-- Corrigir a função para não atualizar status (que não aceita 'expirada'), apenas status_promessa
CREATE OR REPLACE FUNCTION public.expirar_promessas_antigas_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar como expiradas as promessas com mais de 24h (apenas status_promessa, não status)
  UPDATE entregas_reciclaveis
  SET status_promessa = 'expirada'
  WHERE data_geracao < (NOW() - INTERVAL '24 hours')
    AND status_promessa = 'ativa';
    
  -- Liberar materiais de entregas expiradas
  UPDATE materiais_reciclaveis_usuario
  SET status = 'disponivel',
      id_entrega = NULL
  WHERE id_entrega IN (
    SELECT id FROM entregas_reciclaveis
    WHERE status_promessa = 'expirada'
  )
  AND status = 'em_entrega';
END;
$function$;

-- Também corrigir a função v1
CREATE OR REPLACE FUNCTION public.expirar_promessas_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar como expiradas as promessas com mais de 24h (apenas status_promessa)
  UPDATE entregas_reciclaveis
  SET status_promessa = 'expirada'
  WHERE data_geracao < (now() - interval '24 hours')
    AND status_promessa = 'ativa';
    
  -- Liberar materiais de entregas expiradas
  UPDATE materiais_reciclaveis_usuario mru
  SET status = 'disponivel',
      id_entrega = NULL
  FROM entregas_reciclaveis er
  WHERE mru.id_entrega = er.id
    AND er.status_promessa = 'expirada'
    AND mru.status = 'em_entrega';
END;
$function$;
