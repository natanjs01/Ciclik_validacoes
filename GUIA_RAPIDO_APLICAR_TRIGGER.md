# 🚀 GUIA RÁPIDO: Aplicar Correções no Supabase

## ⚡ Passo a Passo (5 minutos)

### 1️⃣ Acessar Supabase Dashboard
```
https://supabase.com/dashboard/project/[SEU_PROJECT_ID]
```

### 2️⃣ Abrir SQL Editor
- Menu lateral → **SQL Editor**
- Clicar em **+ New query**

### 3️⃣ Copiar e Executar o SQL
Abra o arquivo: `APLICAR_TRIGGER_LIMITE_100_CONSULTAS.sql`

**Cole TODO o conteúdo** (linhas 1-137) e clique em **RUN** (ou Ctrl+Enter)

### 4️⃣ Verificar se Funcionou
Execute esta query:
```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validar_limite_consultas';
```

**✅ Resultado esperado:**
```
trigger_name                         | event_manipulation | action_timing
-------------------------------------|--------------------|--------------
trigger_validar_limite_consultas     | INSERT             | BEFORE
```

### 5️⃣ Testar Função de Contagem
```sql
SELECT contar_consultas_hoje();
```

**✅ Deve retornar:** Um número (ex: 0, 5, 42...) - suas consultas de hoje

---

## 🎨 Frontend (Já Aplicado)

As mudanças no frontend já foram deployadas:
- ✅ Ordenação por prioridade QRCODE
- ✅ Estrela dourada ⭐ nos produtos QR Code
- ✅ Query otimizada

**Basta fazer deploy normal:**
```bash
npm run build
# ou
vercel --prod
# ou seu processo de deploy habitual
```

---

## ✅ Checklist Final

- [ ] Executei o SQL no Supabase
- [ ] Verifiquei que trigger existe (query acima)
- [ ] Testei função `contar_consultas_hoje()`
- [ ] Deploy do frontend realizado
- [ ] Testei na interface: produtos QRCODE aparecem com estrela ⭐

---

## 📞 Em Caso de Problemas

### Erro ao executar SQL
**Causa:** Permissões insuficientes  
**Solução:** Usar conta owner/admin do Supabase

### Trigger não aparece
**Causa:** SQL não foi executado completamente  
**Solução:** Executar novamente TODO o conteúdo do arquivo

### Função não existe
**Causa:** Apenas parte do SQL foi executada  
**Solução:** Executar as 3 partes (função + trigger + índice)

---

**Tempo estimado:** 5 minutos ⏱️  
**Risco:** Baixíssimo (apenas cria trigger, não altera dados) ✅  
**Rollback:** Disponível no final do arquivo SQL 🔄
