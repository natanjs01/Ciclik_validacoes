-- Atualizar função de distribuição de datas para usar blocos de 12 meses
CREATE OR REPLACE FUNCTION public.distribuir_datas_maturacao_quotas(p_id_projeto uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_data_inicio timestamp with time zone;
  v_prazo_meses integer;
  v_total_quotas integer;
  v_n_blocos integer;
  v_quotas_por_bloco integer;
  v_atualizadas integer := 0;
BEGIN
  -- Buscar informações do projeto
  SELECT data_inicio, prazo_maturacao_meses, total_quotas
  INTO v_data_inicio, v_prazo_meses, v_total_quotas
  FROM cdv_projetos
  WHERE id = p_id_projeto;
  
  IF v_data_inicio IS NULL THEN
    RAISE EXCEPTION 'Projeto não encontrado ou sem data de início';
  END IF;
  
  -- Calcular número de blocos de 12 meses
  v_n_blocos := CEIL(v_prazo_meses::NUMERIC / 12);
  
  -- Calcular quotas por bloco
  v_quotas_por_bloco := CEIL(v_total_quotas::NUMERIC / v_n_blocos);
  
  -- Distribuir datas de maturação por blocos
  WITH quotas_numeradas AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY numero_quota) as posicao
    FROM cdv_quotas
    WHERE id_projeto = p_id_projeto
  ),
  quotas_com_datas AS (
    SELECT 
      id,
      posicao,
      v_data_inicio as nova_data_atribuicao,
      -- Calcular qual bloco a quota pertence (1, 2, 3, ...)
      CEIL(posicao::NUMERIC / v_quotas_por_bloco) as bloco,
      -- Data de maturação = fim do bloco (data_inicio + bloco * 12 meses)
      v_data_inicio + ((CEIL(posicao::NUMERIC / v_quotas_por_bloco)::INTEGER * 12) || ' months')::INTERVAL as nova_data_maturacao,
      -- Status inicial: primeiro bloco é "no_prazo", demais são "em_maturacao"
      CASE 
        WHEN CEIL(posicao::NUMERIC / v_quotas_por_bloco) = 1 THEN 'no_prazo'::text
        ELSE 'em_maturacao'::text
      END as novo_status
    FROM quotas_numeradas
  )
  UPDATE cdv_quotas q
  SET 
    data_atribuicao = qd.nova_data_atribuicao,
    data_maturacao = qd.nova_data_maturacao,
    status_maturacao = qd.novo_status
  FROM quotas_com_datas qd
  WHERE q.id = qd.id;
  
  GET DIAGNOSTICS v_atualizadas = ROW_COUNT;
  RETURN v_atualizadas;
END;
$function$;