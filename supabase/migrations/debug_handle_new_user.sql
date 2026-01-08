-- Adicionar logging à função handle_new_user para debug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
  v_codigo_indicacao TEXT;
BEGIN
  RAISE NOTICE '🚀 [TRIGGER] handle_new_user iniciado para user_id: %', NEW.id;
  RAISE NOTICE '📧 [TRIGGER] Email: %', NEW.email;
  RAISE NOTICE '📋 [TRIGGER] raw_user_meta_data: %', NEW.raw_user_meta_data;
  
  -- Contar usuários
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE '👥 [TRIGGER] Total de usuários: %', user_count;
  
  -- Determinar role
  IF user_count = 1 THEN
    assigned_role := 'admin';
    RAISE NOTICE '👑 [TRIGGER] Primeiro usuário - atribuindo role: admin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario');
    RAISE NOTICE '👤 [TRIGGER] Role atribuída: %', assigned_role;
  END IF;
  
  -- Tentar inserir no profiles
  BEGIN
    RAISE NOTICE '💾 [TRIGGER] Inserindo no profiles...';
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
    )
    RETURNING codigo_indicacao INTO v_codigo_indicacao;
    
    RAISE NOTICE '✅ [TRIGGER] Profile criado com sucesso! Código de indicação: %', v_codigo_indicacao;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ [TRIGGER] Erro ao criar profile: % %', SQLERRM, SQLSTATE;
      RAISE;
  END;
  
  -- Tentar inserir role
  BEGIN
    RAISE NOTICE '🎭 [TRIGGER] Inserindo role no user_roles...';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
    RAISE NOTICE '✅ [TRIGGER] Role inserida com sucesso!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ [TRIGGER] Erro ao inserir role: % %', SQLERRM, SQLSTATE;
      RAISE;
  END;
  
  -- Processar indicação se houver
  IF NEW.raw_user_meta_data->>'codigo_indicador' IS NOT NULL THEN
    BEGIN
      RAISE NOTICE '🎁 [TRIGGER] Processando indicação com código: %', NEW.raw_user_meta_data->>'codigo_indicador';
      PERFORM registrar_indicacao(
        NEW.raw_user_meta_data->>'codigo_indicador',
        NEW.id
      );
      RAISE NOTICE '✅ [TRIGGER] Indicação processada!';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ [TRIGGER] Erro ao processar indicação (não crítico): % %', SQLERRM, SQLSTATE;
        -- Não propagar o erro, pois a indicação é opcional
    END;
  END IF;
  
  RAISE NOTICE '🏁 [TRIGGER] handle_new_user finalizado com sucesso!';
  RETURN NEW;
END;
$$;

-- Comentário sobre como ver os logs
COMMENT ON FUNCTION public.handle_new_user() IS 
'Função trigger que cria profile e role para novos usuários. 
Para ver os logs no Supabase Studio:
1. Vá em Logs > Database Logs
2. Configure level para mostrar NOTICE
3. Filtre por "TRIGGER"';
