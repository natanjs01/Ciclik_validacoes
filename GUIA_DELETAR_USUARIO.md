# 🗑️ GUIA: Deletar Usuário do Supabase

**Data:** 09 de Janeiro de 2026  
**Usuário:** Natanael Bernardo da Silva  
**Email:** natanjd01@gmail.com  
**CPF:** 068.701.614-29  
**UUID:** `c5de6aa5-5e4a-4c25-8086-aa53a5cff226`

---

## ⚠️ ATENÇÃO

Esta operação é **IRREVERSÍVEL**! O usuário e todos os seus dados serão **PERMANENTEMENTE DELETADOS**.

---

## 📋 Opções de Execução

Você tem **2 arquivos SQL** para escolher:

### 1️⃣ `DELETAR_USUARIO_NATANAEL_SIMPLES.sql` (RECOMENDADO)

✅ **Use este arquivo para execução no Supabase Dashboard**

- Comandos simples e diretos
- Fácil de executar
- Sem blocos PL/pgSQL
- Ideal para iniciantes

### 2️⃣ `DELETAR_USUARIO.sql` (Avançado)

⚡ **Script completo com logs e tratamento de erros**

- Usa blocos `DO $$` (PL/pgSQL)
- Inclui mensagens de progresso
- Tratamento de exceções
- Versão genérica reutilizável

---

## 🚀 Como Executar no Supabase Dashboard

### Passo 1: Acessar SQL Editor

1. Abra o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**

### Passo 2: Executar Script

1. Cole o conteúdo do arquivo `DELETAR_USUARIO_NATANAEL_SIMPLES.sql`
2. Clique em **"Run"** (ou pressione `Ctrl + Enter`)
3. Aguarde a execução completa

### Passo 3: Verificar Deleção

Execute a query de verificação no final do arquivo:

```sql
SELECT 
    'auth.users' as tabela,
    COUNT(*) as registros
FROM auth.users 
WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226'

UNION ALL

SELECT 
    'profiles' as tabela,
    COUNT(*) as registros
FROM profiles 
WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226'

UNION ALL

SELECT 
    'user_roles' as tabela,
    COUNT(*) as registros
FROM user_roles 
WHERE user_id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';
```

**Resultado Esperado:**

| tabela | registros |
|--------|-----------|
| auth.users | 0 |
| profiles | 0 |
| user_roles | 0 |

✅ Se **todas as contagens** retornarem **0**, a deleção foi bem-sucedida!

---

## 📊 O que será deletado?

| Tabela | Descrição |
|--------|-----------|
| `pontos_mensais` | Pontos acumulados do usuário |
| `user_missions` | Missões realizadas |
| `entregas_reciclaveis` | Entregas de materiais recicláveis |
| `materiais_coletados_detalhado` | Detalhes dos materiais coletados |
| `materiais` | Materiais cadastrados pelo usuário |
| `user_coupons` | Cupons do usuário |
| `indicacoes` | Indicações feitas pelo usuário |
| `user_goals` | Metas do usuário |
| `user_actions` | Histórico de ações |
| `notifications` | Notificações do usuário |
| `profiles` | Profile do usuário |
| `user_roles` | Roles/permissões |
| `auth.users` | Registro de autenticação |

**Total:** 13 tabelas afetadas

---

## 🔒 Segurança: Executar com Transação

Se quiser **testar antes** de deletar permanentemente, use transações:

```sql
BEGIN;

-- Cole aqui todos os comandos DELETE

-- Para CANCELAR (desfazer):
ROLLBACK;

-- Para CONFIRMAR (deletar permanentemente):
COMMIT;
```

### Exemplo de uso:

```sql
BEGIN;

-- Deleta tudo
DELETE FROM pontos_mensais WHERE id_user = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';
DELETE FROM user_missions WHERE id_user = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';
-- ... outros comandos ...

-- Verifica se está tudo OK
SELECT * FROM profiles WHERE id = 'c5de6aa5-5e4a-4c25-8086-aa53a5cff226';

-- Se estiver OK, confirma:
COMMIT;

-- Se quiser cancelar:
-- ROLLBACK;
```

---

## 🛠️ Script Genérico (Para Outros Usuários)

Para deletar **outro usuário**, use este template:

```sql
-- Substitua o UUID abaixo pelo UUID do usuário que deseja deletar
DO $$
DECLARE
    v_user_id UUID := 'COLE_O_UUID_AQUI';
BEGIN
    DELETE FROM pontos_mensais WHERE id_user = v_user_id;
    DELETE FROM user_missions WHERE id_user = v_user_id;
    DELETE FROM materiais_coletados_detalhado 
    WHERE id_entrega IN (SELECT id FROM entregas_reciclaveis WHERE id_user = v_user_id);
    DELETE FROM entregas_reciclaveis WHERE id_user = v_user_id;
    DELETE FROM materiais WHERE id_user = v_user_id;
    DELETE FROM user_coupons WHERE id_user = v_user_id;
    DELETE FROM indicacoes WHERE id_indicador = v_user_id;
    DELETE FROM user_goals WHERE user_id = v_user_id;
    DELETE FROM user_actions WHERE user_id = v_user_id;
    DELETE FROM notifications WHERE user_id = v_user_id;
    DELETE FROM profiles WHERE id = v_user_id;
    DELETE FROM user_roles WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário deletado com sucesso!';
END $$;
```

---

## ❓ Troubleshooting

### Erro: "violates foreign key constraint"

**Causa:** Ainda existem registros relacionados em outras tabelas

**Solução:** Execute os DELETEs na ordem correta (como no script fornecido)

### Erro: "permission denied"

**Causa:** Usuário do Supabase sem permissão

**Solução:** Use uma conta com permissões de admin ou service_role

### Erro: "could not serialize access"

**Causa:** Outro processo está acessando os dados simultaneamente

**Solução:** Tente novamente em alguns segundos

---

## 📞 Suporte

Se tiver problemas ao executar o script:

1. Verifique se copiou o script completo
2. Confirme que está usando o SQL Editor do Supabase
3. Verifique se o UUID está correto
4. Tente executar os comandos um por vez

---

## ✅ Checklist de Execução

- [ ] Backup dos dados (se necessário)
- [ ] Confirmar UUID do usuário correto
- [ ] Abrir Supabase Dashboard → SQL Editor
- [ ] Colar script `DELETAR_USUARIO_NATANAEL_SIMPLES.sql`
- [ ] Executar script (Run)
- [ ] Executar query de verificação
- [ ] Confirmar que todas as contagens retornaram 0
- [ ] ✅ Deleção concluída com sucesso!

---

**⚠️ LEMBRE-SE: Esta operação NÃO pode ser desfeita!**

**🎯 Ciclik - Sistema de Gestão de Usuários**  
*Deleção segura e completa de usuários do Supabase*
