-- 🔧 CORREÇÃO DEFINITIVA: Trigger handle_new_user com suporte a TODOS os valores de tipo_pj_enum
-- Este script corrige o trigger para aceitar os novos valores: Condominio, Restaurante, Comercio, Servico, Industria, Outro

-- 1. Recriar a função handle_new_user com suporte completo a tipo_pj
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
  tipo_pj_value tipo_pj_enum;
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
  
  -- Processar tipo_pj se for PJ
  tipo_pj_value := NULL;
  
  IF COALESCE((NEW.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF') = 'PJ' THEN
    -- Converter string para enum tipo_pj_enum
    -- Aceita TODOS os valores: empresa, cooperativa, cdv_investidor, 
    -- Condominio, Restaurante, Comercio, Servico, Industria, Outro
    BEGIN
      tipo_pj_value := (NEW.raw_user_meta_data->>'tipo_pj')::tipo_pj_enum;
      RAISE NOTICE 'tipo_pj convertido com sucesso: %', tipo_pj_value;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao converter tipo_pj: %. Valor recebido: %', SQLERRM, NEW.raw_user_meta_data->>'tipo_pj';
        tipo_pj_value := NULL;
    END;
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
    tipo_pj_value
  )
  ON CONFLICT (id) DO NOTHING; -- Evita erro se já existe
  
  -- Inserir role (DEPOIS do profile) - verificar se já existe
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
  END IF;
  
  -- Processar indicação (se houver código de indicador)
  IF NEW.raw_user_meta_data->>'codigo_indicador' IS NOT NULL THEN
    BEGIN
      PERFORM registrar_indicacao(
        NEW.id, 
        NEW.raw_user_meta_data->>'codigo_indicador'
      );
      RAISE NOTICE 'Indicação registrada para user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao registrar indicação para user %: %', NEW.id, SQLERRM;
    END;
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
Suporta todos os valores de tipo_pj_enum: empresa, cooperativa, cdv_investidor,
Condominio, Restaurante, Comercio, Servico, Industria, Outro.
Também processa indicações via código de indicador.
Versão com tratamento completo de erros e ON CONFLICT.';

-- 4. Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger handle_new_user atualizado com suporte completo a tipo_pj_enum';
  RAISE NOTICE '✅ Valores suportados: empresa, cooperativa, cdv_investidor, Condominio, Restaurante, Comercio, Servico, Industria, Outro';
END $$;
