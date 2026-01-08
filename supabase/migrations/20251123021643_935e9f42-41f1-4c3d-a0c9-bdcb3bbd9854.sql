-- FASE 1: Estrutura de Banco de Dados para Rastreamento de Peso

-- 1.1 Adicionar campos de peso em produtos_ciclik
ALTER TABLE produtos_ciclik 
ADD COLUMN IF NOT EXISTS peso_medio_gramas NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN produtos_ciclik.peso_medio_gramas IS 'Peso médio da embalagem em gramas';

-- 1.2 Adicionar campos de peso em produto_embalagens
ALTER TABLE produto_embalagens 
ADD COLUMN IF NOT EXISTS peso_medio_gramas NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN produto_embalagens.peso_medio_gramas IS 'Peso médio desta embalagem específica em gramas';

-- 1.3 Adicionar quantidade e peso em materiais_reciclaveis_usuario
ALTER TABLE materiais_reciclaveis_usuario 
ADD COLUMN IF NOT EXISTS quantidade NUMERIC(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS peso_unitario_gramas NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS peso_total_estimado_gramas NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN materiais_reciclaveis_usuario.quantidade IS 'Quantidade de unidades do item';
COMMENT ON COLUMN materiais_reciclaveis_usuario.peso_unitario_gramas IS 'Peso unitário em gramas (copiado do produto)';
COMMENT ON COLUMN materiais_reciclaveis_usuario.peso_total_estimado_gramas IS 'quantidade × peso_unitario_gramas';

-- 1.4 Criar tabela de histórico de variação de peso
CREATE TABLE IF NOT EXISTS variacoes_peso_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrega UUID NOT NULL REFERENCES entregas_reciclaveis(id) ON DELETE CASCADE,
  id_usuario UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peso_estimado_kg NUMERIC(10,3) NOT NULL,
  peso_validado_kg NUMERIC(10,3) NOT NULL,
  variacao_percentual NUMERIC(5,2) NOT NULL,
  variacao_absoluta_kg NUMERIC(10,3) NOT NULL,
  dentro_margem BOOLEAN NOT NULL,
  fator_pontuacao NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  pontos_base INTEGER NOT NULL,
  pontos_aplicados INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE variacoes_peso_entrega IS 'Histórico de variações de peso entre estimado e validado nas entregas';

-- 1.5 Criar função de cálculo de pontuação proporcional com variação
CREATE OR REPLACE FUNCTION calcular_pontuacao_com_variacao(
  p_peso_estimado NUMERIC,
  p_peso_validado NUMERIC,
  p_pontos_base INTEGER
)
RETURNS TABLE (
  fator_pontuacao NUMERIC,
  pontos_finais INTEGER,
  variacao_percentual NUMERIC,
  dentro_margem BOOLEAN
) AS $$
DECLARE
  v_variacao_pct NUMERIC;
  v_fator NUMERIC;
  v_pontos_finais INTEGER;
  v_dentro_margem BOOLEAN;
BEGIN
  -- Evitar divisão por zero
  IF p_peso_estimado IS NULL OR p_peso_estimado = 0 THEN
    RETURN QUERY SELECT 1.00::NUMERIC, p_pontos_base, 0.00::NUMERIC, true;
    RETURN;
  END IF;

  -- Calcular variação percentual absoluta
  v_variacao_pct := ABS((p_peso_validado - p_peso_estimado) / p_peso_estimado) * 100;
  
  -- Verificar se está dentro da margem de 10%
  v_dentro_margem := v_variacao_pct <= 10;
  
  IF v_dentro_margem THEN
    -- Variação aceitável: 100% dos pontos
    v_fator := 1.00;
    v_pontos_finais := p_pontos_base;
  ELSE
    -- Variação > 10%: redução proporcional
    -- Fórmula: pontos = pontos_base × (1 - ((variacao - 10) / 100))
    -- Exemplo: 25% variação → pontos = base × (1 - 0.15) = base × 0.85 = 85% dos pontos
    v_fator := GREATEST(0, 1 - ((v_variacao_pct - 10) / 100));
    v_pontos_finais := ROUND(p_pontos_base * v_fator);
  END IF;
  
  RETURN QUERY SELECT v_fator, v_pontos_finais, v_variacao_pct, v_dentro_margem;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1.6 Criar/substituir trigger de pontuação com variação
CREATE OR REPLACE FUNCTION calcular_pontos_entrega_com_variacao()
RETURNS TRIGGER AS $$
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
    
    -- Adicionar pontos ao usuário
    UPDATE profiles
    SET score_verde = COALESCE(score_verde, 0) + v_calculo.pontos_finais
    WHERE id = NEW.id_usuario;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Remover trigger antigo e criar novo
DROP TRIGGER IF EXISTS trigger_calcular_pontos_entrega ON entregas_reciclaveis;
CREATE TRIGGER trigger_calcular_pontos_entrega
  BEFORE UPDATE ON entregas_reciclaveis
  FOR EACH ROW
  EXECUTE FUNCTION calcular_pontos_entrega_com_variacao();

-- Habilitar RLS na nova tabela
ALTER TABLE variacoes_peso_entrega ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para variacoes_peso_entrega
CREATE POLICY "Usuários podem ver suas próprias variações"
  ON variacoes_peso_entrega FOR SELECT
  USING (auth.uid() = id_usuario);

CREATE POLICY "Admins podem ver todas as variações"
  ON variacoes_peso_entrega FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sistema pode inserir variações"
  ON variacoes_peso_entrega FOR INSERT
  WITH CHECK (true);