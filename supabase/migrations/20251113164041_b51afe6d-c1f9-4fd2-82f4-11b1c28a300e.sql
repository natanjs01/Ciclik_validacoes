-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('usuario', 'cooperativa', 'admin');
CREATE TYPE public.tipo_pessoa AS ENUM ('PF', 'PJ');
CREATE TYPE public.tipo_pj_enum AS ENUM ('Condominio', 'Restaurante', 'Comercio', 'Servico', 'Industria', 'Outro');
CREATE TYPE public.nivel_usuario AS ENUM ('Iniciante', 'Ativo', 'Guardiao Verde');
CREATE TYPE public.tipo_missao AS ENUM ('estudo', 'quiz', 'nota_fiscal', 'entrega_reciclaveis');
CREATE TYPE public.status_missao AS ENUM ('ativa', 'inativa');
CREATE TYPE public.status_cupom AS ENUM ('disponivel', 'reservado', 'usado');
CREATE TYPE public.status_validacao AS ENUM ('pendente', 'validada', 'reprovada');
CREATE TYPE public.status_entrega AS ENUM ('gerada', 'recebida', 'validada', 'fechada');
CREATE TYPE public.status_cooperativa AS ENUM ('pendente_aprovacao', 'aprovada', 'suspensa');
CREATE TYPE public.tipo_empresa AS ENUM ('Industria', 'Comercio_Online', 'Comercio_Fisico', 'Servico');
CREATE TYPE public.nivel_selo AS ENUM ('Bronze', 'Prata', 'Ouro', 'Nenhum');

-- Create profiles table (user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  tipo_pessoa tipo_pessoa NOT NULL,
  tipo_pj tipo_pj_enum,
  cpf TEXT,
  cnpj TEXT,
  cep TEXT NOT NULL,
  logradouro TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  numero TEXT,
  complemento TEXT,
  score_verde INTEGER DEFAULT 0,
  nivel nivel_usuario DEFAULT 'Iniciante',
  missoes_concluidas INTEGER DEFAULT 0,
  cupons_resgatados INTEGER DEFAULT 0,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_tipo_pj CHECK (
    (tipo_pessoa = 'PJ' AND tipo_pj IS NOT NULL) OR 
    (tipo_pessoa = 'PF' AND tipo_pj IS NULL)
  ),
  CONSTRAINT check_documento CHECK (
    (tipo_pessoa = 'PF' AND cpf IS NOT NULL AND cnpj IS NULL) OR 
    (tipo_pessoa = 'PJ' AND cnpj IS NOT NULL AND cpf IS NULL)
  )
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'usuario',
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create missoes table
CREATE TABLE public.missoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo tipo_missao NOT NULL,
  pontos INTEGER NOT NULL,
  status status_missao DEFAULT 'ativa',
  video_url TEXT,
  pergunta TEXT,
  alternativa_a TEXT,
  alternativa_b TEXT,
  alternativa_c TEXT,
  alternativa_d TEXT,
  resposta_correta TEXT CHECK (resposta_correta IN ('A', 'B', 'C', 'D')),
  ordem INTEGER NOT NULL DEFAULT 0
);

-- Create missoes_usuarios table
CREATE TABLE public.missoes_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_missao UUID NOT NULL REFERENCES public.missoes(id) ON DELETE CASCADE,
  data_conclusao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(id_usuario, id_missao)
);

-- Create cupons table
CREATE TABLE public.cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace TEXT NOT NULL,
  codigo TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  minimo_compra NUMERIC(10, 2) NOT NULL,
  status status_cupom DEFAULT 'disponivel',
  id_usuario_resgatou UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_resgate TIMESTAMP WITH TIME ZONE,
  data_uso TIMESTAMP WITH TIME ZONE,
  plano_origem TEXT NOT NULL
);

-- Create notas_fiscais table
CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imagem_nf TEXT NOT NULL,
  valor_total NUMERIC(10, 2),
  cnpj_estabelecimento TEXT,
  data_compra DATE,
  status_validacao status_validacao DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cooperativas table
CREATE TABLE public.cooperativas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  cep TEXT NOT NULL,
  logradouro TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  numero TEXT,
  complemento TEXT,
  status status_cooperativa DEFAULT 'pendente_aprovacao',
  capacidade_mensal_ton NUMERIC(10, 2),
  pontuacao_confiabilidade INTEGER DEFAULT 100
);

-- Create entregas_reciclaveis table
CREATE TABLE public.entregas_reciclaveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_cooperativa UUID NOT NULL REFERENCES public.cooperativas(id) ON DELETE CASCADE,
  tipo_material TEXT NOT NULL,
  peso_estimado NUMERIC(10, 2),
  peso_validado NUMERIC(10, 2),
  status status_entrega DEFAULT 'gerada',
  qrcode_id TEXT NOT NULL UNIQUE,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_recebimento TIMESTAMP WITH TIME ZONE,
  data_validacao TIMESTAMP WITH TIME ZONE
);

-- Create notas_fiscais_cooperativa table
CREATE TABLE public.notas_fiscais_cooperativa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_cooperativa UUID NOT NULL REFERENCES public.cooperativas(id) ON DELETE CASCADE,
  nf_xml TEXT,
  nf_pdf TEXT,
  data_emissao DATE NOT NULL,
  peso_total_nf NUMERIC(10, 2),
  status_validacao status_validacao DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create empresas table
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tipo_empresa tipo_empresa NOT NULL,
  nivel_selo_origem nivel_selo DEFAULT 'Nenhum',
  nivel_selo_venda_limpa nivel_selo DEFAULT 'Nenhum',
  percentual_recuperacao NUMERIC(5, 2),
  percentual_faturamento_verde NUMERIC(5, 2),
  plano_atual TEXT
);

-- Create kpis table
CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_referencia DATE NOT NULL UNIQUE,
  usuarios_totais INTEGER DEFAULT 0,
  usuarios_ativos INTEGER DEFAULT 0,
  missoes_concluidas_total INTEGER DEFAULT 0,
  notas_validas_total INTEGER DEFAULT 0,
  cupons_resgatados_total INTEGER DEFAULT 0,
  cupons_usados_total INTEGER DEFAULT 0,
  toneladas_validas NUMERIC(10, 2) DEFAULT 0,
  cooperativas_ativas INTEGER DEFAULT 0,
  empresas_parceiras INTEGER DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missoes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_reciclaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais_cooperativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for missoes
CREATE POLICY "Everyone can view active missions" ON public.missoes FOR SELECT USING (status = 'ativa' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage missions" ON public.missoes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for missoes_usuarios
CREATE POLICY "Users can view their own completed missions" ON public.missoes_usuarios FOR SELECT USING (auth.uid() = id_usuario);
CREATE POLICY "Users can insert their own mission completions" ON public.missoes_usuarios FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Admins can view all mission completions" ON public.missoes_usuarios FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cupons
CREATE POLICY "Users can view available coupons" ON public.cupons FOR SELECT USING (status = 'disponivel' OR id_usuario_resgatou = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update coupons they redeem" ON public.cupons FOR UPDATE USING (status = 'disponivel' OR id_usuario_resgatou = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all coupons" ON public.cupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notas_fiscais
CREATE POLICY "Users can view their own receipts" ON public.notas_fiscais FOR SELECT USING (auth.uid() = id_usuario OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own receipts" ON public.notas_fiscais FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Admins can manage all receipts" ON public.notas_fiscais FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cooperativas
CREATE POLICY "Everyone can view approved cooperatives" ON public.cooperativas FOR SELECT USING (status = 'aprovada' OR id_user = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Cooperatives can update their own data" ON public.cooperativas FOR UPDATE USING (auth.uid() = id_user);
CREATE POLICY "Admins can manage all cooperatives" ON public.cooperativas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for entregas_reciclaveis
CREATE POLICY "Users can view their own deliveries" ON public.entregas_reciclaveis FOR SELECT USING (auth.uid() = id_usuario OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own deliveries" ON public.entregas_reciclaveis FOR INSERT WITH CHECK (auth.uid() = id_usuario);
CREATE POLICY "Cooperatives can view deliveries to them" ON public.entregas_reciclaveis FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cooperativas WHERE cooperativas.id = entregas_reciclaveis.id_cooperativa AND cooperativas.id_user = auth.uid())
);
CREATE POLICY "Cooperatives can update deliveries to them" ON public.entregas_reciclaveis FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.cooperativas WHERE cooperativas.id = entregas_reciclaveis.id_cooperativa AND cooperativas.id_user = auth.uid())
);
CREATE POLICY "Admins can manage all deliveries" ON public.entregas_reciclaveis FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notas_fiscais_cooperativa
CREATE POLICY "Cooperatives can view their own receipts" ON public.notas_fiscais_cooperativa FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cooperativas WHERE cooperativas.id = notas_fiscais_cooperativa.id_cooperativa AND cooperativas.id_user = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Cooperatives can insert their own receipts" ON public.notas_fiscais_cooperativa FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cooperativas WHERE cooperativas.id = notas_fiscais_cooperativa.id_cooperativa AND cooperativas.id_user = auth.uid())
);
CREATE POLICY "Admins can manage all cooperative receipts" ON public.notas_fiscais_cooperativa FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for empresas
CREATE POLICY "Companies can view their own data" ON public.empresas FOR SELECT USING (auth.uid() = id_user OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Companies can update their own data" ON public.empresas FOR UPDATE USING (auth.uid() = id_user);
CREATE POLICY "Admins can manage all companies" ON public.empresas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kpis
CREATE POLICY "Admins can view KPIs" ON public.kpis FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage KPIs" ON public.kpis FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo_pessoa, cep)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_pessoa')::tipo_pessoa, 'PF'),
    COALESCE(NEW.raw_user_meta_data->>'cep', '00000-000')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'usuario'));
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user level based on score
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.score_verde >= 1000 THEN
    NEW.nivel := 'Guardiao Verde';
  ELSIF NEW.score_verde >= 300 THEN
    NEW.nivel := 'Ativo';
  ELSE
    NEW.nivel := 'Iniciante';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update level
CREATE TRIGGER update_level_on_score_change
  BEFORE UPDATE OF score_verde ON public.profiles
  FOR EACH ROW
  WHEN (OLD.score_verde IS DISTINCT FROM NEW.score_verde)
  EXECUTE FUNCTION public.update_user_level();