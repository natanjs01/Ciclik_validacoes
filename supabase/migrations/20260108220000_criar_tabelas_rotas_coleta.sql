
-- ===========================================
-- SISTEMA DE ROTAS DE COLETA COM QR CODE FIXO
-- ===========================================

-- 1. Tabela principal de rotas
CREATE TABLE public.rotas_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  id_operador UUID REFERENCES cooperativas(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'bloqueada', 'inativa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de dias de coleta por rota
CREATE TABLE public.rotas_dias_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Domingo, 6=Sábado
  horario_inicio TIME,
  horario_fim TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_rota, dia_semana)
);

-- 3. Tabela de áreas de cobertura (ruas/bairros atendidos)
CREATE TABLE public.rotas_areas_cobertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  id_dia_coleta UUID REFERENCES rotas_dias_coleta(id) ON DELETE SET NULL,
  logradouro VARCHAR(200),
  bairro VARCHAR(100),
  cep VARCHAR(9),
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  complemento_endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de adesões dos usuários às rotas (com QR Code fixo)
CREATE TABLE public.usuarios_rotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  id_area UUID REFERENCES rotas_areas_cobertura(id) ON DELETE SET NULL,
  qrcode_adesao VARCHAR(50) NOT NULL UNIQUE,
  hash_qrcode VARCHAR(64) NOT NULL,
  endereco_coleta TEXT NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'cancelada')),
  data_adesao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_usuario, id_rota)
);

-- 5. Adicionar colunas na tabela entregas_reciclaveis para vincular a rotas
ALTER TABLE public.entregas_reciclaveis 
ADD COLUMN IF NOT EXISTS id_rota UUID REFERENCES rotas_coleta(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS id_adesao_rota UUID REFERENCES usuarios_rotas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) DEFAULT 'avulsa' CHECK (tipo_entrega IN ('avulsa', 'rota'));

-- 6. Índices para performance
CREATE INDEX idx_rotas_coleta_status ON rotas_coleta(status);
CREATE INDEX idx_rotas_coleta_operador ON rotas_coleta(id_operador);
CREATE INDEX idx_rotas_dias_rota ON rotas_dias_coleta(id_rota);
CREATE INDEX idx_rotas_areas_rota ON rotas_areas_cobertura(id_rota);
CREATE INDEX idx_rotas_areas_cidade_uf ON rotas_areas_cobertura(cidade, uf);
CREATE INDEX idx_rotas_areas_cep ON rotas_areas_cobertura(cep);
CREATE INDEX idx_usuarios_rotas_usuario ON usuarios_rotas(id_usuario);
CREATE INDEX idx_usuarios_rotas_rota ON usuarios_rotas(id_rota);
CREATE INDEX idx_usuarios_rotas_qrcode ON usuarios_rotas(qrcode_adesao);
CREATE INDEX idx_entregas_tipo ON entregas_reciclaveis(tipo_entrega);
CREATE INDEX idx_entregas_rota ON entregas_reciclaveis(id_rota);

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_rotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_rotas_coleta_updated_at
  BEFORE UPDATE ON rotas_coleta
  FOR EACH ROW EXECUTE FUNCTION update_rotas_updated_at();

CREATE TRIGGER tr_usuarios_rotas_updated_at
  BEFORE UPDATE ON usuarios_rotas
  FOR EACH ROW EXECUTE FUNCTION update_rotas_updated_at();

-- 8. Função para gerar QR Code único de adesão
CREATE OR REPLACE FUNCTION gerar_qrcode_adesao_rota()
RETURNS TEXT AS $$
DECLARE
  v_codigo TEXT;
  v_existe BOOLEAN;
BEGIN
  LOOP
    v_codigo := 'ROTA-' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM usuarios_rotas WHERE qrcode_adesao = v_codigo) INTO v_existe;
    EXIT WHEN NOT v_existe;
  END LOOP;
  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. RLS - Habilitar
ALTER TABLE rotas_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas_dias_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas_areas_cobertura ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_rotas ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS - rotas_coleta
CREATE POLICY "Rotas ativas são visíveis para todos autenticados"
  ON rotas_coleta FOR SELECT TO authenticated
  USING (status = 'ativa' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem gerenciar rotas"
  ON rotas_coleta FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. Políticas RLS - rotas_dias_coleta
CREATE POLICY "Dias de coleta visíveis para todos autenticados"
  ON rotas_dias_coleta FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rotas_coleta r 
    WHERE r.id = id_rota 
    AND (r.status = 'ativa' OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins podem gerenciar dias de coleta"
  ON rotas_dias_coleta FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. Políticas RLS - rotas_areas_cobertura
CREATE POLICY "Áreas de cobertura visíveis para todos autenticados"
  ON rotas_areas_cobertura FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rotas_coleta r 
    WHERE r.id = id_rota 
    AND (r.status = 'ativa' OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins podem gerenciar áreas de cobertura"
  ON rotas_areas_cobertura FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. Políticas RLS - usuarios_rotas
CREATE POLICY "Usuários podem ver suas próprias adesões"
  ON usuarios_rotas FOR SELECT TO authenticated
  USING (id_usuario = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem criar suas próprias adesões"
  ON usuarios_rotas FOR INSERT TO authenticated
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias adesões"
  ON usuarios_rotas FOR UPDATE TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "Admins podem gerenciar todas as adesões"
  ON usuarios_rotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. Políticas RLS - Cooperativas podem ver adesões de suas rotas
CREATE POLICY "Cooperativas podem ver adesões de suas rotas"
  ON usuarios_rotas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rotas_coleta r
    JOIN cooperativas c ON c.id = r.id_operador
    WHERE r.id = id_rota AND c.id_user = auth.uid()
  ));
