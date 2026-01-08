-- Adicionar enum para tipos de operador logístico
CREATE TYPE tipo_operador_logistico AS ENUM ('cooperativa', 'rota_ciclik', 'operador_parceiro');

-- Adicionar coluna tipo_operador à tabela cooperativas
ALTER TABLE cooperativas ADD COLUMN tipo_operador tipo_operador_logistico DEFAULT 'cooperativa';

-- Atualizar cooperativas existentes para tipo cooperativa
UPDATE cooperativas SET tipo_operador = 'cooperativa' WHERE tipo_operador IS NULL;

-- Tornar campo obrigatório
ALTER TABLE cooperativas ALTER COLUMN tipo_operador SET NOT NULL;

-- Adicionar índice para otimizar consultas por tipo
CREATE INDEX idx_cooperativas_tipo_operador ON cooperativas(tipo_operador);

-- Comentários para documentação
COMMENT ON COLUMN cooperativas.tipo_operador IS 'Tipo do operador logístico: cooperativa, rota_ciclik ou operador_parceiro';
COMMENT ON TYPE tipo_operador_logistico IS 'Tipos de operadores logísticos disponíveis no sistema';