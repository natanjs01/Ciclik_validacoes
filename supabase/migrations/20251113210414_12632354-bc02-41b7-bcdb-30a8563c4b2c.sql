-- Adicionar campos opcionais de redes sociais à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT;