-- 🔧 CORREÇÃO DEFINITIVA DO TRIGGER - Foco em Novos Cadastros
-- Remove qualquer referência a Lovable e foca na funcionalidade essencial

-- ============================================
-- PARTE 1: REMOVER TRIGGER ANTIGO
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- PARTE 2: CRIAR FUNÇÃO CORRIGIDA E OTIMIZADA
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
  v_tipo_pj tipo_pj_enum;
BEGIN
  -- Contar usuários existentes
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Primeiro usuário vira admin, resto é usuario
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'usuario';
  END IF;
  
  -- Tratar tipo_pj com segurança
  BEGIN
    IF NEW.raw_user_meta_data->>'tipo_pj' IS NOT NULL AND NEW.raw_user_meta_data->>'tipo_pj' != '' THEN
      v_tipo_pj := (NEW.raw_user_meta_data->>'tipo_pj')::tipo_pj_enum;
    ELSE
      v_tipo_pj := NULL;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_tipo_pj := NULL;
  END;
  
  -- Criar profile do usuário
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
    v_tipo_pj
  );
  
  -- Criar role do usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PARTE 3: CRIAR O TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 4: CORRIGIR USUÁRIO EXISTENTE
-- ============================================

-- Criar profile para o usuário que já existe mas não tem profile
DO $$
DECLARE
  v_user_id uuid;
  v_tipo_pj tipo_pj_enum;
BEGIN
  -- Buscar usuário sem profile
  SELECT u.id INTO v_user_id
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.email = 'natanjs01@gmail.com'
  AND p.id IS NULL;
  
  -- Se encontrou usuário sem profile, criar
  IF v_user_id IS NOT NULL THEN
    -- Preparar tipo_pj com segurança
    SELECT 
      CASE 
        WHEN u.raw_user_meta_data->>'tipo_pj' IS NOT NULL AND u.raw_user_meta_data->>'tipo_pj' != ''
        THEN (u.raw_user_meta_data->>'tipo_pj')::tipo_pj_enum
        ELSE NULL
      END INTO v_tipo_pj
    FROM auth.users u
    WHERE u.id = v_user_id;
    
    -- Criar profile
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
      complemento,
      tipo_pj
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
      u.raw_user_meta_data->>'complemento',
      v_tipo_pj
    FROM auth.users u
    WHERE u.id = v_user_id;
    
    -- Criar role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'usuario');
    
    -- Confirmar email
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = v_user_id
    AND email_confirmed_at IS NULL;
    
    RAISE NOTICE 'Profile criado com sucesso para usuário: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usuário já possui profile ou não existe';
  END IF;
END $$;

-- ============================================
-- PARTE 5: VERIFICAR RESULTADO
-- ============================================

-- Ver status do usuário
SELECT 
  'Usuario' as tipo,
  u.email,
  u.id::text as id,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN 'Confirmado' ELSE 'Pendente' END as status
FROM auth.users u
WHERE u.email = 'natanjs01@gmail.com'

UNION ALL

SELECT 
  'Profile' as tipo,
  p.email,
  p.id::text,
  'Criado' as status
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

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger otimizado para criar profile e role automaticamente ao cadastrar novos usuários.
Versão: 3.0 - Corrigida e simplificada
- Remove referências ao Lovable
- Tratamento seguro de tipo_pj
- Foco em funcionalidade essencial';
