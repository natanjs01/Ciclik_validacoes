-- Atualizar status_maturacao das quotas CDV com base no progresso do prazo de maturação
-- A lógica é genérica para qualquer projeto/prazo:
--  - Antes de 50% do prazo:    status_maturacao = 'no_prazo'
--  - Entre 50% e 100% do prazo: status_maturacao = 'em_maturacao'
--  - Após a data de maturação:  status_maturacao = 'atrasada'

CREATE OR REPLACE FUNCTION public.atualizar_status_maturacao_cdv_quotas(p_id_projeto uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_atualizadas integer := 0;
BEGIN
  -- Atualiza apenas quotas vinculadas a projetos (por segurança)
  WITH quotas_alvo AS (
    SELECT q.id,
           q.data_atribuicao,
           q.data_maturacao,
           p.prazo_maturacao_meses,
           CASE
             WHEN q.data_atribuicao IS NULL OR q.data_maturacao IS NULL THEN 'no_prazo'
             WHEN now() > q.data_maturacao THEN 'atrasada'
             ELSE
               -- Calcula percentual do prazo já percorrido: 0 a 1
               LEAST(
                 GREATEST(
                   EXTRACT(EPOCH FROM (now() - q.data_atribuicao)) /
                   NULLIF(EXTRACT(EPOCH FROM (q.data_maturacao - q.data_atribuicao)), 0),
                   0
                 ),
                 1
               )
           END AS fracao_prazo
    FROM cdv_quotas q
    JOIN cdv_projetos p ON p.id = q.id_projeto
    WHERE p_id_projeto IS NULL OR p.id = p_id_projeto
  )
  UPDATE cdv_quotas q
  SET status_maturacao = CASE
    WHEN qa.fracao_prazo = 'atrasada' THEN 'atrasada'  -- já normalizado acima
    WHEN qa.fracao_prazo::text IN ('no_prazo','em_maturacao') THEN qa.fracao_prazo::text
    ELSE CASE
      -- fracao_prazo numérica: antes de 50% do prazo => no_prazo; depois => em_maturacao
      WHEN qa.fracao_prazo < 0.5 THEN 'no_prazo'
      ELSE 'em_maturacao'
    END
  END
  FROM quotas_alvo qa
  WHERE q.id = qa.id
    AND (
      q.status_maturacao IS DISTINCT FROM CASE
        WHEN qa.fracao_prazo = 'atrasada' THEN 'atrasada'
        WHEN qa.fracao_prazo::text IN ('no_prazo','em_maturacao') THEN qa.fracao_prazo::text
        ELSE CASE
          WHEN qa.fracao_prazo < 0.5 THEN 'no_prazo'
          ELSE 'em_maturacao'
        END
      END
    );

  GET DIAGNOSTICS v_atualizadas = ROW_COUNT;
  RETURN v_atualizadas;
END;
$$;