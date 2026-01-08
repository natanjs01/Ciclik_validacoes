-- Criar função para distribuir automaticamente datas de maturação de quotas de um projeto
CREATE OR REPLACE FUNCTION public.distribuir_datas_maturacao_quotas(p_id_projeto uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_data_inicio timestamp with time zone;
  v_prazo_meses integer;
  v_total_quotas integer;
  v_quotas_primeiro_periodo integer;
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
  
  -- Calcular quantas quotas vão para o primeiro período (primeira metade do prazo)
  v_quotas_primeiro_periodo := v_total_quotas / 2;
  
  -- Distribuir datas de maturação
  WITH quotas_numeradas AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY numero_quota) as posicao
    FROM cdv_quotas
    WHERE id_projeto = p_id_projeto
      AND id_investidor IS NULL
  ),
  quotas_com_datas AS (
    SELECT 
      id,
      posicao,
      v_data_inicio as nova_data_atribuicao,
      CASE 
        WHEN posicao <= v_quotas_primeiro_periodo THEN
          -- Primeira metade: distribuir na primeira metade do prazo
          v_data_inicio + ((((posicao - 1) * (v_prazo_meses / 2)) / v_quotas_primeiro_periodo)::int || ' months')::interval
        ELSE
          -- Segunda metade: distribuir na segunda metade do prazo
          v_data_inicio + (((v_prazo_meses / 2) + (((posicao - v_quotas_primeiro_periodo - 1) * (v_prazo_meses / 2)) / (v_total_quotas - v_quotas_primeiro_periodo))::int) || ' months')::interval
      END as nova_data_maturacao,
      CASE 
        WHEN posicao <= v_quotas_primeiro_periodo THEN 'no_prazo'::text
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
$$;