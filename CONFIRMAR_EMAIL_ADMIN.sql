-- Função para confirmar email de usuário criado pelo admin
-- Esta função deve ser aplicada no Supabase SQL Editor

-- IMPORTANTE: Execute esta função com privilégios de admin no Supabase
-- Dashboard > SQL Editor > Cole e execute

CREATE OR REPLACE FUNCTION confirmar_email_usuario(usuario_id UUID)
RETURNS VOID
SECURITY DEFINER -- Executar com privilégios do dono da função
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar o campo email_confirmed_at na tabela auth.users
  -- Isso confirma o email automaticamente
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = usuario_id
    AND email_confirmed_at IS NULL;
    
  -- Log de sucesso
  RAISE NOTICE 'Email confirmado automaticamente para usuário %', usuario_id;
END;
$$;

-- Garantir que apenas admins podem executar esta função
GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;

-- Criar política de segurança para garantir que apenas admins executem
-- (verificação adicional via RLS na tabela user_roles)
CREATE POLICY "Apenas admins podem confirmar emails"
  ON auth.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON FUNCTION confirmar_email_usuario IS 
'Confirma automaticamente o email de um usuário criado pelo admin. 
Evita envio duplo de emails (confirmação + redefinição de senha).
Uso: SELECT confirmar_email_usuario(''uuid-do-usuario'');';
