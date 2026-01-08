-- Criar enum para status da promessa de entrega
CREATE TYPE status_promessa_entrega AS ENUM ('ativa', 'em_coleta', 'finalizada', 'expirada', 'cancelada');

-- Criar enum para tipos de submaterial
CREATE TYPE tipo_submaterial AS ENUM (
  'PET', 'PP', 'PEAD', 'PEBD', 'PVC', 'PS', 'OUTROS_PLASTICOS',
  'VIDRO_TRANSPARENTE', 'VIDRO_COLORIDO', 'VIDRO_TEMPERADO',
  'PAPEL_BRANCO', 'PAPEL_COLORIDO', 'PAPELAO_ONDULADO',
  'ALUMINIO_LATA', 'ALUMINIO_PERFIL', 'ACO',
  'LAMINADO_CAFE', 'LAMINADO_SALGADINHO', 'LAMINADO_OUTROS',
  'REJEITO'
);

-- Tabela de promessas de entrega (evolução da entregas_reciclaveis)
ALTER TABLE entregas_reciclaveis 
  ADD COLUMN IF NOT EXISTS status_promessa status_promessa_entrega DEFAULT 'ativa',
  ADD COLUMN IF NOT EXISTS hash_qrcode TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS numero_whatsapp_conversa TEXT,
  ADD COLUMN IF NOT EXISTS conversa_iniciada_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS conversa_finalizada_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS logs_conversa JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS peso_rejeito_kg NUMERIC DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_entregas_hash_qrcode ON entregas_reciclaveis(hash_qrcode);
CREATE INDEX IF NOT EXISTS idx_entregas_status_promessa ON entregas_reciclaveis(status_promessa);
CREATE INDEX IF NOT EXISTS idx_entregas_whatsapp ON entregas_reciclaveis(numero_whatsapp_conversa);

-- Tabela para registro detalhado de materiais coletados
CREATE TABLE IF NOT EXISTS materiais_coletados_detalhado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrega UUID NOT NULL REFERENCES entregas_reciclaveis(id) ON DELETE CASCADE,
  id_cooperativa UUID NOT NULL REFERENCES cooperativas(id),
  tipo_material TEXT NOT NULL,
  subtipo_material tipo_submaterial NOT NULL,
  peso_kg NUMERIC NOT NULL CHECK (peso_kg > 0),
  registrado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  registrado_por_whatsapp TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para materiais coletados
CREATE INDEX IF NOT EXISTS idx_mat_coletados_entrega ON materiais_coletados_detalhado(id_entrega);
CREATE INDEX IF NOT EXISTS idx_mat_coletados_cooperativa ON materiais_coletados_detalhado(id_cooperativa);
CREATE INDEX IF NOT EXISTS idx_mat_coletados_tipo ON materiais_coletados_detalhado(tipo_material);
CREATE INDEX IF NOT EXISTS idx_mat_coletados_subtipo ON materiais_coletados_detalhado(subtipo_material);
CREATE INDEX IF NOT EXISTS idx_mat_coletados_data ON materiais_coletados_detalhado(registrado_em);

-- Tabela para controle de estado do chatbot por conversa
CREATE TABLE IF NOT EXISTS chatbot_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrega UUID NOT NULL REFERENCES entregas_reciclaveis(id) ON DELETE CASCADE,
  numero_whatsapp_cooperativa TEXT NOT NULL,
  estado_atual TEXT DEFAULT 'aguardando_material', -- aguardando_material, aguardando_submaterial, aguardando_peso, confirmando_mais
  ultimo_material_selecionado TEXT,
  ultimo_submaterial_selecionado tipo_submaterial,
  mensagens_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id_entrega)
);

-- Índice para conversas
CREATE INDEX IF NOT EXISTS idx_chatbot_entrega ON chatbot_conversas(id_entrega);
CREATE INDEX IF NOT EXISTS idx_chatbot_whatsapp ON chatbot_conversas(numero_whatsapp_cooperativa);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_conversas_updated_at
BEFORE UPDATE ON chatbot_conversas
FOR EACH ROW
EXECUTE FUNCTION update_chatbot_updated_at();

-- Função para calcular pontos totais de uma entrega finalizada
CREATE OR REPLACE FUNCTION calcular_pontos_entrega_finalizada(p_id_entrega UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_pontos INTEGER := 0;
  v_peso_total NUMERIC := 0;
  v_pontos_base INTEGER;
  v_tipo_material TEXT;
  v_peso NUMERIC;
  material_record RECORD;
BEGIN
  -- Iterar sobre todos os materiais coletados (exceto rejeito)
  FOR material_record IN 
    SELECT tipo_material, subtipo_material, SUM(peso_kg) as peso_total
    FROM materiais_coletados_detalhado
    WHERE id_entrega = p_id_entrega
      AND subtipo_material != 'REJEITO'
    GROUP BY tipo_material, subtipo_material
  LOOP
    -- Buscar pontos por kg do material
    SELECT pontos_por_6kg INTO v_pontos_base
    FROM materiais_pontuacao
    WHERE tipo_material = material_record.tipo_material;
    
    IF v_pontos_base IS NULL THEN
      v_pontos_base := 20; -- Padrão
    END IF;
    
    -- Calcular pontos: (peso * pontos) / 6
    v_total_pontos := v_total_pontos + ROUND((material_record.peso_total * v_pontos_base) / 6);
  END LOOP;
  
  RETURN v_total_pontos;
END;
$$;

-- RLS Policies para materiais_coletados_detalhado
ALTER TABLE materiais_coletados_detalhado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cooperativas veem seus registros" 
ON materiais_coletados_detalhado FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cooperativas 
    WHERE cooperativas.id = materiais_coletados_detalhado.id_cooperativa 
      AND cooperativas.id_user = auth.uid()
  )
);

CREATE POLICY "Usuários veem registros de suas entregas" 
ON materiais_coletados_detalhado FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM entregas_reciclaveis 
    WHERE entregas_reciclaveis.id = materiais_coletados_detalhado.id_entrega 
      AND entregas_reciclaveis.id_usuario = auth.uid()
  )
);

CREATE POLICY "Admins veem todos registros" 
ON materiais_coletados_detalhado FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir registros" 
ON materiais_coletados_detalhado FOR INSERT
WITH CHECK (true);

-- RLS Policies para chatbot_conversas
ALTER TABLE chatbot_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sistema gerencia conversas" 
ON chatbot_conversas FOR ALL
USING (true);

-- Atualizar função de expiração para usar novo status
CREATE OR REPLACE FUNCTION expirar_promessas_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar como expiradas as promessas com mais de 24h
  UPDATE entregas_reciclaveis
  SET status_promessa = 'expirada',
      status = 'expirada'
  WHERE data_geracao < (now() - interval '24 hours')
    AND status_promessa = 'ativa'
    AND status IN ('gerada', 'recebida');
    
  -- Liberar materiais de entregas expiradas
  UPDATE materiais_reciclaveis_usuario mru
  SET status = 'disponivel',
      id_entrega = NULL
  FROM entregas_reciclaveis er
  WHERE mru.id_entrega = er.id
    AND er.status_promessa = 'expirada'
    AND mru.status != 'disponivel';
END;
$$;