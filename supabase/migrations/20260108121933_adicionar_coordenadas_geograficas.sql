-- Adicionar coordenadas geográficas às tabelas cooperativas e profiles
ALTER TABLE cooperativas 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Índices para buscas geográficas otimizadas
CREATE INDEX IF NOT EXISTS idx_cooperativas_coords ON cooperativas(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_coords ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
