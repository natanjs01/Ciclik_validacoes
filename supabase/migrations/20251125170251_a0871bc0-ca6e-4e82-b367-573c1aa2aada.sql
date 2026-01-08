-- Corrigir e recriar função de atualização de status de maturação
DROP FUNCTION IF EXISTS public.atualizar_status_maturacao_cdv_quotas(uuid);

CREATE OR REPLACE FUNCTION public.atualizar_status_maturacao_cdv_quotas(p_id_projeto uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_atualizadas integer := 0;
BEGIN
  -- Atualiza status_maturacao com base no tempo decorrido
  UPDATE cdv_quotas q
  SET status_maturacao = CASE
    -- Quotas sem atribuição ficam NULL
    WHEN q.data_atribuicao IS NULL OR q.data_maturacao IS NULL THEN NULL
    -- Quotas atrasadas (passaram da data de maturação)
    WHEN now() > q.data_maturacao THEN 'atrasada'
    -- Quotas em maturação (50% ou mais do prazo já passou)
    WHEN EXTRACT(EPOCH FROM (now() - q.data_atribuicao)) >= 
         (EXTRACT(EPOCH FROM (q.data_maturacao - q.data_atribuicao)) * 0.5) THEN 'em_maturacao'
    -- Quotas no prazo (menos de 50% do prazo passou)
    ELSE 'no_prazo'
  END
  FROM cdv_projetos p
  WHERE q.id_projeto = p.id
    AND (p_id_projeto IS NULL OR p.id = p_id_projeto)
    AND q.status_maturacao IS DISTINCT FROM CASE
      WHEN q.data_atribuicao IS NULL OR q.data_maturacao IS NULL THEN NULL
      WHEN now() > q.data_maturacao THEN 'atrasada'
      WHEN EXTRACT(EPOCH FROM (now() - q.data_atribuicao)) >= 
           (EXTRACT(EPOCH FROM (q.data_maturacao - q.data_atribuicao)) * 0.5) THEN 'em_maturacao'
      ELSE 'no_prazo'
    END;

  GET DIAGNOSTICS v_atualizadas = ROW_COUNT;
  RETURN v_atualizadas;
END;
$$;