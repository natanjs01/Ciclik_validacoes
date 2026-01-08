-- 1. Criar tabela para tracking de pontos mensais
CREATE TABLE IF NOT EXISTS public.pontos_mensais_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês
  pontos_acumulados INTEGER NOT NULL DEFAULT 0,
  nivel_atingido nivel_usuario,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id_usuario, mes_referencia)
);

-- RLS para pontos mensais
ALTER TABLE public.pontos_mensais_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios pontos mensais"
  ON public.pontos_mensais_usuarios
  FOR SELECT
  USING (auth.uid() = id_usuario);

CREATE POLICY "Admins veem todos os pontos mensais"
  ON public.pontos_mensais_usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sistema pode inserir/atualizar pontos mensais"
  ON public.pontos_mensais_usuarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Criar função para atualizar pontos mensais e nível
CREATE OR REPLACE FUNCTION public.atualizar_pontos_mensais(
  p_usuario_id UUID,
  p_pontos_ganhos INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mes_atual DATE;
  v_pontos_totais INTEGER;
  v_nivel_antigo nivel_usuario;
  v_nivel_novo nivel_usuario;
  v_mudou_nivel BOOLEAN := false;
BEGIN
  -- Primeiro dia do mês atual
  v_mes_atual := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Buscar nível atual do usuário
  SELECT nivel INTO v_nivel_antigo
  FROM profiles
  WHERE id = p_usuario_id;
  
  -- Inserir ou atualizar pontos do mês atual
  INSERT INTO pontos_mensais_usuarios (id_usuario, mes_referencia, pontos_acumulados)
  VALUES (p_usuario_id, v_mes_atual, p_pontos_ganhos)
  ON CONFLICT (id_usuario, mes_referencia)
  DO UPDATE SET 
    pontos_acumulados = pontos_mensais_usuarios.pontos_acumulados + p_pontos_ganhos,
    updated_at = now()
  RETURNING pontos_acumulados INTO v_pontos_totais;
  
  -- Determinar novo nível baseado em pontos mensais
  IF v_pontos_totais >= 1001 THEN
    v_nivel_novo := 'Guardiao Verde';
  ELSIF v_pontos_totais >= 501 THEN
    v_nivel_novo := 'Ativo';
  ELSE
    v_nivel_novo := 'Iniciante';
  END IF;
  
  -- Verificar se houve mudança de nível
  v_mudou_nivel := (v_nivel_antigo != v_nivel_novo);
  
  -- Atualizar nível do usuário se mudou
  IF v_mudou_nivel THEN
    UPDATE profiles
    SET nivel = v_nivel_novo
    WHERE id = p_usuario_id;
    
    -- Atualizar nível no registro mensal
    UPDATE pontos_mensais_usuarios
    SET nivel_atingido = v_nivel_novo
    WHERE id_usuario = p_usuario_id AND mes_referencia = v_mes_atual;
  END IF;
  
  RETURN json_build_object(
    'pontos_totais_mes', v_pontos_totais,
    'nivel_anterior', v_nivel_antigo,
    'nivel_atual', v_nivel_novo,
    'mudou_nivel', v_mudou_nivel
  );
END;
$$;

-- 3. Atualizar função de concessão de pontos de missão
CREATE OR REPLACE FUNCTION public.conceder_pontos_missao(p_usuario_id uuid, p_missao_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos_missao INTEGER;
  v_resultado JSON;
BEGIN
  -- Buscar pontos configurados para missão
  SELECT COALESCE(
    (SELECT valor::INTEGER FROM configuracoes_sistema WHERE chave = 'pontos_missao_completa'),
    10
  ) INTO v_pontos_missao;
  
  -- Adicionar pontos ao score total (mantém compatibilidade)
  UPDATE profiles
  SET 
    score_verde = score_verde + v_pontos_missao,
    missoes_concluidas = missoes_concluidas + 1
  WHERE id = p_usuario_id;
  
  -- Atualizar pontos mensais e verificar nível
  v_resultado := atualizar_pontos_mensais(p_usuario_id, v_pontos_missao);
  
  -- Verificar se é primeira missão de um indicado
  UPDATE indicacoes
  SET pontos_primeira_missao_concedidos = TRUE
  WHERE id_indicado = p_usuario_id 
    AND pontos_primeira_missao_concedidos = FALSE
    AND EXISTS (
      SELECT 1 FROM missoes_usuarios 
      WHERE id_usuario = p_usuario_id 
      HAVING COUNT(*) = 1
    );
  
  -- Conceder pontos ao indicador se aplicável
  IF EXISTS (
    SELECT 1 FROM indicacoes
    WHERE id_indicado = p_usuario_id 
      AND pontos_primeira_missao_concedidos = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM missoes_usuarios mu2
        WHERE mu2.id_usuario = p_usuario_id
        AND mu2.id_missao != p_missao_id
      )
  ) THEN
    DECLARE
      v_id_indicador UUID;
      v_pontos_indicacao INTEGER;
    BEGIN
      SELECT id_indicador INTO v_id_indicador
      FROM indicacoes
      WHERE id_indicado = p_usuario_id;
      
      SELECT COALESCE(
        (SELECT valor::INTEGER FROM configuracoes_sistema WHERE chave = 'pontos_indicacao_primeira_missao'),
        20
      ) INTO v_pontos_indicacao;
      
      UPDATE profiles
      SET score_verde = score_verde + v_pontos_indicacao
      WHERE id = v_id_indicador;
      
      PERFORM atualizar_pontos_mensais(v_id_indicador, v_pontos_indicacao);
    END;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'pontos_concedidos', v_pontos_missao,
    'progressao', v_resultado
  );
END;
$$;

-- 4. Atualizar função de pontos de entrega
CREATE OR REPLACE FUNCTION public.calcular_pontos_entrega_com_variacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos_por_6kg INTEGER;
  v_pontos_base INTEGER;
  v_calculo RECORD;
BEGIN
  -- Só calcular se mudou para 'validada'
  IF NEW.status = 'validada' AND (OLD.status IS NULL OR OLD.status != 'validada') THEN
    
    -- Buscar pontos do material
    SELECT pontos_por_6kg INTO v_pontos_por_6kg
    FROM materiais_pontuacao
    WHERE tipo_material = NEW.tipo_material;
    
    IF v_pontos_por_6kg IS NULL THEN
      v_pontos_por_6kg := 20;
    END IF;
    
    -- Calcular pontos base usando peso validado
    v_pontos_base := ROUND((NEW.peso_validado * v_pontos_por_6kg::NUMERIC) / 6);
    
    -- Aplicar cálculo de variação
    SELECT * INTO v_calculo
    FROM calcular_pontuacao_com_variacao(
      NEW.peso_estimado,
      NEW.peso_validado,
      v_pontos_base
    );
    
    -- Adicionar pontos ao score total
    UPDATE profiles
    SET score_verde = COALESCE(score_verde, 0) + v_calculo.pontos_finais
    WHERE id = NEW.id_usuario;
    
    -- Atualizar pontos mensais e verificar nível
    PERFORM atualizar_pontos_mensais(NEW.id_usuario, v_calculo.pontos_finais);
    
    -- Registrar histórico de variação
    INSERT INTO variacoes_peso_entrega (
      id_entrega,
      id_usuario,
      peso_estimado_kg,
      peso_validado_kg,
      variacao_percentual,
      variacao_absoluta_kg,
      dentro_margem,
      fator_pontuacao,
      pontos_base,
      pontos_aplicados,
      observacoes
    ) VALUES (
      NEW.id,
      NEW.id_usuario,
      COALESCE(NEW.peso_estimado, 0),
      NEW.peso_validado,
      v_calculo.variacao_percentual,
      ABS(NEW.peso_validado - COALESCE(NEW.peso_estimado, 0)),
      v_calculo.dentro_margem,
      v_calculo.fator_pontuacao,
      v_pontos_base,
      v_calculo.pontos_finais,
      CASE 
        WHEN NOT v_calculo.dentro_margem THEN 
          format('Variação de %.2f%% excedeu a margem de 10%%. Pontos reduzidos para %.0f%% do valor base.',
                 v_calculo.variacao_percentual,
                 v_calculo.fator_pontuacao * 100)
        ELSE 'Variação dentro da margem aceitável.'
      END
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pontos_mensais_usuario_mes 
  ON pontos_mensais_usuarios(id_usuario, mes_referencia DESC);

CREATE INDEX IF NOT EXISTS idx_pontos_mensais_mes 
  ON pontos_mensais_usuarios(mes_referencia DESC);