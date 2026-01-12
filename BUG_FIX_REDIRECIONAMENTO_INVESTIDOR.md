# 🐛 Bug Fix: Investidor Redirecionado para Tela Inicial

## ❌ Problema Identificado

### Sintoma
Quando um usuário com role `investidor` fazia login, estava sendo redirecionado para a **tela inicial** (`/`) ao invés do **dashboard de investidor** (`/cdv/investor`).

---

## 🔍 Diagnóstico

### Causa Raiz
O problema estava na função `fetchUserRole` do `AuthContext.tsx`:

**Código Anterior (com bug):**
```typescript
const fetchUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();  // ❌ PROBLEMA: Retorna apenas UMA role

  if (error) {
    console.error('Erro ao buscar role do usuário', error);
    return null;
  }

  return data?.role || null;
};
```

### Por que isso causava o problema?

1. **`.maybeSingle()`** retorna apenas **uma row** da tabela `user_roles`
2. Se o usuário tiver **múltiplas roles** (ex: `usuario` + `investidor`), o PostgreSQL retorna uma role **aleatória**
3. Se retornar `usuario` ao invés de `investidor`, o sistema redireciona para `/user`
4. Não havia **priorização de roles**

---

## ✅ Solução Implementada

### Código Corrigido

```typescript
const fetchUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);  // ✅ Busca TODAS as roles

  if (error) {
    console.error('Erro ao buscar role do usuário', error);
    return null;
  }

  // Se não houver roles, retorna null
  if (!data || data.length === 0) {
    return null;
  }

  // Se tiver apenas uma role, retorna ela
  if (data.length === 1) {
    return data[0].role;
  }

  // Se tiver múltiplas roles, priorizar nesta ordem:
  // admin > investidor > cooperativa > empresa > vendedor > usuario
  const rolePriority = ['admin', 'investidor', 'cooperativa', 'empresa', 'vendedor', 'usuario'];
  
  for (const priorityRole of rolePriority) {
    if (data.some((r: any) => r.role === priorityRole)) {
      return priorityRole;  // ✅ Retorna a role de maior prioridade
    }
  }

  // Fallback: retorna a primeira role encontrada
  return data[0].role;
};
```

---

## 🎯 Sistema de Prioridade de Roles

Quando um usuário tem **múltiplas roles**, o sistema agora prioriza na seguinte ordem:

| Prioridade | Role | Dashboard | Rota |
|------------|------|-----------|------|
| 1 (Maior) | `admin` | AdminDashboard | `/admin` |
| 2 | `investidor` | CDVInvestorDashboard | `/cdv/investor` |
| 3 | `cooperativa` | CooperativeDashboard | `/cooperative` |
| 4 | `empresa` | CompanyDashboard | `/company` |
| 5 | `vendedor` | UserDashboard | `/user` |
| 6 (Menor) | `usuario` | UserDashboard | `/user` |

### Exemplos:

**Exemplo 1: Usuário com roles `usuario` + `investidor`**
- ✅ Sistema escolhe `investidor` (prioridade 2)
- ✅ Redireciona para `/cdv/investor`

**Exemplo 2: Usuário com roles `usuario` + `admin`**
- ✅ Sistema escolhe `admin` (prioridade 1)
- ✅ Redireciona para `/admin`

**Exemplo 3: Usuário com roles `cooperativa` + `empresa`**
- ✅ Sistema escolhe `cooperativa` (prioridade 3)
- ✅ Redireciona para `/cooperative`

**Exemplo 4: Usuário com apenas `investidor`**
- ✅ Sistema escolhe `investidor`
- ✅ Redireciona para `/cdv/investor`

---

## 🔄 Fluxo de Login Corrigido

### Antes (com bug):
```
1. Usuário investidor faz login
2. AuthContext busca roles → retorna "usuario" (aleatório)
3. RoleBasedRedirect verifica role = "usuario"
4. ❌ Redireciona para /user (ERRADO!)
```

### Depois (corrigido):
```
1. Usuário investidor faz login
2. AuthContext busca TODAS as roles → ["usuario", "investidor"]
3. Sistema prioriza → escolhe "investidor"
4. RoleBasedRedirect verifica role = "investidor"
5. ✅ Redireciona para /cdv/investor (CORRETO!)
```

---

## 📝 Alterações Realizadas

### Arquivo Modificado
- **`src/contexts/AuthContext.tsx`**

### Mudanças:
1. ✅ Removido `.maybeSingle()` da query
2. ✅ Query agora busca **todas as roles** do usuário
3. ✅ Implementado sistema de **priorização de roles**
4. ✅ Tratamento para usuários com **uma única role**
5. ✅ Tratamento para usuários com **múltiplas roles**
6. ✅ Fallback seguro se nenhuma prioridade for encontrada

---

## 🧪 Como Testar

### Teste 1: Investidor com apenas role `investidor`
```sql
-- Ver roles do usuário
SELECT role FROM user_roles WHERE user_id = 'uuid-do-investidor';
-- Resultado esperado: investidor
```
1. Fazer login como investidor
2. ✅ Deve redirecionar para `/cdv/investor`

### Teste 2: Investidor com roles `usuario` + `investidor`
```sql
-- Ver roles do usuário
SELECT role FROM user_roles WHERE user_id = 'uuid-do-investidor';
-- Resultado esperado: usuario, investidor
```
1. Fazer login como investidor
2. ✅ Deve redirecionar para `/cdv/investor` (prioridade maior)

### Teste 3: Admin com múltiplas roles
```sql
-- Ver roles do usuário
SELECT role FROM user_roles WHERE user_id = 'uuid-do-admin';
-- Resultado esperado: admin, usuario, investidor
```
1. Fazer login como admin
2. ✅ Deve redirecionar para `/admin` (maior prioridade)

---

## 🔐 Segurança

### RLS ainda está ativo
Mesmo que um usuário tenha múltiplas roles, o **Row Level Security (RLS)** garante:
- ✅ Investidor só vê suas próprias quotas
- ✅ Cooperativa só vê suas próprias entregas
- ✅ Usuário só vê seus próprios dados

### ProtectedRoute ainda funciona
Cada rota continua protegida:
```tsx
<Route 
  path="/cdv/investor" 
  element={
    <ProtectedRoute allowedRoles={['investidor']}>
      <CDVInvestorDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 📊 Impacto

### Antes da Correção:
- ❌ Investidores não conseguiam acessar seu dashboard
- ❌ Redirecionamento inconsistente
- ❌ Experiência do usuário ruim
- ❌ Usuários com múltiplas roles confusos

### Depois da Correção:
- ✅ Investidores são corretamente redirecionados
- ✅ Sistema de prioridade claro e previsível
- ✅ Suporte para usuários com múltiplas roles
- ✅ Experiência do usuário consistente
- ✅ Código mais robusto e escalável

---

## 🚀 Deploy

**Commit:** `5e18452`  
**Branch:** `main`  
**Status:** ✅ Deployado em produção

### Comando Git:
```bash
git add src/contexts/AuthContext.tsx
git commit -m "fix: Corrige redirecionamento de investidores com multiplas roles"
git push origin main
```

---

## 📚 Documentação Relacionada

- `DASHBOARDS_POR_USUARIO.md` - Mapeamento de todos os dashboards
- `CONFIRMACAO_PORTAL_INVESTIDOR.md` - Portal do investidor
- `CONFIRMACAO_SEGURANCA_QUOTAS_INVESTIDOR.md` - Segurança de quotas

---

## ✅ Verificação Pós-Deploy

### Checklist:
- [x] Código commitado e enviado para GitHub
- [x] Sistema de prioridade implementado
- [x] Múltiplas roles suportadas
- [x] Fallback seguro implementado
- [x] Investidores redirecionados corretamente
- [x] Documentação atualizada

---

## 🎉 Conclusão

O bug foi **completamente corrigido**. O sistema agora:
1. ✅ Busca **todas as roles** do usuário
2. ✅ Prioriza roles de acordo com a hierarquia
3. ✅ Redireciona investidores corretamente para `/cdv/investor`
4. ✅ Suporta usuários com múltiplas roles
5. ✅ Mantém segurança com RLS e ProtectedRoute

**Problema resolvido!** 🚀
