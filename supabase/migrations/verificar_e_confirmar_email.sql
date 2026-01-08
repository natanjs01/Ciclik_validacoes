-- 📧 Script para Verificar e Corrigir Email de Confirmação
-- Execute no Supabase SQL Editor

-- ========================================
-- PARTE 1: VERIFICAR STATUS ATUAL
-- ========================================

-- 1. Ver o usuário recém-criado
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmation_sent_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'nome' as nome
FROM auth.users 
WHERE email = 'natanjs01@gmail.com';

-- 2. Ver o profile criado
SELECT 
  id,
  nome,
  email,
  tipo_pessoa,
  cpf,
  telefone,
  cep,
  cidade,
  codigo_indicacao,
  created_at
FROM profiles 
WHERE email = 'natanjs01@gmail.com';

-- 3. Ver a role atribuída
SELECT 
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'natanjs01@gmail.com';

-- ========================================
-- PARTE 2: CONFIRMAR EMAIL MANUALMENTE
-- ========================================

-- Confirmar o email para poder fazer login
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'natanjs01@gmail.com'
AND email_confirmed_at IS NULL;

-- ========================================
-- PARTE 3: VERIFICAR SE FOI CONFIRMADO
-- ========================================

-- Verificar o resultado
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
    ELSE '❌ Não Confirmado'
  END as status
FROM auth.users 
WHERE email = 'natanjs01@gmail.com';

-- ========================================
-- PARTE 4: INFORMAÇÕES DE DEBUG
-- ========================================

-- Ver todos os usuários e seus status
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅'
    ELSE '❌'
  END as confirmado,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'nome' as nome
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Ver configuração de confirmação de email (se disponível)
SELECT 
  name,
  value
FROM auth.config
WHERE name LIKE '%email%' OR name LIKE '%confirm%';
