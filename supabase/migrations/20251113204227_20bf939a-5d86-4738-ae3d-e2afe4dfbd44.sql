-- Adicionar código único de indicação ao perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_codigo_indicacao ON profiles(codigo_indicacao);

-- Função para gerar código único de 8 caracteres
CREATE OR REPLACE FUNCTION gerar_codigo_indicacao()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_codigo TEXT;
  v_existe BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres alfanuméricos
    v_codigo := UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE codigo_indicacao = v_codigo) INTO v_existe;
    
    EXIT WHEN NOT v_existe;
  END LOOP;
  
  RETURN v_codigo;
END;
$$;

-- Atualizar profiles existentes sem código
UPDATE profiles 
SET codigo_indicacao = gerar_codigo_indicacao()
WHERE codigo_indicacao IS NULL;

-- Trigger para gerar código automaticamente em novos perfis
CREATE OR REPLACE FUNCTION trigger_gerar_codigo_indicacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.codigo_indicacao IS NULL THEN
    NEW.codigo_indicacao := gerar_codigo_indicacao();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_codigo_indicacao ON profiles;

CREATE TRIGGER trigger_auto_codigo_indicacao
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_gerar_codigo_indicacao();

-- Atualizar função handle_new_user para incluir código de indicação
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
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario');
  END IF;
  
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
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  -- Se foi indicado por alguém, registrar
  IF NEW.raw_user_meta_data->>'codigo_indicador' IS NOT NULL THEN
    PERFORM registrar_indicacao(
      NEW.raw_user_meta_data->>'codigo_indicador',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Melhorar função de registrar indicação para usar código em vez de UUID
CREATE OR REPLACE FUNCTION registrar_indicacao(
  p_codigo_indicacao TEXT,
  p_usuario_novo_id UUID
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
  IF v_id_indicador = p_usuario_novo_id THEN
    RETURN json_build_object('success', false, 'error', 'Você não pode usar seu próprio código');
  END IF;
  
  -- Criar registro de indicação
  INSERT INTO indicacoes (id_indicador, id_indicado, pontos_cadastro_concedidos)
  VALUES (v_id_indicador, p_usuario_novo_id, TRUE);
  
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