-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES profiles(id),
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON notificacoes;
CREATE POLICY "Users can view their own notifications"
  ON notificacoes FOR SELECT
  USING (auth.uid() = id_usuario);

-- Política para usuários marcarem como lida
DROP POLICY IF EXISTS "Users can update their own notifications" ON notificacoes;
CREATE POLICY "Users can update their own notifications"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = id_usuario);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
