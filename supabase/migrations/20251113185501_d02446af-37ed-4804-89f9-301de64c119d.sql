-- Adicionar campo para apostila PDF na tabela missoes
ALTER TABLE public.missoes ADD COLUMN apostila_pdf_url TEXT;

-- Criar tabela para questões do quiz (múltiplas questões por missão)
CREATE TABLE public.questoes_missao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_missao UUID NOT NULL REFERENCES public.missoes(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  resposta_correta TEXT NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D')),
  ordem INTEGER NOT NULL DEFAULT 0
);

-- Habilitar RLS na tabela questoes_missao
ALTER TABLE public.questoes_missao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para questoes_missao
CREATE POLICY "Admins can manage all questions"
ON public.questoes_missao
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view questions from active missions"
ON public.questoes_missao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.missoes 
    WHERE missoes.id = questoes_missao.id_missao 
    AND (missoes.status = 'ativa' OR has_role(auth.uid(), 'admin'))
  )
);

-- Criar tabela para rastrear respostas do usuário
CREATE TABLE public.respostas_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_missao UUID NOT NULL REFERENCES public.missoes(id) ON DELETE CASCADE,
  id_questao UUID NOT NULL REFERENCES public.questoes_missao(id) ON DELETE CASCADE,
  resposta_usuario TEXT NOT NULL CHECK (resposta_usuario IN ('A', 'B', 'C', 'D')),
  correta BOOLEAN NOT NULL,
  data_resposta TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id_usuario, id_questao)
);

-- Habilitar RLS na tabela respostas_quiz
ALTER TABLE public.respostas_quiz ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para respostas_quiz
CREATE POLICY "Users can insert their own answers"
ON public.respostas_quiz
FOR INSERT
WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Users can view their own answers"
ON public.respostas_quiz
FOR SELECT
USING (auth.uid() = id_usuario OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all answers"
ON public.respostas_quiz
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Adicionar campos na tabela missoes_usuarios para rastrear progresso
ALTER TABLE public.missoes_usuarios ADD COLUMN percentual_acerto NUMERIC;
ALTER TABLE public.missoes_usuarios ADD COLUMN quiz_completo BOOLEAN DEFAULT false;