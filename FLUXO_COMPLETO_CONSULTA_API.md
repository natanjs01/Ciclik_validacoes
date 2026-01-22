# 🔄 FLUXO COMPLETO: Consulta API e Atualização Automática
**Data:** 22/01/2026  
**Status:** ✅ IMPLEMENTADO  
**Commit:** 98ad7d6

---

## 📋 Pergunta Original:
> "Quando ele executar a api já vai preencher os dados dos materiais pendentes e alterar o status para consultado né?"

## ✅ Resposta: SIM! Agora está implementado.

---

## 🔄 Fluxo Completo Implementado:

### **Passo 1: Admin Seleciona Produtos**
```
Interface: /admin/products/analysis
- Admin marca checkbox dos produtos
- Produtos QR Code aparecem primeiro com ⭐
- Botão "Consultar API" fica habilitado
```

### **Passo 2: Click "Consultar API"**
```
Modal de confirmação:
- Mostra quantidade selecionada
- Mostra contador: "X/100 consultas hoje"
- Admin confirma
```

### **Passo 3: Sistema Consulta API OnRender**
```tsx
// Para cada produto selecionado:
const dadosAPI = await consultarAPIReal(produto.ean_gtin);

// Dados retornados:
{
  ean_gtin: "7891234567890",
  descricao: "GARRAFA PET 2L COCA COLA",
  marca: "Coca-Cola",
  fabricante: "Coca-Cola FEMSA Brasil",
  ncm: "22021000",
  peso_liquido_em_gramas: 65,
  preco_medio: 6.50,
  imagem_url: "https://...",
  encontrado: true,
  mensagem: "Produto encontrado"
}
```

### **Passo 4: Sistema Registra no Log** ✅
```sql
INSERT INTO log_consultas_api (
  admin_id,
  produto_id,
  ean_gtin,
  sucesso,
  tempo_resposta_ms,
  resposta_api,
  erro_mensagem
) VALUES (...)
```

**Controle de limite:**
- Trigger valida se admin já fez 100 consultas hoje
- Se sim: bloqueia com erro
- Se não: permite e incrementa contador

### **Passo 5: Sistema Atualiza Produto** ✅ **NOVO!**
```sql
UPDATE produtos_em_analise
SET 
  dados_api = '{...}', -- JSON completo da resposta
  consultado_em = '2026-01-22T15:30:00Z',
  status = 'consultado', -- ← Muda de "pendente" para "consultado"
  updated_at = NOW()
WHERE id = 'uuid-do-produto'
```

### **Passo 6: Sistema Categoriza Resultado**
```typescript
if (validarDadosCompletos(dadosAPI)) {
  // Dados COMPLETOS → Poderia cadastrar automaticamente
  resultados.autoCadastrados.push(produto);
} else if (dadosAPI.encontrado) {
  // Dados INCOMPLETOS → Precisa revisão manual
  resultados.precisamRevisao.push(produto);
} else {
  // NÃO ENCONTRADO na API
  resultados.naoEncontrados.push(produto);
}
```

### **Passo 7: Modal de Resultados** ✅
```
✅ 3 Cadastrados Automaticamente
⚠️ 5 Precisam Revisão Manual (dados incompletos)
❌ 2 Não Encontrados
```

### **Passo 8: Admin Revisa Produtos Consultados**
```
Status: "Consultado" (badge azul)
- Produto tem dados_api preenchido
- Admin pode clicar "Cadastrar" para revisar
- Dados da API já aparecem pré-preenchidos
- Admin completa informações faltantes
- Admin clica "Salvar Produto"
```

---

## 📊 Estrutura de Dados Atualizada:

### **Tabela: `produtos_em_analise`**
```sql
id                        UUID
ean_gtin                  TEXT
descricao                 TEXT
origem                    TEXT ('qrcode' | 'manual')
status                    TEXT ('pendente' | 'consultado' | 'aprovado')
dados_api                 JSONB ← NOVO! JSON completo da API
consultado_em             TIMESTAMPTZ ← NOVO! Data da consulta
quantidade_ocorrencias    INTEGER
data_primeira_deteccao    TIMESTAMPTZ
data_ultima_deteccao      TIMESTAMPTZ
created_at                TIMESTAMPTZ
updated_at                TIMESTAMPTZ
```

### **Exemplo de `dados_api` (JSONB):**
```json
{
  "ean_gtin": "7891234567890",
  "descricao": "GARRAFA PET 2L COCA COLA",
  "marca": "Coca-Cola",
  "fabricante": "Coca-Cola FEMSA Brasil",
  "ncm": "22021000",
  "ncm_descricao": "Águas, incluindo as águas minerais",
  "peso_liquido": 65,
  "peso_bruto": null,
  "preco_medio": 6.50,
  "categoria_api": "Bebidas",
  "imagem_url": "https://cosmos-api.com/images/789123456.jpg",
  "encontrado": true,
  "mensagem": "Produto encontrado"
}
```

---

## 🎯 Estados do Produto:

| Status | Descrição | Próxima Ação |
|--------|-----------|--------------|
| **pendente** | Detectado, não consultado | Consultar API |
| **consultado** | API consultada, dados salvos | Revisar e cadastrar |
| **aprovado** | Cadastrado no sistema | Nenhuma |
| **rejeitado** | Rejeitado pelo admin | Nenhuma |
| **acao_manual** | Sem GTIN válido | Cadastro manual |

---

## 🔄 Fluxo Visual Simplificado:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECÇÃO (NF ou QR Code)                                │
│    └─> produtos_em_analise (status: "pendente")            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CONSULTA API                                             │
│    ├─> Valida GTIN                                          │
│    ├─> Chama API OnRender                                   │
│    ├─> Registra em log_consultas_api                       │
│    └─> Verifica limite 100/dia (trigger bloqueia se > 100) │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ATUALIZAÇÃO AUTOMÁTICA ✅ NOVO!                          │
│    UPDATE produtos_em_analise SET:                          │
│    ├─> dados_api = {...} ← JSON completo                   │
│    ├─> consultado_em = NOW()                                │
│    ├─> status = "consultado" ← Muda status                 │
│    └─> updated_at = NOW()                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CATEGORIZAÇÃO                                            │
│    ├─> Dados completos? → "Cadastrados Automaticamente"    │
│    ├─> Dados parciais? → "Precisam Revisão"                │
│    └─> Não encontrado? → "Não Encontrados"                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. REVISÃO MANUAL (status: "consultado")                   │
│    ├─> Admin abre modal de cadastro                         │
│    ├─> Dados da API aparecem pré-preenchidos               │
│    ├─> Admin completa campos faltantes                      │
│    └─> Admin salva → status = "aprovado"                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumo Final:

### **ANTES (❌ Incompleto):**
1. ✅ Consultava API
2. ✅ Registrava no log
3. ❌ NÃO salvava dados no produto
4. ❌ NÃO mudava status
5. ❌ Admin precisava consultar novamente ao cadastrar

### **AGORA (✅ Completo):**
1. ✅ Consulta API OnRender
2. ✅ Registra no log (com controle de limite)
3. ✅ **Salva dados_api no produto**
4. ✅ **Muda status para "consultado"**
5. ✅ **Admin revisa dados pré-preenchidos**

---

## 🚀 Benefícios:

1. **Economia de Consultas:**
   - Não precisa consultar API novamente ao cadastrar
   - Dados já estão salvos no campo `dados_api`

2. **Histórico Completo:**
   - Sabe quando foi consultado (`consultado_em`)
   - Sabe qual foi a resposta (`dados_api`)
   - Sabe se deu certo (`log_consultas_api.sucesso`)

3. **Workflow Eficiente:**
   - Consulta em lote (vários produtos de uma vez)
   - Revisão individual depois
   - Dados pré-preenchidos aceleram cadastro

4. **Controle de Limite:**
   - Trigger bloqueia automaticamente > 100/dia
   - Frontend mostra contador em tempo real
   - Impossível burlar via API

---

## 📝 Próximos Passos (Opcional):

### **Cadastro Automático Completo:**
Se quiser que produtos com dados completos sejam cadastrados automaticamente:

```typescript
if (validarDadosCompletos(dadosAPI)) {
  // Criar produto na tabela produtos_ciclik
  await supabase.from('produtos_ciclik').insert({
    gtin: dadosAPI.ean_gtin,
    descricao: dadosAPI.descricao,
    ncm: dadosAPI.ncm,
    marca: dadosAPI.marca,
    tipo_embalagem: inferirTipoEmbalagem(dadosAPI),
    peso_medio_gramas: dadosAPI.peso_liquido,
    // ... outros campos
  });
  
  // Marcar como aprovado
  await supabase
    .from('produtos_em_analise')
    .update({ status: 'aprovado' })
    .eq('id', produtoId);
}
```

Mas por enquanto, **todos ficam como "consultado"** para revisão manual do admin.

---

**Implementado em:** 22/01/2026  
**Commit:** `98ad7d6`  
**Arquivos Modificados:** `src/pages/AdminProductsAnalysis.tsx` (linhas 668-686)
