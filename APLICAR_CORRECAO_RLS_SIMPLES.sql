-- ============================================================================
-- CORREÇÃO RÁPIDA: Adicionar política INSERT para cooperativas
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- Remover política antiga que causava problema
DROP POLICY IF EXISTS "Admins can manage all cooperatives" ON public.cooperativas;

-- Adicionar política de INSERT (resolve o erro)
CREATE POLICY "Admins podem inserir cooperativas"
ON public.cooperativas FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Adicionar política de UPDATE para admins
CREATE POLICY "Admins podem atualizar cooperativas"
ON public.cooperativas FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Adicionar política de DELETE para admins  
CREATE POLICY "Admins podem deletar cooperativas"
ON public.cooperativas FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Recriar política de SELECT (mantém lógica original)
CREATE POLICY "Admins podem visualizar todas cooperativas"
ON public.cooperativas FOR SELECT
USING (
  status = 'aprovada' 
  OR id_user = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);
