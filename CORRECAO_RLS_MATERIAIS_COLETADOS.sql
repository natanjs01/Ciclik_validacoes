-- ====================================================================
-- CORREÇÃO: Adicionar políticas RLS faltantes para materiais_coletados_detalhado
-- ====================================================================
-- PROBLEMA: Erro 400 ao carregar materiais na página cooperative/register-materials
-- CAUSA: Faltam políticas RLS para DELETE e UPDATE
-- DATA: 19/01/2026
-- ====================================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Cooperativas podem deletar seus materiais" ON materiais_coletados_detalhado;
DROP POLICY IF EXISTS "Cooperativas podem atualizar seus materiais" ON materiais_coletados_detalhado;

-- Política para DELETE: Cooperativas podem deletar materiais que elas registraram
CREATE POLICY "Cooperativas podem deletar seus materiais"
ON materiais_coletados_detalhado FOR DELETE
TO authenticated
USING (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
);

-- Política para UPDATE: Cooperativas podem atualizar materiais que elas registraram
CREATE POLICY "Cooperativas podem atualizar seus materiais"
ON materiais_coletados_detalhado FOR UPDATE
TO authenticated
USING (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
)
WITH CHECK (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
);

-- ====================================================================
-- VERIFICAÇÃO: Execute esta query para confirmar que as políticas foram criadas
-- ====================================================================
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'materiais_coletados_detalhado'
ORDER BY cmd, policyname;
*/
