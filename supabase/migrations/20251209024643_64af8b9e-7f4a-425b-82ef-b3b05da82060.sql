-- Adicionar campo para rastrear marcos de notificação já enviados
ALTER TABLE cdv_quotas 
ADD COLUMN IF NOT EXISTS marcos_notificados jsonb DEFAULT '{"50": false, "80": false, "100": false}'::jsonb;