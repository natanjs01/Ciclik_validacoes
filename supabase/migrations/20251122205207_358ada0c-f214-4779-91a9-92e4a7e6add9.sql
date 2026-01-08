-- Garantir RLS seguro e funcional em respostas_quiz
ALTER TABLE public.respostas_quiz ENABLE ROW LEVEL SECURITY;

-- Apagar políticas existentes se houver
DROP POLICY IF EXISTS "Usuarios podem ver suas respostas de quiz" ON public.respostas_quiz;
DROP POLICY IF EXISTS "Usuarios podem inserir suas respostas de quiz" ON public.respostas_quiz;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas respostas de quiz" ON public.respostas_quiz;
DROP POLICY IF EXISTS "Usuarios podem apagar suas respostas de quiz" ON public.respostas_quiz;

-- Permitir que cada usuário veja apenas suas próprias respostas
CREATE POLICY "Usuarios podem ver suas respostas de quiz"
ON public.respostas_quiz
FOR SELECT
USING (id_usuario = auth.uid());

-- Permitir que cada usuário insira apenas respostas em seu próprio id
CREATE POLICY "Usuarios podem inserir suas respostas de quiz"
ON public.respostas_quiz
FOR INSERT
WITH CHECK (id_usuario = auth.uid());

-- Permitir que cada usuário atualize apenas suas próprias respostas
CREATE POLICY "Usuarios podem atualizar suas respostas de quiz"
ON public.respostas_quiz
FOR UPDATE
USING (id_usuario = auth.uid())
WITH CHECK (id_usuario = auth.uid());

-- Permitir que o usuário apague apenas suas respostas
CREATE POLICY "Usuarios podem apagar suas respostas de quiz"
ON public.respostas_quiz
FOR DELETE
USING (id_usuario = auth.uid());