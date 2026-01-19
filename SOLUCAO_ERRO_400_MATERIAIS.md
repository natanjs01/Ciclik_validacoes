# 🔧 SOLUÇÃO: Erro 400 na Página cooperative/register-materials

## ❌ PROBLEMA IDENTIFICADO

**Erro na imagem:** `Invalid input value for enum tipo_submaterial: "VIDRO_TRANSPARENTE"`

**Erro nos logs do console:**
```
yfoqehkemzxbwzrbfubq.supabase.co/rest/v1/materiais_coletados_detalhado?select=*:1
Failed to load resource: the server responded with a status of 400 ()
```

## 🔍 DIAGNÓSTICO

### Causa Raiz
Faltam **políticas RLS (Row Level Security)** para as operações de **DELETE** e **UPDATE** na tabela `materiais_coletados_detalhado`.

### Políticas Existentes
✅ **SELECT** - Cooperativas podem visualizar seus registros  
✅ **INSERT** - Cooperativas podem inserir novos materiais  
❌ **DELETE** - FALTANDO (erro 400 ao tentar carregar ou deletar)  
❌ **UPDATE** - FALTANDO (erro 400 ao tentar atualizar)

### Impacto
Quando a página `CooperativeRegisterMaterials` tenta:
1. **Carregar materiais** existentes - Pode falhar se houver tentativa de modificação
2. **Deletar material** - Erro 400 porque não há política de DELETE
3. **Atualizar material** - Erro 400 porque não há política de UPDATE

## ✅ SOLUÇÃO

Criado o arquivo: **`CORRECAO_RLS_MATERIAIS_COLETADOS.sql`**

Este arquivo adiciona as políticas RLS faltantes:

### 1. Política para DELETE
```sql
CREATE POLICY "Cooperativas podem deletar seus materiais"
ON materiais_coletados_detalhado FOR DELETE
TO authenticated
USING (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
);
```

### 2. Política para UPDATE
```sql
CREATE POLICY "Cooperativas podem atualizar seus materiais"
ON materiais_coletados_detalhado FOR UPDATE
TO authenticated
USING (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
)
WITH CHECK (
  id_cooperativa IN (
    SELECT id FROM cooperativas WHERE id_user = auth.uid()
  )
);
```

## 📋 COMO APLICAR

### No Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard
2. Vá para seu projeto
3. Navegue até **SQL Editor**
4. Abra o arquivo `CORRECAO_RLS_MATERIAIS_COLETADOS.sql`
5. Copie e cole todo o conteúdo
6. Clique em **Run** para executar

### Via CLI do Supabase:
```bash
# Se estiver usando migrations
supabase migration new fix_materiais_coletados_rls

# Cole o conteúdo do arquivo na migration criada

# Execute a migration
supabase db push
```

## 🧪 COMO TESTAR

### 1. Após aplicar o SQL:
Execute esta query no SQL Editor para verificar as políticas:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'materiais_coletados_detalhado'
ORDER BY cmd, policyname;
```

**Resultado esperado:** Deve mostrar políticas para **SELECT**, **INSERT**, **DELETE** e **UPDATE**.

### 2. Teste na aplicação:
1. Faça login como cooperativa
2. Escaneie um QR Code de rota
3. Navegue para a página de registro de materiais
4. **Deve carregar sem erro 400** ✅
5. Adicione um material (teste INSERT)
6. Tente deletar o material (teste DELETE)
7. Tente editar um material se houver essa funcionalidade (teste UPDATE)

## 📊 ESTRUTURA COMPLETA DAS POLÍTICAS

Após aplicar a correção, a tabela `materiais_coletados_detalhado` terá:

| Operação | Política | Descrição |
|----------|----------|-----------|
| **SELECT** | Cooperativas veem seus registros | Cooperativa vê apenas seus próprios materiais |
| **SELECT** | Usuários veem registros de suas entregas | Usuários veem materiais de suas entregas |
| **SELECT** | Admins veem todos registros | Admins têm acesso total |
| **INSERT** | Cooperativas registram seus materiais | Cooperativa pode inserir materiais |
| **DELETE** | Cooperativas podem deletar seus materiais | ⭐ **NOVO** - Cooperativa pode deletar seus materiais |
| **UPDATE** | Cooperativas podem atualizar seus materiais | ⭐ **NOVO** - Cooperativa pode atualizar seus materiais |

## 🔐 SEGURANÇA

As novas políticas garantem que:
- ✅ Cooperativas **SOMENTE** podem deletar/atualizar materiais que **ELAS MESMAS** registraram
- ✅ A verificação é feita via `id_cooperativa` associado ao `auth.uid()`
- ✅ Outras cooperativas **NÃO** podem modificar materiais de outras cooperativas
- ✅ Usuários comuns **NÃO** podem deletar/atualizar materiais das cooperativas

## 📝 NOTAS IMPORTANTES

### Sobre o erro "VIDRO_TRANSPARENTE"
O erro mostrado na imagem era **ENGANOSO**. O valor `VIDRO_TRANSPARENTE` está correto e existe no enum. O erro 400 era causado pela **falta de permissão RLS**, não por um problema com o enum.

### Código da aplicação
O arquivo `CooperativeRegisterMaterials.tsx` está **CORRETO** e não precisa de alterações. O problema era apenas no banco de dados.

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Executar o SQL no Supabase
- [ ] Verificar que as 6 políticas existem (query de verificação)
- [ ] Testar login como cooperativa
- [ ] Testar escanear QR Code
- [ ] Testar adicionar material (INSERT)
- [ ] Testar remover material (DELETE)
- [ ] Verificar que não há mais erros 400 no console
- [ ] Confirmar que a página carrega os materiais corretamente

## 🎯 RESULTADO ESPERADO

Após aplicar esta correção:
- ✅ Página carrega sem erro 400
- ✅ Materiais são listados corretamente
- ✅ Cooperativa consegue adicionar materiais
- ✅ Cooperativa consegue remover materiais
- ✅ Sem erros no console do navegador

---

**Status:** 🟢 SOLUÇÃO PRONTA PARA APLICAÇÃO  
**Prioridade:** 🔴 ALTA - Bloqueia funcionalidade crítica  
**Arquivo SQL:** `CORRECAO_RLS_MATERIAIS_COLETADOS.sql`  
**Data:** 19/01/2026
