-- Habilitar RLS na tabela materiais_pontuacao
ALTER TABLE materiais_pontuacao ENABLE ROW LEVEL SECURITY;

-- Todos podem ver a tabela de pontuação
CREATE POLICY "Todos podem ver pontuação de materiais"
ON materiais_pontuacao FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Apenas admins podem modificar materiais"
ON materiais_pontuacao FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));