-- Corrige o search_path da função handle_new_user para ser imutável
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  -- Conta quantos usuários já existem
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Se for o primeiro usuário (count = 1, porque o trigger roda AFTER INSERT),
  -- ele é admin. Caso contrário, usa a role do metadata ou 'usuario'
  IF user_count = 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario');
  END IF;
  
  -- Cria o perfil
  INSERT INTO public.profiles (id, nome, email, tipo_pessoa, cep)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF'),
    COALESCE(NEW.raw_user_meta_data->>'cep', '00000-000')
  );
  
  -- Cria a role (admin para o primeiro, usuario para os demais)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;