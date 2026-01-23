-- ================================================
-- CORREÇÃO: Trigger de Pontos Usar Configurações
-- ================================================
-- 
-- PROBLEMA: O trigger calcular_pontos_entrega_com_variacao() 
-- está buscando de uma tabela inexistente 'materiais_pontuacao'
-- 
-- SOLUÇÃO: Buscar de 'configuracoes_sistema' com chave 'pontos_base_entrega_6kg'
-- ================================================

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
    
    -- ✅ CORRIGIDO: Buscar pontos base de configuracoes_sistema
    SELECT CAST(valor AS INTEGER) INTO v_pontos_por_6kg
    FROM configuracoes_sistema
    WHERE chave = 'pontos_base_entrega_6kg';
    
    -- Se não encontrar, usar valor padrão
    IF v_pontos_por_6kg IS NULL THEN
      v_pontos_por_6kg := 20;
    END IF;
    
    -- Calcular pontos base usando peso validado
    -- Fórmula: floor(peso_validado / 6) * pontos_por_6kg
    v_pontos_base := FLOOR((NEW.peso_validado / 6)) * v_pontos_por_6kg;
    
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

-- Recriar trigger (se necessário)
DROP TRIGGER IF EXISTS trigger_calcular_pontos_entrega ON entregas_reciclaveis;

CREATE TRIGGER trigger_calcular_pontos_entrega
  AFTER INSERT OR UPDATE ON entregas_reciclaveis
  FOR EACH ROW
  EXECUTE FUNCTION calcular_pontos_entrega_com_variacao();

-- ================================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- ================================================
-- 
-- ✅ CORREÇÃO APLICADA:
-- 1. Removida referência à tabela inexistente 'materiais_pontuacao'
-- 2. Adicionada busca em 'configuracoes_sistema' com chave 'pontos_base_entrega_6kg'
-- 3. Corrigido cálculo de pontos_base para usar FLOOR em vez de ROUND
--    (consistente com frontend: floor(peso / 6) * pontos)
-- 
-- ⚠️ IMPORTANTE:
-- - Este trigger é acionado quando entrega.status muda para 'validada'
-- - Usa peso_validado (SEM rejeitos) para cálculo
-- - Aplica fator de variação se diferença > 10%
-- - Credita pontos em profiles.score_verde
-- - Registra histórico em variacoes_peso_entrega
-- 
-- 📊 FÓRMULA DE CÁLCULO:
-- 1. pontos_base = floor(peso_validado / 6) * pontos_por_6kg
-- 2. Se variação > 10%: aplica redução proporcional
-- 3. pontos_finais = pontos_base * fator_pontuacao
-- 
-- 🔗 DEPENDÊNCIAS:
-- - Função: calcular_pontuacao_com_variacao()
-- - Função: atualizar_pontos_mensais()
-- - Tabela: configuracoes_sistema (chave: 'pontos_base_entrega_6kg')
-- - Tabela: profiles (campo: score_verde)
-- - Tabela: variacoes_peso_entrega
-- 
-- ================================================
