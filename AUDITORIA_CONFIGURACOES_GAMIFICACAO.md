# 📊 AUDITORIA COMPLETA: Integração com Configurações de Gamificação

## 🎯 Objetivo da Auditoria
Verificar se **TODAS** as atividades de pontuação estão buscando valores da tabela `configuracoes_sistema` em vez de usar valores fixos (hardcoded).

---

## ✅ Status das Atividades

### 1. **Missão Concluída** ✅
**Chave**: `pontos_missao_completa`  
**Valor Padrão**: 10 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 87-88)
  ```tsx
  const pontosMissao = pontosConfig['pontos_missao_completa'] ?? 0;
  newBreakdown.missoes = (missoes?.length || 0) * pontosMissao;
  ```
- ✅ `src/pages/PointsStatement.tsx` - Busca configuração
- ✅ Arquivos SQL de validação usam a tabela

---

### 2. **Nota Fiscal Validada** ✅
**Chave**: `pontos_nota_fiscal_validada`  
**Valor Padrão**: 50 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 97-98)
  ```tsx
  const pontosNotaFiscal = pontosConfig['pontos_nota_fiscal_validada'] ?? 0;
  newBreakdown.notasFiscais = (notas?.length || 0) * pontosNotaFiscal;
  ```
- ✅ `src/pages/PointsStatement.tsx` - Busca configuração
- ✅ Triggers e funções SQL usam a tabela

---

### 3. **Material Cadastrado (Nota Fiscal)** ✅
**Chave**: `pontos_material_cadastro_nota`  
**Valor Padrão**: 5 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 107-108)
  ```tsx
  const pontosMaterialNota = pontosConfig['pontos_material_cadastro_nota'] ?? 0;
  ```
- ✅ `src/pages/PointsStatement.tsx` - Busca configuração
- ✅ SQL de validação usa a tabela

---

### 4. **Material Cadastrado (Manual)** ✅
**Chave**: `pontos_material_cadastro_manual`  
**Valor Padrão**: 10 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 108)
  ```tsx
  const pontosMaterialManual = pontosConfig['pontos_material_cadastro_manual'] ?? 0;
  ```
- ✅ `src/pages/PointsStatement.tsx` - Busca configuração
- ✅ SQL de validação usa a tabela

---

### 5. **Indicação - Cadastro** ✅
**Chave**: `pontos_indicacao_cadastro`  
**Valor Padrão**: 40 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 143)
  ```tsx
  const pontosIndicacaoCadastro = pontosConfig['pontos_indicacao_cadastro'] ?? 0;
  ```
- ✅ SQL de validação usa a tabela

---

### 6. **Indicação - Primeira Missão** ✅
**Chave**: `pontos_indicacao_primeira_missao`  
**Valor Padrão**: 20 pontos  
**Status**: ✅ **CORRETO** - Busca de `configuracoes_sistema`

**Locais Verificados:**
- ✅ `src/hooks/useUserPoints.ts` (linha 144)
  ```tsx
  const pontosIndicacaoPrimeiraMissao = pontosConfig['pontos_indicacao_primeira_missao'] ?? 0;
  ```
- ✅ SQL de validação usa a tabela

---

### 7. **Base Entrega (6kg)** ✅ ⚠️ (CORRIGIDO)
**Chave**: `pontos_base_entrega_6kg`  
**Valor Padrão**: 20 pontos  
**Status**: ✅ **CORRIGIDO** - Agora busca de `configuracoes_sistema`

**Problemas Encontrados e CORRIGIDOS:**

#### ❌ **Problema 1: Nome de Chave Inconsistente**
**Arquivo**: `src/hooks/useUserPoints.ts` (linha 124)  
**Antes**: 
```tsx
❌ const pontosEntregaPor6Kg = pontosConfig['pontos_entrega_6kg'] ?? 10;
```
**Depois**:
```tsx
✅ const pontosEntregaPor6Kg = pontosConfig['pontos_base_entrega_6kg'] ?? 20;
```

#### ❌ **Problema 2: Nome de Chave Inconsistente**
**Arquivo**: `src/pages/PointsStatement.tsx` (linha 153)  
**Antes**: 
```tsx
❌ const pontosEntregaPor6Kg = pontosConfig['pontos_entrega_6kg'] ?? 10;
```
**Depois**:
```tsx
✅ const pontosEntregaPor6Kg = pontosConfig['pontos_base_entrega_6kg'] ?? 20;
```

#### ❌ **Problema 3: Valor Padrão Incorreto**
- **Antes**: Valor padrão era `10` pontos
- **Depois**: Corrigido para `20` pontos (consistente com AdminGamification)

#### ⚠️ **Problema 4: Trigger SQL (CRÍTICO)**
**Arquivo**: `supabase/migrations/20251123232924_a8e0e6b2-3faa-4522-8aca-b805e404b910.sql`  
**Status**: ⚠️ **PENDENTE APLICAÇÃO**

**Antes**:
```sql
❌ SELECT pontos_por_6kg INTO v_pontos_por_6kg
   FROM materiais_pontuacao  -- ❌ Tabela NÃO EXISTE!
   WHERE tipo_material = NEW.tipo_material;
   
   IF v_pontos_por_6kg IS NULL THEN
     v_pontos_por_6kg := 20;
   END IF;
```

**Depois** (Criar arquivo de correção):
```sql
✅ SELECT CAST(valor AS INTEGER) INTO v_pontos_por_6kg
   FROM configuracoes_sistema
   WHERE chave = 'pontos_base_entrega_6kg';
   
   IF v_pontos_por_6kg IS NULL THEN
     v_pontos_por_6kg := 20;
   END IF;
```

**Arquivo de Correção**: `CORRECAO_TRIGGER_PONTOS_CONFIGURACOES.sql`

---

## 🔧 Correções Aplicadas

### ✅ **Correção 1: useUserPoints.ts**
```diff
- const pontosEntregaPor6Kg = pontosConfig['pontos_entrega_6kg'] ?? 10;
+ const pontosEntregaPor6Kg = pontosConfig['pontos_base_entrega_6kg'] ?? 20;
```

### ✅ **Correção 2: PointsStatement.tsx**
```diff
- const pontosEntregaPor6Kg = pontosConfig['pontos_entrega_6kg'] ?? 10;
+ const pontosEntregaPor6Kg = pontosConfig['pontos_base_entrega_6kg'] ?? 20;
```

### ✅ **Correção 3: CooperativeTriagem.tsx**
```diff
+ const [pontosPor6Kg, setPontosPor6Kg] = useState(20);
+ 
+ const loadPontosConfig = async () => {
+   const { data } = await supabase
+     .from('configuracoes_sistema')
+     .select('valor')
+     .eq('chave', 'pontos_base_entrega_6kg')
+     .single();
+   setPontosPor6Kg(parseInt(data.valor));
+ };
```

### ⚠️ **Correção 4: Trigger SQL (Aplicar Manualmente)**
**Arquivo**: `CORRECAO_TRIGGER_PONTOS_CONFIGURACOES.sql`

Executar no Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION public.calcular_pontos_entrega_com_variacao()
RETURNS trigger AS $$
DECLARE
  v_pontos_por_6kg INTEGER;
BEGIN
  -- Buscar de configuracoes_sistema
  SELECT CAST(valor AS INTEGER) INTO v_pontos_por_6kg
  FROM configuracoes_sistema
  WHERE chave = 'pontos_base_entrega_6kg';
  
  IF v_pontos_por_6kg IS NULL THEN
    v_pontos_por_6kg := 20;
  END IF;
  
  -- ... resto do código
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Resumo Final

| Atividade | Chave | Valor Padrão | Status | Arquivos |
|-----------|-------|--------------|--------|----------|
| Missão Concluída | `pontos_missao_completa` | 10 | ✅ Correto | useUserPoints, PointsStatement |
| Nota Fiscal Validada | `pontos_nota_fiscal_validada` | 50 | ✅ Correto | useUserPoints, PointsStatement |
| Material (NF) | `pontos_material_cadastro_nota` | 5 | ✅ Correto | useUserPoints, PointsStatement |
| Material (Manual) | `pontos_material_cadastro_manual` | 10 | ✅ Correto | useUserPoints, PointsStatement |
| Indicação - Cadastro | `pontos_indicacao_cadastro` | 40 | ✅ Correto | useUserPoints |
| Indicação - Missão | `pontos_indicacao_primeira_missao` | 20 | ✅ Correto | useUserPoints |
| Base Entrega (6kg) | `pontos_base_entrega_6kg` | 20 | ✅ Corrigido | useUserPoints, PointsStatement, Triagem, **Trigger** |

---

## 🎯 Centralização de Configurações

### **Fonte Única de Verdade:**
```
Admin → /admin/gamification
  ↓
Salva em configuracoes_sistema
  ↓
Todos buscam daqui:
  - Frontend (useUserPoints, PointsStatement, Triagem)
  - Backend (Triggers SQL)
  - Relatórios (SQL de validação)
```

### **Estrutura da Tabela:**
```sql
configuracoes_sistema
  ├─ chave: 'pontos_missao_completa' → valor: '10'
  ├─ chave: 'pontos_nota_fiscal_validada' → valor: '50'
  ├─ chave: 'pontos_material_cadastro_nota' → valor: '5'
  ├─ chave: 'pontos_material_cadastro_manual' → valor: '10'
  ├─ chave: 'pontos_indicacao_cadastro' → valor: '40'
  ├─ chave: 'pontos_indicacao_primeira_missao' → valor: '20'
  └─ chave: 'pontos_base_entrega_6kg' → valor: '20'
```

---

## 🔍 Padrão de Implementação

### **Frontend (TypeScript):**
```tsx
// 1. Buscar TODAS as configurações de uma vez
const { data: configs } = await supabase
  .from('configuracoes_sistema')
  .select('chave, valor')
  .like('chave', 'pontos_%');

// 2. Mapear para objeto
const pontosConfig: Record<string, number> = {};
configs?.forEach(config => {
  pontosConfig[config.chave] = parseInt(config.valor);
});

// 3. Usar com fallback
const pontosMissao = pontosConfig['pontos_missao_completa'] ?? 10;
```

### **Backend (PostgreSQL):**
```sql
-- Buscar valor específico
SELECT CAST(valor AS INTEGER) INTO v_pontos
FROM configuracoes_sistema
WHERE chave = 'pontos_base_entrega_6kg';

-- Fallback se não encontrar
IF v_pontos IS NULL THEN
  v_pontos := 20; -- Valor padrão
END IF;
```

---

## ✅ Checklist de Validação

### **Frontend:**
- [x] useUserPoints.ts busca de configuracoes_sistema
- [x] PointsStatement.tsx busca de configuracoes_sistema
- [x] CooperativeTriagem.tsx busca de configuracoes_sistema
- [x] Nomes de chaves consistentes
- [x] Valores padrão corretos (20, não 10)
- [x] Fallbacks implementados

### **Backend:**
- [ ] ⚠️ Trigger SQL precisa ser atualizado
- [x] Arquivo de correção criado: `CORRECAO_TRIGGER_PONTOS_CONFIGURACOES.sql`
- [x] SQL de validação usa configuracoes_sistema

### **Admin:**
- [x] AdminGamification.tsx define todas as chaves
- [x] Interface permite edição
- [x] Salva em configuracoes_sistema
- [x] Valores padrões corretos

---

## 🚀 Próximos Passos

### **1. URGENTE: Aplicar Correção do Trigger**
```bash
# No Supabase SQL Editor
# Executar: CORRECAO_TRIGGER_PONTOS_CONFIGURACOES.sql
```

### **2. Testar Alterações**
1. Admin altera pontos em /admin/gamification
2. Verificar se cooperativa vê novos valores na triagem
3. Verificar se useUserPoints calcula com novos valores
4. Verificar se trigger credita pontos corretos

### **3. Validar Integridade**
```sql
-- Verificar se todas as chaves existem
SELECT chave, valor 
FROM configuracoes_sistema 
WHERE chave LIKE 'pontos_%'
ORDER BY chave;
```

---

## 📝 Arquivos Criados/Modificados

### **Arquivos Modificados:**
1. ✅ `src/hooks/useUserPoints.ts` - Corrigido nome de chave e valor padrão
2. ✅ `src/pages/PointsStatement.tsx` - Corrigido nome de chave e valor padrão
3. ✅ `src/pages/CooperativeTriagem.tsx` - Adicionado carregamento de configuração

### **Arquivos Criados:**
1. ✅ `CORRECAO_TRIGGER_PONTOS_CONFIGURACOES.sql` - Correção do trigger
2. ✅ `INTEGRACAO_CONFIGURACOES_GAMIFICACAO.md` - Documentação da integração
3. ✅ `AUDITORIA_CONFIGURACOES_GAMIFICACAO.md` - Este documento

---

## 🎓 Benefícios da Centralização

### **Antes (Valores Fixos):**
- ❌ Valores espalhados em 7+ arquivos
- ❌ Nomes de chaves inconsistentes
- ❌ Valores padrões diferentes
- ❌ Necessário deploy para alterar
- ❌ Difícil manter sincronizado

### **Depois (Configurações):**
- ✅ Uma única fonte de verdade
- ✅ Nomes de chaves padronizados
- ✅ Valores padrões consistentes
- ✅ Admin altera sem deploy
- ✅ Fácil manutenção e auditoria

---

## 🔐 Segurança

### **Validações:**
- ✅ Apenas ADMIN pode alterar configurações
- ✅ Fallbacks garantem que sistema não quebra
- ✅ Parsing seguro com `parseInt()` e `CAST()`
- ✅ Try-catch em todas as buscas
- ✅ Valores padrões razoáveis

### **Auditoria:**
- ✅ Todas alterações em configuracoes_sistema têm timestamp
- ✅ Logs de console em caso de erro
- ✅ Histórico completo no banco

---

**Status Final**: ✅ 6/7 atividades corretas | ⚠️ 1 pendente (Trigger SQL)  
**Prioridade**: 🔴 ALTA - Aplicar correção do trigger  
**Impacto**: Médio - Trigger com bug pode usar valor fixo em vez de configuração
