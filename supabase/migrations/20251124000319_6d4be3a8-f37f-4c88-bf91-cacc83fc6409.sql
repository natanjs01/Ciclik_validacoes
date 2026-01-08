-- Atualizar função atualizar_pontos_mensais para criar notificações de mudança de nível
CREATE OR REPLACE FUNCTION public.atualizar_pontos_mensais(p_usuario_id uuid, p_pontos_ganhos integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_mes_atual DATE;
  v_pontos_totais INTEGER;
  v_nivel_antigo nivel_usuario;
  v_nivel_novo nivel_usuario;
  v_mudou_nivel BOOLEAN := false;
  v_mensagem_notificacao TEXT;
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
    
    -- Criar notificação de mudança de nível
    IF v_nivel_novo = 'Ativo' THEN
      v_mensagem_notificacao := '🎉 Parabéns! Você subiu para o nível Protetor Ciclik! Com ' || v_pontos_totais || ' pontos este mês, você agora tem acesso a metas semanais e mensais aprimoradas. Continue contribuindo com o meio ambiente!';
    ELSIF v_nivel_novo = 'Guardiao Verde' THEN
      v_mensagem_notificacao := '🏆 Incrível! Você alcançou o nível máximo: Guardião Ciclik! Com mais de 1000 pontos este mês, você é um verdadeiro líder ambiental. Aproveite as melhores recompensas e metas exclusivas!';
    ELSE
      v_mensagem_notificacao := '🌱 Bem-vindo ao nível Embaixador Ciclik! Você está começando sua jornada sustentável. Complete missões, envie notas fiscais e faça entregas para acumular pontos e subir de nível!';
    END IF;
    
    INSERT INTO notificacoes (id_usuario, tipo, mensagem)
    VALUES (p_usuario_id, 'mudanca_nivel', v_mensagem_notificacao);
  END IF;
  
  RETURN json_build_object(
    'pontos_totais_mes', v_pontos_totais,
    'nivel_anterior', v_nivel_antigo,
    'nivel_atual', v_nivel_novo,
    'mudou_nivel', v_mudou_nivel
  );
END;
$function$;