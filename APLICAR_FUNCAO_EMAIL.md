# ⚠️ AÇÃO NECESSÁRIA: Aplicar Função no Supabase

## 🎯 O que fazer agora

O código já foi atualizado e publicado, mas você precisa **aplicar uma função SQL no Supabase** para que funcione completamente.

## 📋 Passo a Passo (5 minutos)

### 1️⃣ Abrir o Supabase Dashboard
```
https://supabase.com/dashboard
```
- Faça login
- Selecione o projeto **Ciclik**

### 2️⃣ Ir para SQL Editor
- Menu lateral esquerdo → **SQL Editor**
- Clicar em **New query** (botão verde no topo)

### 3️⃣ Copiar o SQL
Abra o arquivo: `CONFIRMAR_EMAIL_ADMIN.sql`

Ou copie direto aqui:

```sql
-- Copie TUDO abaixo e cole no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION confirmar_email_usuario(usuario_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = usuario_id
    AND email_confirmed_at IS NULL;
    
  RAISE NOTICE 'Email confirmado automaticamente para usuário %', usuario_id;
END;
$$;

GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;

COMMENT ON FUNCTION confirmar_email_usuario IS 
'Confirma automaticamente o email de um usuário criado pelo admin.';
```

### 4️⃣ Executar
- Colar o SQL no editor
- Clicar no botão **RUN** (▶️) no canto inferior direito
- Aguardar mensagem: ✅ **Success. No rows returned**

### 5️⃣ Validar
Execute este SQL para verificar:

```sql
SELECT 
  proname as nome_funcao,
  prosecdef as security_definer,
  proargtypes as parametros
FROM pg_proc 
WHERE proname = 'confirmar_email_usuario';
```

**Resultado esperado:**
- 1 linha retornada
- `nome_funcao`: confirmar_email_usuario
- `security_definer`: true

## ✅ Pronto!

Após aplicar, o sistema funcionará assim:

### Antes (❌ problema):
1. Admin cadastra operador
2. Sistema envia **2 emails**:
   - Email de confirmação
   - Email de redefinição de senha
3. Usuário fica confuso

### Depois (✅ corrigido):
1. Admin cadastra operador
2. Sistema confirma email automaticamente
3. Sistema envia **1 email apenas**:
   - Email de redefinição de senha
4. Usuário recebe link direto para definir senha

## 🧪 Como Testar

1. Acesse: https://natanjs01.github.io/Ciclik_validacoes/admin/operadores-logisticos
2. Clique em "Novo Operador Logístico"
3. Preencha com um email de teste
4. Salvar
5. ✅ Verifique a caixa de entrada: deve receber **apenas 1 email**

## 📝 Arquivos Relacionados

- ✅ Código atualizado: `src/pages/AdminOperadoresLogisticos.tsx`
- 📄 SQL para aplicar: `CONFIRMAR_EMAIL_ADMIN.sql`
- 📖 Documentação: `SOLUCAO_EMAIL_DUPLICADO_OPERADOR.md`

---

## ❓ Problemas?

### Erro ao executar SQL
- Verifique se está logado como **Owner** do projeto
- Tente executar linha por linha

### Função não encontrada depois
- Verifique se o SQL foi executado sem erros
- Execute o SQL de validação (passo 5️⃣)

### Ainda envia 2 emails
- A função precisa estar criada no Supabase
- Verifique os logs do console do navegador

---

**⏰ Tempo estimado:** 5 minutos  
**🔧 Dificuldade:** Fácil (copiar e colar)  
**✅ Status:** Código publicado | SQL pendente
