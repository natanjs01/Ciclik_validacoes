-- ⚡ CORREÇÃO RÁPIDA: Remove processamento de indicação do trigger
-- Execute este script no Supabase SQL Editor para resolver o timeout

-- Versão simplificada sem indicação (mais rápida)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  -- Contar usuários
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Definir role
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'usuario';
  END IF;
  
  -- Inserir profile
  INSERT INTO public.profiles (
    id, 
    nome, 
    email, 
    tipo_pessoa, 
    cep,
    cpf,
    cnpj,
    telefone,
    logradouro,
    bairro,
    cidade,
    uf,
    numero,
    complemento,
    tipo_pj
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF'),
    COALESCE(NEW.raw_user_meta_data->>'cep', '00000-000'),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'cnpj',
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'logradouro',
    NEW.raw_user_meta_data->>'bairro',
    NEW.raw_user_meta_data->>'cidade',
    NEW.raw_user_meta_data->>'uf',
    NEW.raw_user_meta_data->>'numero',
    NEW.raw_user_meta_data->>'complemento',
    (NEW.raw_user_meta_data->>'tipo_pj')::tipo_pj_enum
  );
  
  -- Inserir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;
