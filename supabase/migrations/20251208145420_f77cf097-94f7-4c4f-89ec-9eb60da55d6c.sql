-- Adicionar política para permitir que usuários excluam seus próprios materiais
CREATE POLICY "Usuários podem excluir seus próprios materiais" 
ON public.materiais_reciclaveis_usuario 
FOR DELETE 
USING (auth.uid() = id_usuario);