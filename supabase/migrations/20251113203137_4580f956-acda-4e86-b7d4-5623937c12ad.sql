-- Sistema oficial de pontuação Ciclik

-- 1. Criar tabela de indicações
CREATE TABLE IF NOT EXISTS indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_indicador UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  id_indicado UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data_indicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pontos_cadastro_concedidos BOOLEAN DEFAULT FALSE,
  pontos_primeira_missao_concedidos BOOLEAN DEFAULT FALSE,
  UNIQUE(id_indicado)
);

CREATE INDEX idx_indicacoes_indicador ON indicacoes(id_indicador);
CREATE INDEX idx_indicacoes_indicado ON indicacoes(id_indicado);

-- Políticas RLS para indicações
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar indicações"
ON indicacoes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id_indicador);

CREATE POLICY "Usuários veem suas indicações"
ON indicacoes FOR SELECT
TO authenticated
USING (auth.uid() = id_indicador OR auth.uid() = id_indicado);

CREATE POLICY "Admins veem todas indicações"
ON indicacoes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. Ajustar cupons para usar sistema de pontos
ALTER TABLE cupons DROP COLUMN IF EXISTS valor CASCADE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS valor_reais NUMERIC NOT NULL DEFAULT 10;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS pontos_necessarios INTEGER NOT NULL DEFAULT 300;

ALTER TABLE cupons_resgates DROP COLUMN IF EXISTS valor_utilizado CASCADE;
ALTER TABLE cupons_resgates ADD COLUMN IF NOT EXISTS pontos_utilizados INTEGER NOT NULL DEFAULT 300;

-- 3. Atualizar função de missões para dar +10 pontos fixos
DROP FUNCTION IF EXISTS conceder_creditos_missao(UUID, UUID);

CREATE OR REPLACE FUNCTION conceder_pontos_missao(
  p_usuario_id UUID,
  p_missao_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_score_atual INTEGER;
BEGIN
  -- Adicionar +10 pontos fixos por missão educacional
  UPDATE profiles
  SET 
    score_verde = score_verde + 10,
    missoes_concluidas = missoes_concluidas + 1
  WHERE id = p_usuario_id
  RETURNING score_verde INTO v_score_atual;
  
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
  
  -- Conceder +20 pontos ao indicador se aplicável
  UPDATE profiles
  SET score_verde = score_verde + 20
  WHERE id IN (
    SELECT id_indicador FROM indicacoes
    WHERE id_indicado = p_usuario_id 
      AND pontos_primeira_missao_concedidos = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM missoes_usuarios mu2
        WHERE mu2.id_usuario = p_usuario_id
        AND mu2.id_missao != p_missao_id
      )
  );
  
  RETURN json_build_object(
    'success', true,
    'pontos_concedidos', 10,
    'score_total', v_score_atual
  );
END;
$$;

-- 4. Função para validar NF e conceder +50 pontos
CREATE OR REPLACE FUNCTION validar_nota_fiscal(
  p_nota_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_score_atual INTEGER;
  v_status_atual status_validacao;
BEGIN
  -- Verificar se NF já foi validada
  SELECT status_validacao INTO v_status_atual
  FROM notas_fiscais
  WHERE id = p_nota_id AND id_usuario = p_usuario_id;
  
  IF v_status_atual = 'valida' THEN
    RETURN json_build_object('success', false, 'error', 'NF já validada anteriormente');
  END IF;
  
  -- Marcar como válida
  UPDATE notas_fiscais
  SET status_validacao = 'valida'
  WHERE id = p_nota_id;
  
  -- Conceder +50 pontos
  UPDATE profiles
  SET score_verde = score_verde + 50
  WHERE id = p_usuario_id
  RETURNING score_verde INTO v_score_atual;
  
  RETURN json_build_object(
    'success', true,
    'pontos_concedidos', 50,
    'score_total', v_score_atual
  );
END;
$$;

-- 5. Tabela de pontos por material (6kg base)
CREATE TABLE IF NOT EXISTS materiais_pontuacao (
  tipo_material TEXT PRIMARY KEY,
  pontos_por_6kg INTEGER NOT NULL
);

INSERT INTO materiais_pontuacao (tipo_material, pontos_por_6kg) VALUES
  ('Vidro', 26),
  ('Ferro/Sucata', 18),
  ('Misto', 20),
  ('Papelão', 32),
  ('PP', 30),
  ('PEAD', 34),
  ('PET', 40),
  ('Alumínio', 60)
ON CONFLICT (tipo_material) DO UPDATE SET pontos_por_6kg = EXCLUDED.pontos_por_6kg;

-- 6. Função/trigger para calcular pontos de entrega validada
CREATE OR REPLACE FUNCTION calcular_pontos_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_pontos_por_6kg INTEGER;
  v_pontos_calculados INTEGER;
BEGIN
  -- Só calcular se mudou para 'validada'
  IF NEW.status = 'validada' AND (OLD.status IS NULL OR OLD.status != 'validada') THEN
    -- Buscar pontos do material
    SELECT pontos_por_6kg INTO v_pontos_por_6kg
    FROM materiais_pontuacao
    WHERE tipo_material = NEW.tipo_material;
    
    IF v_pontos_por_6kg IS NULL THEN
      v_pontos_por_6kg := 20; -- Padrão para material não cadastrado
    END IF;
    
    -- Fórmula: peso_validado * (pontos_por_6kg / 6)
    v_pontos_calculados := ROUND(NEW.peso_validado * (v_pontos_por_6kg::NUMERIC / 6));
    
    -- Adicionar pontos ao usuário
    UPDATE profiles
    SET score_verde = score_verde + v_pontos_calculados
    WHERE id = NEW.id_usuario;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pontos_entrega ON entregas_reciclaveis;

CREATE TRIGGER trigger_pontos_entrega
AFTER INSERT OR UPDATE OF status, peso_validado ON entregas_reciclaveis
FOR EACH ROW
EXECUTE FUNCTION calcular_pontos_entrega();

-- 7. Atualizar função de resgate para usar pontos
DROP FUNCTION IF EXISTS resgatar_cupom(UUID, UUID);

CREATE OR REPLACE FUNCTION resgatar_cupom(
  p_cupom_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_quantidade_disponivel INTEGER;
  v_pontos_necessarios INTEGER;
  v_valor_reais NUMERIC;
  v_score_usuario INTEGER;
  v_codigo_base TEXT;
  v_codigo_unico TEXT;
  v_marketplace TEXT;
  v_data_validade DATE;
  v_ativo BOOLEAN;
BEGIN
  -- Lock no cupom
  SELECT 
    quantidade_disponivel, 
    pontos_necessarios,
    valor_reais,
    codigo, 
    marketplace,
    data_validade,
    ativo
  INTO 
    v_quantidade_disponivel, 
    v_pontos_necessarios,
    v_valor_reais,
    v_codigo_base, 
    v_marketplace,
    v_data_validade,
    v_ativo
  FROM cupons
  WHERE id = p_cupom_id
  FOR UPDATE;
  
  IF NOT v_ativo THEN
    RETURN json_build_object('success', false, 'error', 'Cupom inativo');
  END IF;
  
  IF v_data_validade IS NOT NULL AND v_data_validade < CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'Cupom expirado');
  END IF;
  
  IF v_quantidade_disponivel <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cupom esgotado');
  END IF;
  
  -- Verificar pontos do usuário
  SELECT score_verde INTO v_score_usuario
  FROM profiles
  WHERE id = p_usuario_id
  FOR UPDATE;
  
  IF v_score_usuario < v_pontos_necessarios THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Pontos insuficientes',
      'pontos_necessarios', v_pontos_necessarios,
      'pontos_disponiveis', v_score_usuario
    );
  END IF;
  
  -- Gerar código único
  v_codigo_unico := v_codigo_base || '-' || UPPER(substring(md5(random()::text) from 1 for 8));
  
  -- Decrementar estoque
  UPDATE cupons
  SET 
    quantidade_disponivel = quantidade_disponivel - 1,
    quantidade_resgatada = quantidade_resgatada + 1
  WHERE id = p_cupom_id;
  
  -- Decrementar pontos e manter créditos_resgate para compatibilidade
  UPDATE profiles
  SET 
    score_verde = score_verde - v_pontos_necessarios,
    creditos_resgate = creditos_resgate + v_valor_reais,
    cupons_resgatados = cupons_resgatados + 1
  WHERE id = p_usuario_id;
  
  -- Inserir resgate
  INSERT INTO cupons_resgates (
    id_cupom, 
    id_usuario, 
    codigo_unico, 
    pontos_utilizados
  )
  VALUES (
    p_cupom_id, 
    p_usuario_id, 
    v_codigo_unico, 
    v_pontos_necessarios
  );
  
  RETURN json_build_object(
    'success', true,
    'codigo_unico', v_codigo_unico,
    'marketplace', v_marketplace,
    'valor_reais', v_valor_reais,
    'pontos_utilizados', v_pontos_necessarios,
    'pontos_restantes', v_score_usuario - v_pontos_necessarios
  );
END;
$$;

-- 8. Função para registrar indicação (+40 pontos no cadastro)
CREATE OR REPLACE FUNCTION registrar_indicacao(
  p_codigo_indicacao TEXT,
  p_usuario_novo_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_id_indicador UUID;
BEGIN
  -- Buscar indicador pelo código (assumindo que código = user_id por enquanto)
  v_id_indicador := p_codigo_indicacao::UUID;
  
  -- Verificar se indicador existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_id_indicador) THEN
    RETURN json_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;
  
  -- Criar registro de indicação
  INSERT INTO indicacoes (id_indicador, id_indicado, pontos_cadastro_concedidos)
  VALUES (v_id_indicador, p_usuario_novo_id, TRUE);
  
  -- Conceder +40 pontos ao indicador
  UPDATE profiles
  SET score_verde = score_verde + 40
  WHERE id = v_id_indicador;
  
  RETURN json_build_object('success', true, 'pontos_concedidos', 40);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Usuário já foi indicado');
END;
$$;