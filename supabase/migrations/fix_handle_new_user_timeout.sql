-- CORREÇÃO URGENTE: Timeout no trigger handle_new_user
-- Problema: Trigger está demorando mais de 5 segundos, causando falha no cadastro
-- Solução: Simplificar e otimizar o trigger removendo operações desnecessárias

-- 1. Remover o trigger atual
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Criar versão otimizada da função (SEM logs para produção)
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
  
  -- Determinar role
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario');
  END IF;
  
  -- Inserir profile e role em uma única transação
  BEGIN
    -- Inserir no profiles
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
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, apenas lançar exceção sem processing adicional
      RAISE;
  END;
  
  -- Processar indicação de forma ASSÍNCRONA (não bloquear)
  -- Nota: A indicação será processada depois, não durante o cadastro
  IF NEW.raw_user_meta_data->>'codigo_indicador' IS NOT NULL THEN
    -- Agendar processamento assíncrono (usando pg_notify ou job)
    PERFORM pg_notify(
      'process_referral',
      json_build_object(
        'user_id', NEW.id,
        'codigo', NEW.raw_user_meta_data->>'codigo_indicador'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Criar função para processar indicações de forma assíncrona
-- Esta função pode ser chamada depois, sem bloquear o cadastro
CREATE OR REPLACE FUNCTION processar_indicacao_assincrona(
  p_user_id UUID,
  p_codigo_indicacao TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_id_indicador UUID;
BEGIN
  -- Buscar indicador pelo código
  SELECT id INTO v_id_indicador
  FROM profiles
  WHERE codigo_indicacao = UPPER(TRIM(p_codigo_indicacao));
  
  IF v_id_indicador IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código de indicação inválido');
  END IF;
  
  -- Não pode indicar a si mesmo
  IF v_id_indicador = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Você não pode usar seu próprio código');
  END IF;
  
  -- Criar registro de indicação
  INSERT INTO indicacoes (id_indicador, id_indicado, pontos_cadastro_concedidos)
  VALUES (v_id_indicador, p_user_id, TRUE);
  
  -- Conceder +40 pontos ao indicador
  UPDATE profiles
  SET score_verde = score_verde + 40
  WHERE id = v_id_indicador;
  
  RETURN json_build_object(
    'success', true, 
    'pontos_concedidos', 40,
    'indicador_id', v_id_indicador
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Usuário já foi indicado anteriormente');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro ao processar indicação');
END;
$$;

-- 5. Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Função trigger otimizada para criar profile e role rapidamente.
Indicações são processadas de forma assíncrona para não bloquear o cadastro.
Versão: 2.0 - Otimizada para evitar timeout';
