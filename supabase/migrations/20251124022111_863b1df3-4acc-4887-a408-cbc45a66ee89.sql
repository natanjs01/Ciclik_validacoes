-- Remover política antiga de visualização de cupons
DROP POLICY IF EXISTS "Usuários veem cupons ativos com estoque" ON cupons;

-- Criar nova política incluindo verificação de status = 'disponivel'
CREATE POLICY "Usuários veem cupons disponíveis com estoque"
ON cupons
FOR SELECT
TO authenticated
USING (
  ativo = true 
  AND status = 'disponivel'
  AND quantidade_disponivel > 0 
  AND (data_validade IS NULL OR data_validade >= CURRENT_DATE)
);