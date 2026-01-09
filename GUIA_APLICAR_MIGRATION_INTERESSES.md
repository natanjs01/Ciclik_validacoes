# 📋 Guia: Aplicar Migration de Interesses de Funcionalidades

## 🎯 O que esta migration faz

Cria a tabela `interesses_funcionalidades` para rastrear quando usuários demonstram interesse em funcionalidades que ainda não estão disponíveis na região deles. Isso permite:

- ✅ Coletar dados de demanda por região
- ✅ Planejar expansão baseada em interesse real
- ✅ Notificar usuários quando funcionalidade chegar na região deles
- ✅ Dashboard administrativo com relatórios de interesse por estado/cidade

## 📊 Estrutura da Tabela

```sql
interesses_funcionalidades (
  id              UUID PRIMARY KEY,
  id_usuario      UUID → profiles(id),
  funcionalidade  VARCHAR(100),  -- Ex: "nota_fiscal", "entregar"
  estado          VARCHAR(2),    -- Ex: "SP", "BA"
  cidade          VARCHAR(255),  -- Ex: "Salvador", "São Paulo"
  created_at      TIMESTAMP
)
```

## 🔒 Políticas RLS

1. **Usuários podem registrar interesse** - INSERT para auth.uid()
2. **Usuários podem ver próprios interesses** - SELECT para auth.uid()
3. **Admins podem ver todos os interesses** - SELECT para role='admin'

## 🚀 Como Aplicar

### Opção 1: Via Dashboard Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Ciclik**
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo:
   ```
   supabase/migrations/20260108_create_interesses_funcionalidades.sql
   ```
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. ✅ Verifique se apareceu: **Success. No rows returned**

### Opção 2: Via Supabase CLI

```powershell
# No terminal do VS Code (PowerShell):

# 1. Aplicar todas as migrations pendentes
supabase db push

# 2. Ou aplicar somente esta migration específica
supabase migration up --include-all
```

## ✅ Verificação

Execute no SQL Editor para confirmar que a tabela foi criada:

```sql
-- 1. Verificar se a tabela existe
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'interesses_funcionalidades';

-- 2. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'interesses_funcionalidades';

-- 3. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'interesses_funcionalidades';

-- 4. Testar inserção (substitua o UUID pelo seu)
INSERT INTO interesses_funcionalidades (
  id_usuario, 
  funcionalidade, 
  estado, 
  cidade
) VALUES (
  auth.uid(),
  'nota_fiscal',
  'SP',
  'São Paulo'
) RETURNING *;
```

## 🎨 Como os Tooltips Usam Esta Tabela

### Exemplo: Tooltip "Nota Fiscal"

Quando usuário clica em "Gostaria que chegasse aqui!":

```typescript
const handleRegisterInterest = async () => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("cidade, uf")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("interesses_funcionalidades")
    .insert({
      id_usuario: user.id,
      funcionalidade: "nota_fiscal",
      estado: profile.uf,
      cidade: profile.cidade
    });

  if (!error) {
    toast.success("Interesse registrado! Avisaremos quando chegar na sua região.");
  }
};
```

## 📊 Relatórios Úteis para Admins

```sql
-- Interesses por funcionalidade
SELECT funcionalidade, COUNT(*) as total_interessados
FROM interesses_funcionalidades
GROUP BY funcionalidade
ORDER BY total_interessados DESC;

-- Interesses por estado
SELECT estado, COUNT(*) as total_interessados
FROM interesses_funcionalidades
GROUP BY estado
ORDER BY total_interessados DESC;

-- Interesses por cidade (Top 20)
SELECT cidade, estado, COUNT(*) as total_interessados
FROM interesses_funcionalidades
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY total_interessados DESC
LIMIT 20;

-- Evolução temporal
SELECT 
  DATE_TRUNC('day', created_at) as dia,
  funcionalidade,
  COUNT(*) as registros
FROM interesses_funcionalidades
GROUP BY DATE_TRUNC('day', created_at), funcionalidade
ORDER BY dia DESC;
```

## 🎯 Próximos Passos

Após aplicar a migration:

1. ✅ Testar tooltips no dashboard do usuário
2. ✅ Verificar se registro de interesse funciona
3. ✅ Conferir se toast de confirmação aparece
4. ✅ Validar que interesse duplicado não é inserido (componente já verifica)
5. ✅ Criar dashboard admin para visualizar interesses (futuro)

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- A migration não foi aplicada ainda
- Execute os passos da seção "Como Aplicar"

### Erro: "permission denied for table"
- As políticas RLS não foram criadas corretamente
- Re-execute a migration completa

### Erro: "insert violates foreign key constraint"
- O usuário não tem perfil na tabela `profiles`
- Execute: `SELECT id, email FROM profiles WHERE id = auth.uid();`

## 📝 Notas Importantes

- ⚠️ Esta tabela **NÃO** bloqueia funcionalidades, apenas registra interesse
- ✅ Funcionalidades continuam funcionando normalmente onde estão disponíveis
- 📊 Dados são usados para decisões de expansão
- 🔒 RLS garante que usuários só vejam próprios interesses
- 👥 Admins podem ver todos para análise

---

**Criado em:** 08/01/2026  
**Arquivo Migration:** `supabase/migrations/20260108_create_interesses_funcionalidades.sql`  
**Componentes Relacionados:** `NotaFiscalTooltip`, `EntregarTooltip` em `UserDashboard.tsx`
