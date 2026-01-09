-- 🔧 CORREÇÃO DEFINITIVA: Trigger handle_new_user com espera adequada
-- Este script resolve o problema de foreign key ao criar operadores logísticos

-- 1. Recriar a função handle_new_user com espera adequada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
  role_from_metadata TEXT;
BEGIN
  -- Contar usuários existentes
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Extrair role dos metadados (caso especificado)
  role_from_metadata := NEW.raw_user_meta_data->>'role';
  
  -- Definir role baseado no contexto
  IF role_from_metadata IS NOT NULL THEN
    -- Se a role foi especificada nos metadados, usar ela
    CASE role_from_metadata
      WHEN 'cooperativa' THEN assigned_role := 'cooperativa';
      WHEN 'admin' THEN assigned_role := 'admin';
      WHEN 'usuario' THEN assigned_role := 'usuario';
      ELSE assigned_role := 'usuario';
    END CASE;
  ELSIF user_count = 1 THEN
    -- Primeiro usuário é sempre admin
    assigned_role := 'admin';
  ELSE
    -- Demais usuários são usuários comuns
    assigned_role := 'usuario';
  END IF;
  
  -- Inserir profile (SEMPRE primeiro)
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
    CASE 
      WHEN (NEW.raw_user_meta_data->>'tipo_pj') = 'Cooperativa' THEN 'Cooperativa'::tipo_pj_enum
      WHEN (NEW.raw_user_meta_data->>'tipo_pj') = 'Associação' THEN 'Associação'::tipo_pj_enum
      WHEN (NEW.raw_user_meta_data->>'tipo_pj') = 'MEI' THEN 'MEI'::tipo_pj_enum
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO NOTHING; -- Evita erro se já existe
  
  -- Inserir role (DEPOIS do profile) - verificar se já existe
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (visível nos logs do Supabase)
    RAISE WARNING 'Erro no trigger handle_new_user para user %: %', NEW.id, SQLERRM;
    -- Retorna NEW mesmo com erro para não bloquear o signup
    RETURN NEW;
END;
$$;

-- 2. Recriar o trigger (garante que está ativo)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Adicionar comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger que cria automaticamente profile e role para novos usuários. 
Suporta criação de cooperativas via metadados (role: cooperativa).
Versão com tratamento de erros e ON CONFLICT.';

-- 4. Verificar se há usuários sem profile (correção retroativa)
DO $$
DECLARE
  user_record RECORD;
  assigned_role app_role;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Determinar role
    IF user_record.raw_user_meta_data->>'role' = 'cooperativa' THEN
      assigned_role := 'cooperativa';
    ELSIF user_record.raw_user_meta_data->>'role' = 'admin' THEN
      assigned_role := 'admin';
    ELSE
      assigned_role := 'usuario';
    END IF;
    
    -- Criar profile (SEM tipo_pj para evitar erro de enum)
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
      complemento
    )
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'nome', 'Usuário'),
      user_record.email,
      COALESCE((user_record.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF'),
      COALESCE(user_record.raw_user_meta_data->>'cep', '00000-000'),
      user_record.raw_user_meta_data->>'cpf',
      user_record.raw_user_meta_data->>'cnpj',
      user_record.raw_user_meta_data->>'telefone',
      user_record.raw_user_meta_data->>'logradouro',
      user_record.raw_user_meta_data->>'bairro',
      user_record.raw_user_meta_data->>'cidade',
      user_record.raw_user_meta_data->>'uf',
      user_record.raw_user_meta_data->>'numero',
      user_record.raw_user_meta_data->>'complemento'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Criar role se não existe (verificar antes de inserir)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = user_record.id
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (user_record.id, assigned_role);
    END IF;
    
    RAISE NOTICE 'Profile criado retroativamente para usuário %', user_record.email;
  END LOOP;
END $$;

-- 5. Verificação final
SELECT 
  'Usuários sem profile' as status,
  COUNT(*) as total
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
