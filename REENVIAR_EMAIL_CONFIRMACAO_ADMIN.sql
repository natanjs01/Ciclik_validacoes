-- ===============================================
-- FUNÇÃO PARA ADMIN REENVIAR EMAIL DE CONFIRMAÇÃO
-- ===============================================
-- Esta função permite que admins reenviem o email de confirmação
-- para usuários que não receberam ou perderam o email original

-- IMPORTANTE: Execute esta função no Supabase SQL Editor
-- Dashboard > SQL Editor > Cole e execute

-- ===============================================
-- 1. CRIAR FUNÇÃO DE REENVIO
-- ===============================================

CREATE OR REPLACE FUNCTION reenviar_email_confirmacao_admin(usuario_email TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_email_confirmado BOOLEAN;
  v_resultado JSON;
BEGIN
  -- Buscar usuário pelo email
  SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as confirmado
  INTO 
    v_user_id,
    v_user_email,
    v_email_confirmado
  FROM auth.users
  WHERE email = usuario_email;

  -- Verificar se usuário existe
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar se email já foi confirmado
  IF v_email_confirmado THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já está confirmado',
      'user_id', v_user_id,
      'email', v_user_email
    );
  END IF;

  -- Log da ação
  RAISE NOTICE 'Reenviando email de confirmação para: % (ID: %)', v_user_email, v_user_id;

  -- Retornar sucesso (o Supabase enviará o email automaticamente)
  RETURN json_build_object(
    'success', true,
    'message', 'Solicitação de reenvio registrada. Use a função auth do Supabase para enviar o email.',
    'user_id', v_user_id,
    'email', v_user_email
  );

END;
$$;

-- ===============================================
-- 2. CRIAR FUNÇÃO PARA VERIFICAR STATUS DO EMAIL
-- ===============================================

CREATE OR REPLACE FUNCTION verificar_status_email(usuario_email TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_confirmado_em TIMESTAMP WITH TIME ZONE;
  v_criado_em TIMESTAMP WITH TIME ZONE;
  v_nome TEXT;
BEGIN
  -- Buscar informações do usuário
  SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at
  INTO 
    v_user_id,
    v_email,
    v_confirmado_em,
    v_criado_em
  FROM auth.users u
  WHERE u.email = usuario_email;

  -- Verificar se usuário existe
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Buscar nome do profile
  SELECT nome INTO v_nome
  FROM profiles
  WHERE id = v_user_id;

  -- Retornar informações
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'nome', v_nome,
    'email_confirmado', v_confirmado_em IS NOT NULL,
    'confirmado_em', v_confirmado_em,
    'criado_em', v_criado_em,
    'dias_desde_cadastro', EXTRACT(DAY FROM (NOW() - v_criado_em))
  );

END;
$$;

-- ===============================================
-- 3. CRIAR FUNÇÃO PARA FRONTEND (SEM SERVICE ROLE)
-- ===============================================

CREATE OR REPLACE FUNCTION verificar_status_email_frontend(usuario_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email TEXT;
  v_confirmado_em TIMESTAMP WITH TIME ZONE;
  v_criado_em TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar informações do usuário
  SELECT 
    email,
    email_confirmed_at,
    created_at
  INTO 
    v_email,
    v_confirmado_em,
    v_criado_em
  FROM auth.users
  WHERE id = usuario_id;

  -- Verificar se usuário existe
  IF v_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Retornar informações
  RETURN json_build_object(
    'success', true,
    'user_id', usuario_id,
    'email', v_email,
    'email_confirmado', v_confirmado_em IS NOT NULL,
    'confirmado_em', v_confirmado_em,
    'criado_em', v_criado_em
  );
END;
$$;

-- ===============================================
-- 3. PERMISSÕES
-- ===============================================

-- Garantir que apenas usuários autenticados podem executar
GRANT EXECUTE ON FUNCTION reenviar_email_confirmacao_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_status_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_status_email_frontend(UUID) TO authenticated;

-- ===============================================
-- 4. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ===============================================

COMMENT ON FUNCTION reenviar_email_confirmacao_admin IS 
'Permite que admins reenviem email de confirmação para usuários.
Uso: SELECT reenviar_email_confirmacao_admin(''usuario@email.com'');';

COMMENT ON FUNCTION verificar_status_email IS 
'Verifica o status de confirmação de email de um usuário pelo email.
Uso: SELECT verificar_status_email(''usuario@email.com'');';

COMMENT ON FUNCTION verificar_status_email_frontend IS 
'Verifica o status de confirmação de email de um usuário pelo ID (para frontend).
Uso no TypeScript: await supabase.rpc(''verificar_status_email_frontend'', { usuario_id: uuid });';

-- ===============================================
-- 5. TESTES DE VALIDAÇÃO
-- ===============================================

-- Teste 1: Verificar se as funções foram criadas
SELECT 
  proname as funcao,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname IN (
  'reenviar_email_confirmacao_admin', 
  'verificar_status_email',
  'verificar_status_email_frontend'
)
ORDER BY proname;

-- Resultado esperado: 3 linhas com security_definer = true

-- ===============================================
-- 📚 DOCUMENTAÇÃO DE USO
-- ===============================================

/*
COMO USAR NO CÓDIGO:

1. Verificar status do email:
   const { data, error } = await supabase.rpc('verificar_status_email', {
     usuario_email: 'usuario@email.com'
   });

2. Reenviar email (do lado do servidor/admin):
   const { data: result } = await supabase.rpc('reenviar_email_confirmacao_admin', {
     usuario_email: 'usuario@email.com'
   });

3. Depois de chamar reenviar_email_confirmacao_admin, 
   use a API do Supabase no frontend para realmente enviar:
   
   await supabase.auth.resend({
     type: 'signup',
     email: 'usuario@email.com'
   });

IMPORTANTE:
- A função SQL prepara o terreno, mas o reenvio real do email
  deve ser feito através da API do Supabase no frontend
- Isso é uma limitação de segurança do Supabase
- A função serve para validação e log
*/
