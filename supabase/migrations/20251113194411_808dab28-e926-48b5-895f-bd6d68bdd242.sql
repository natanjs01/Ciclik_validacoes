-- 1. Adicionar campo de créditos ao perfil do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creditos_resgate NUMERIC DEFAULT 0;

-- 2. Adicionar campo de valor de crédito às missões
ALTER TABLE missoes ADD COLUMN IF NOT EXISTS valor_credito NUMERIC DEFAULT 0;

-- 3. Reestruturar tabela de cupons para controle de estoque
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS quantidade_total INTEGER DEFAULT 1;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS quantidade_disponivel INTEGER DEFAULT 1;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS quantidade_resgatada INTEGER DEFAULT 0;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS data_validade DATE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS limite_alerta INTEGER DEFAULT 10;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Remover campo que não faz sentido no novo modelo
ALTER TABLE cupons DROP COLUMN IF EXISTS plano_origem;

-- 4. Criar tabela de resgates para histórico detalhado
CREATE TABLE IF NOT EXISTS cupons_resgates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cupom UUID REFERENCES cupons(id) ON DELETE CASCADE NOT NULL,
  id_usuario UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  codigo_unico TEXT UNIQUE NOT NULL,
  valor_utilizado NUMERIC NOT NULL,
  data_resgate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_uso TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'resgatado' CHECK (status IN ('resgatado', 'usado', 'expirado')),
  qr_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_cupons_resgates_usuario ON cupons_resgates(id_usuario);
CREATE INDEX IF NOT EXISTS idx_cupons_resgates_cupom ON cupons_resgates(id_cupom);
CREATE INDEX IF NOT EXISTS idx_cupons_resgates_status ON cupons_resgates(status);

-- 5. Criar tabela de alertas administrativos
CREATE TABLE IF NOT EXISTS alertas_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cupom UUID REFERENCES cupons(id) ON DELETE CASCADE,
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('estoque_baixo', 'esgotado', 'expirando')),
  mensagem TEXT NOT NULL,
  data_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizado BOOLEAN DEFAULT FALSE,
  data_visualizacao TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alertas_nao_visualizados ON alertas_estoque(visualizado) WHERE visualizado = FALSE;

-- 6. Função para conceder créditos ao completar missão
CREATE OR REPLACE FUNCTION conceder_creditos_missao(
  p_usuario_id UUID,
  p_missao_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_credito NUMERIC;
  v_creditos_atuais NUMERIC;
BEGIN
  SELECT valor_credito INTO v_valor_credito
  FROM missoes
  WHERE id = p_missao_id;
  
  UPDATE profiles
  SET 
    creditos_resgate = creditos_resgate + v_valor_credito,
    missoes_concluidas = missoes_concluidas + 1,
    score_verde = score_verde + (v_valor_credito * 10)::INTEGER
  WHERE id = p_usuario_id
  RETURNING creditos_resgate INTO v_creditos_atuais;
  
  RETURN json_build_object(
    'success', true,
    'creditos_concedidos', v_valor_credito,
    'creditos_totais', v_creditos_atuais
  );
END;
$$;

-- 7. Função para resgatar cupom (atômica, sem race condition)
CREATE OR REPLACE FUNCTION resgatar_cupom(
  p_cupom_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quantidade_disponivel INTEGER;
  v_valor_cupom NUMERIC;
  v_creditos_usuario NUMERIC;
  v_codigo_base TEXT;
  v_codigo_unico TEXT;
  v_marketplace TEXT;
  v_data_validade DATE;
  v_ativo BOOLEAN;
BEGIN
  SELECT 
    quantidade_disponivel, 
    valor, 
    codigo, 
    marketplace,
    data_validade,
    ativo
  INTO 
    v_quantidade_disponivel, 
    v_valor_cupom, 
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
  
  SELECT creditos_resgate INTO v_creditos_usuario
  FROM profiles
  WHERE id = p_usuario_id
  FOR UPDATE;
  
  IF v_creditos_usuario < v_valor_cupom THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Créditos insuficientes',
      'creditos_necessarios', v_valor_cupom,
      'creditos_disponiveis', v_creditos_usuario
    );
  END IF;
  
  v_codigo_unico := v_codigo_base || '-' || UPPER(substring(md5(random()::text) from 1 for 8));
  
  UPDATE cupons
  SET 
    quantidade_disponivel = quantidade_disponivel - 1,
    quantidade_resgatada = quantidade_resgatada + 1
  WHERE id = p_cupom_id;
  
  UPDATE profiles
  SET 
    creditos_resgate = creditos_resgate - v_valor_cupom,
    cupons_resgatados = cupons_resgatados + 1
  WHERE id = p_usuario_id;
  
  INSERT INTO cupons_resgates (
    id_cupom, 
    id_usuario, 
    codigo_unico, 
    valor_utilizado
  )
  VALUES (
    p_cupom_id, 
    p_usuario_id, 
    v_codigo_unico, 
    v_valor_cupom
  );
  
  RETURN json_build_object(
    'success', true,
    'codigo_unico', v_codigo_unico,
    'marketplace', v_marketplace,
    'valor', v_valor_cupom,
    'creditos_restantes', v_creditos_usuario - v_valor_cupom
  );
END;
$$;

-- 8. Trigger para alertas de estoque baixo
CREATE OR REPLACE FUNCTION verificar_estoque_cupom()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quantidade_disponivel <= NEW.limite_alerta AND NEW.quantidade_disponivel > 0 THEN
    INSERT INTO alertas_estoque (id_cupom, tipo_alerta, mensagem)
    VALUES (
      NEW.id,
      'estoque_baixo',
      format('Cupom %s (%s) está com estoque baixo: %s restantes', 
        NEW.marketplace, NEW.codigo, NEW.quantidade_disponivel)
    );
  END IF;
  
  IF NEW.quantidade_disponivel = 0 AND OLD.quantidade_disponivel > 0 THEN
    INSERT INTO alertas_estoque (id_cupom, tipo_alerta, mensagem)
    VALUES (
      NEW.id,
      'esgotado',
      format('Cupom %s (%s) ESGOTADO!', NEW.marketplace, NEW.codigo)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_verificar_estoque ON cupons;
CREATE TRIGGER trigger_verificar_estoque
AFTER UPDATE OF quantidade_disponivel ON cupons
FOR EACH ROW
EXECUTE FUNCTION verificar_estoque_cupom();

-- 9. Função para expirar cupons automaticamente
CREATE OR REPLACE FUNCTION marcar_cupons_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cupons
  SET ativo = false
  WHERE data_validade < CURRENT_DATE AND ativo = true;
  
  UPDATE cupons_resgates cr
  SET status = 'expirado'
  FROM cupons c
  WHERE cr.id_cupom = c.id
    AND c.data_validade < CURRENT_DATE
    AND cr.status = 'resgatado';
END;
$$;

-- 10. Atualizar RLS Policies para cupons
DROP POLICY IF EXISTS "Admins can manage all coupons" ON cupons;
DROP POLICY IF EXISTS "Users can update coupons they redeem" ON cupons;
DROP POLICY IF EXISTS "Users can view available coupons" ON cupons;

CREATE POLICY "Admins têm acesso total aos cupons"
ON cupons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários veem cupons ativos com estoque"
ON cupons FOR SELECT
TO authenticated
USING (
  ativo = true 
  AND quantidade_disponivel > 0 
  AND (data_validade IS NULL OR data_validade >= CURRENT_DATE)
);

-- 11. RLS Policies para cupons_resgates
ALTER TABLE cupons_resgates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem todos os resgates"
ON cupons_resgates FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários veem seus resgates"
ON cupons_resgates FOR SELECT
TO authenticated
USING (id_usuario = auth.uid());

CREATE POLICY "Usuários podem marcar como usado"
ON cupons_resgates FOR UPDATE
TO authenticated
USING (id_usuario = auth.uid())
WITH CHECK (id_usuario = auth.uid());

-- 12. RLS Policies para alertas_estoque
ALTER TABLE alertas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins veem alertas"
ON alertas_estoque FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem marcar como visualizado"
ON alertas_estoque FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode criar alertas"
ON alertas_estoque FOR INSERT
TO authenticated
WITH CHECK (true);

-- 13. Índices para performance
CREATE INDEX IF NOT EXISTS idx_cupons_ativos_disponiveis ON cupons(ativo, quantidade_disponivel) 
  WHERE ativo = true AND quantidade_disponivel > 0;
CREATE INDEX IF NOT EXISTS idx_cupons_validade ON cupons(data_validade) 
  WHERE data_validade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cupons_marketplace ON cupons(marketplace);