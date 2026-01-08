-- 🚨 APLICAR IMEDIATAMENTE - Correção do Trigger
-- O usuário está sendo criado no auth.users mas o trigger está falhando

-- 1. VERIFICAR O PROBLEMA
-- Ver usuários que estão no auth mas não tem profile
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.id as profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'natanjs01@gmail.com';

-- Se profile_exists é NULL, o trigger falhou!

-- 2. DESABILITAR O TRIGGER ATUAL (que está falhando)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. CRIAR VERSÃO CORRIGIDA E SIMPLIFICADA
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
  -- Contar usuários (query rápida)
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Definir role
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'usuario';
  END IF;
  
  -- Inserir profile com tratamento de erro
  BEGIN
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
        WHEN NEW.raw_user_meta_data->>'tipo_pj' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'tipo_pj')::tipo_pj_enum
        ELSE NULL
      END
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro mas não bloquear
      RAISE WARNING 'Erro ao criar profile: % %', SQLERRM, SQLSTATE;
      -- Re-lançar o erro para o Supabase ver
      RAISE;
  END;
  
  -- Inserir role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar role: % %', SQLERRM, SQLSTATE;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$;

-- 4. RECRIAR O TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CRIAR PROFILE MANUALMENTE PARA O USUÁRIO EXISTENTE
-- (Se já existe o usuário mas sem profile)
INSERT INTO public.profiles (
  id,
  nome,
  email,
  tipo_pessoa,
  cep,
  cpf,
  telefone,
  logradouro,
  bairro,
  cidade,
  uf,
  numero,
  complemento
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'nome', 'Usuário'),
  u.email,
  COALESCE((u.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF'),
  COALESCE(u.raw_user_meta_data->>'cep', '00000-000'),
  u.raw_user_meta_data->>'cpf',
  u.raw_user_meta_data->>'telefone',
  u.raw_user_meta_data->>'logradouro',
  u.raw_user_meta_data->>'bairro',
  u.raw_user_meta_data->>'cidade',
  u.raw_user_meta_data->>'uf',
  u.raw_user_meta_data->>'numero',
  u.raw_user_meta_data->>'complemento'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'natanjs01@gmail.com'
AND p.id IS NULL;

-- 6. CRIAR ROLE PARA O USUÁRIO
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'usuario'::app_role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'natanjs01@gmail.com'
AND ur.user_id IS NULL;

-- 7. CONFIRMAR EMAIL DO USUÁRIO
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'natanjs01@gmail.com'
AND email_confirmed_at IS NULL;

-- 8. VERIFICAR SE TUDO FOI CRIADO
SELECT 
  'Usuario' as tipo,
  u.email,
  u.id::text as id,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM auth.users u
WHERE u.email = 'natanjs01@gmail.com'

UNION ALL

SELECT 
  'Profile' as tipo,
  p.email,
  p.id::text,
  '✅' as status
FROM profiles p
WHERE p.email = 'natanjs01@gmail.com'

UNION ALL

SELECT 
  'Role' as tipo,
  u.email,
  ur.user_id::text,
  ur.role::text as status
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'natanjs01@gmail.com';
