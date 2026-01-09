# 🚀 GUIA PRÁTICO - Como Criar as Tabelas Faltantes

## 📋 Objetivo
Este guia vai te ajudar a criar as 4 tabelas faltantes do módulo de Rotas de Coleta no seu banco de dados Supabase.

---

## ⚠️ ANTES DE COMEÇAR

### 1. Fazer Backup do Banco de Dados
```bash
# Opção 1: Via Supabase Dashboard
# Vá em: Database → Backups → Create Backup

# Opção 2: Via Supabase CLI (se tiver configurado)
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### 2. Verificar Conexão
```bash
# Acessar o Supabase Dashboard
# URL: https://app.supabase.com/project/SEU_PROJECT_ID
```

---

## 🎯 MÉTODO 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Copiar o Arquivo SQL
Localize o arquivo:
```
eco-champion-circle-main_referencia_não_alterar_nada/
  supabase/migrations/
    20260107220147_e4675efc-54ad-44bd-9f90-c31e28443893.sql
```

### Passo 2: Abrir SQL Editor
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Menu lateral: **SQL Editor**
4. Clique em **New Query**

### Passo 3: Colar e Executar
1. Cole o conteúdo do arquivo SQL
2. Revise o código (se quiser)
3. Clique em **Run** (Ctrl + Enter)
4. Aguarde a execução

### Passo 4: Verificar Criação
Execute no SQL Editor:
```sql
-- Verificar se as tabelas foram criadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'rotas_coleta',
  'rotas_dias_coleta',
  'rotas_areas_cobertura',
  'usuarios_rotas'
)
ORDER BY tablename;

-- Deve retornar 4 linhas
```

### Passo 5: Verificar Colunas Adicionadas
```sql
-- Verificar se as novas colunas foram adicionadas em entregas_reciclaveis
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'entregas_reciclaveis' 
AND column_name IN ('id_rota', 'id_adesao_rota', 'tipo_entrega');

-- Deve retornar 3 linhas
```

---

## 🎯 MÉTODO 2: Via Supabase CLI (Avançado)

### Passo 1: Instalar Supabase CLI
```bash
# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via NPM (se preferir)
npm install -g supabase
```

### Passo 2: Fazer Login
```bash
supabase login
```

### Passo 3: Linkar Projeto
```bash
# Descobrir o project-ref
# Acesse: Dashboard → Settings → General → Reference ID

supabase link --project-ref SEU_PROJECT_REF
```

### Passo 4: Copiar Migration
```bash
# Copiar arquivo de migration
Copy-Item "eco-champion-circle-main_referencia_não_alterar_nada\supabase\migrations\20260107220147_e4675efc-54ad-44bd-9f90-c31e28443893.sql" "supabase\migrations\"
```

### Passo 5: Aplicar Migration
```bash
# Aplicar a migration
supabase db push

# Ou aplicar arquivo específico
supabase db push --include-all
```

### Passo 6: Verificar Status
```bash
# Ver migrations aplicadas
supabase migration list

# Ver diferenças (se houver)
supabase db diff
```

---

## 🎯 MÉTODO 3: Criar Manualmente (Não Recomendado)

Se preferir criar tabela por tabela manualmente:

### 1. rotas_coleta
```sql
CREATE TABLE public.rotas_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  id_operador UUID REFERENCES cooperativas(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'bloqueada', 'inativa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.rotas_coleta ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_rotas_coleta_status ON rotas_coleta(status);
CREATE INDEX idx_rotas_coleta_operador ON rotas_coleta(id_operador);
```

### 2. rotas_dias_coleta
```sql
CREATE TABLE public.rotas_dias_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  horario_inicio TIME,
  horario_fim TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_rota, dia_semana)
);

-- RLS
ALTER TABLE public.rotas_dias_coleta ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_rotas_dias_rota ON rotas_dias_coleta(id_rota);
```

### 3. rotas_areas_cobertura
```sql
CREATE TABLE public.rotas_areas_cobertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  id_dia_coleta UUID REFERENCES rotas_dias_coleta(id) ON DELETE SET NULL,
  logradouro VARCHAR(200),
  bairro VARCHAR(100),
  cep VARCHAR(9),
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  complemento_endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.rotas_areas_cobertura ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_rotas_areas_rota ON rotas_areas_cobertura(id_rota);
CREATE INDEX idx_rotas_areas_cidade_uf ON rotas_areas_cobertura(cidade, uf);
CREATE INDEX idx_rotas_areas_cep ON rotas_areas_cobertura(cep);
```

### 4. usuarios_rotas
```sql
CREATE TABLE public.usuarios_rotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_rota UUID NOT NULL REFERENCES rotas_coleta(id) ON DELETE CASCADE,
  id_area UUID REFERENCES rotas_areas_cobertura(id) ON DELETE SET NULL,
  qrcode_adesao VARCHAR(50) NOT NULL UNIQUE,
  hash_qrcode VARCHAR(64) NOT NULL,
  endereco_coleta TEXT NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'cancelada')),
  data_adesao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_usuario, id_rota)
);

-- RLS
ALTER TABLE public.usuarios_rotas ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_usuarios_rotas_usuario ON usuarios_rotas(id_usuario);
CREATE INDEX idx_usuarios_rotas_rota ON usuarios_rotas(id_rota);
CREATE INDEX idx_usuarios_rotas_qrcode ON usuarios_rotas(qrcode_adesao);
```

### 5. Adicionar Colunas em entregas_reciclaveis
```sql
ALTER TABLE public.entregas_reciclaveis 
ADD COLUMN IF NOT EXISTS id_rota UUID REFERENCES rotas_coleta(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS id_adesao_rota UUID REFERENCES usuarios_rotas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) DEFAULT 'avulsa' 
  CHECK (tipo_entrega IN ('avulsa', 'rota'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_entregas_tipo ON entregas_reciclaveis(tipo_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_rota ON entregas_reciclaveis(id_rota);
```

---

## ✅ VERIFICAÇÃO FINAL

Execute este script para verificar se tudo foi criado corretamente:

```sql
-- 1. Verificar tabelas criadas
SELECT 
  'rotas_coleta' as tabela,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rotas_coleta') 
    THEN '✅ Existe' 
    ELSE '❌ Não existe' 
  END as status
UNION ALL
SELECT 
  'rotas_dias_coleta',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rotas_dias_coleta') 
    THEN '✅ Existe' 
    ELSE '❌ Não existe' 
  END
UNION ALL
SELECT 
  'rotas_areas_cobertura',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rotas_areas_cobertura') 
    THEN '✅ Existe' 
    ELSE '❌ Não existe' 
  END
UNION ALL
SELECT 
  'usuarios_rotas',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'usuarios_rotas') 
    THEN '✅ Existe' 
    ELSE '❌ Não existe' 
  END;

-- 2. Verificar colunas adicionadas
SELECT 
  column_name,
  data_type,
  '✅' as status
FROM information_schema.columns 
WHERE table_name = 'entregas_reciclaveis' 
AND column_name IN ('id_rota', 'id_adesao_rota', 'tipo_entrega');

-- 3. Verificar RLS habilitado
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Habilitado' ELSE '❌ RLS Desabilitado' END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN (
  'rotas_coleta',
  'rotas_dias_coleta', 
  'rotas_areas_cobertura',
  'usuarios_rotas'
);

-- 4. Contar índices criados
SELECT 
  COUNT(*) as total_indices,
  '✅ Deve ser >= 10' as esperado
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'rotas_coleta',
  'rotas_dias_coleta',
  'rotas_areas_cobertura', 
  'usuarios_rotas',
  'entregas_reciclaveis'
)
AND indexname LIKE 'idx_%rota%';
```

**Resultado esperado:**
- 4 tabelas com status "✅ Existe"
- 3 colunas em entregas_reciclaveis
- 4 tabelas com RLS habilitado
- Pelo menos 10 índices criados

---

## 🎉 TESTE DE INSERÇÃO

Após criar as tabelas, teste com dados de exemplo:

```sql
-- 1. Inserir rota de teste
INSERT INTO rotas_coleta (nome, descricao, status)
VALUES ('Rota Teste', 'Rota de teste para validação', 'ativa')
RETURNING id;

-- Copie o ID retornado e use nas próximas queries
-- Exemplo: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

-- 2. Inserir dia de coleta
INSERT INTO rotas_dias_coleta (id_rota, dia_semana, horario_inicio, horario_fim)
VALUES (
  'SEU_ID_ROTA_AQUI',
  1, -- Segunda-feira
  '08:00',
  '12:00'
);

-- 3. Inserir área de cobertura
INSERT INTO rotas_areas_cobertura (id_rota, cidade, uf, bairro, cep)
VALUES (
  'SEU_ID_ROTA_AQUI',
  'São Paulo',
  'SP',
  'Centro',
  '01310-100'
);

-- 4. Verificar inserções
SELECT * FROM rotas_coleta WHERE nome = 'Rota Teste';
SELECT * FROM rotas_dias_coleta WHERE id_rota = 'SEU_ID_ROTA_AQUI';
SELECT * FROM rotas_areas_cobertura WHERE id_rota = 'SEU_ID_ROTA_AQUI';

-- 5. Limpar dados de teste (opcional)
DELETE FROM rotas_coleta WHERE nome = 'Rota Teste';
-- Os relacionamentos em CASCADE vão deletar dias e áreas automaticamente
```

---

## 🐛 TROUBLESHOOTING

### Erro: "relation already exists"
**Causa:** Tabela já foi criada anteriormente

**Solução:** Verificar se a tabela existe e se está completa
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'rotas_coleta';
```

### Erro: "foreign key violation"
**Causa:** Tentando criar relacionamento com tabela inexistente

**Solução:** Criar tabelas na ordem correta:
1. rotas_coleta
2. rotas_dias_coleta
3. rotas_areas_cobertura
4. usuarios_rotas

### Erro: "permission denied"
**Causa:** Sem permissão para criar tabelas

**Solução:** Verificar se está usando usuário correto no Supabase

### Erro: "syntax error"
**Causa:** SQL mal formatado

**Solução:** Copiar exatamente como está no arquivo original

---

## 📚 Documentos de Apoio

1. **TABELAS_ROTAS_FALTANTES.md** - Detalhes técnicos
2. **DIAGRAMA_RELACIONAMENTOS.md** - Ver como se relacionam
3. **RESUMO_EXECUTIVO.md** - Contexto geral

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas, me avise e eu posso:
1. ✅ Criar a migration para você
2. ✅ Debugar erros específicos
3. ✅ Validar a estrutura criada
4. ✅ Ajustar conforme necessário

---

## 🎯 Próximo Passo

Após criar as tabelas com sucesso:
1. ✅ Criar página `AdminInteresses.tsx`
2. ✅ Criar página `AdminRotasColeta.tsx`

---

**Criado em:** 08/01/2026  
**Versão:** 1.0  
**Status:** 📖 Guia Completo
