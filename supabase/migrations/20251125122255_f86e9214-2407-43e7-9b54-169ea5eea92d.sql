-- Adicionar coluna duracao_minutos à tabela missoes
ALTER TABLE missoes ADD COLUMN duracao_minutos INTEGER DEFAULT 10;

COMMENT ON COLUMN missoes.duracao_minutos IS 'Duração estimada do vídeo em minutos para registro no estoque de educação CDV';