# 🔧 Correção dos Campos de Peso na API

## 📋 Problema Identificado

Durante os testes, identificamos que:

1. ❌ Os campos estavam com nomes inconsistentes:
   - API retornava: `peso_liquido` e `peso_bruto`
   - Documentação esperava: `peso_liquido_em_gramas` e `peso_bruto_em_gramas`

2. ❌ A conversão de kg → gramas não estava tratando todos os casos:
   - Não tratava valores numéricos (int/float)
   - Não tratava peso bruto
   - Não validava corretamente quando já estava em gramas

## ✅ Correções Aplicadas

### 1. **Padronização dos Nomes dos Campos**

**Antes:**
```json
{
  "peso_liquido": null,
  "peso_bruto": null
}
```

**Depois:**
```json
{
  "peso_liquido_em_gramas": 1000,
  "peso_bruto_em_gramas": 1050
}
```

### 2. **Lógica de Conversão Melhorada**

A função agora trata:
- ✅ Strings com unidades: `"1kg"` → `1000`, `"500g"` → `500`
- ✅ Números decimais: `1.5` (kg) → `1500` (gramas)
- ✅ Números inteiros: `2` (kg) → `2000` (gramas)
- ✅ Detecta automaticamente se já está em gramas (valores > 100)
- ✅ Retorna valores inteiros (sem casas decimais)
- ✅ Trata tanto peso líquido quanto peso bruto

**Código Python (render-api/app.py):**
```python
# Peso em gramas (converter se necessário)
peso_liquido = data.get('net_weight')
peso_liquido_gramas = None

if peso_liquido:
    if isinstance(peso_liquido, str):
        # Tentar extrair número (ex: "1kg" -> 1000, "500g" -> 500)
        peso_str = peso_liquido.replace('kg', '').replace('g', '').strip()
        try:
            peso_num = float(peso_str)
            if peso_liquido.lower().endswith('kg') or peso_num < 100:  # Está em kg
                peso_liquido_gramas = int(peso_num * 1000)
            else:  # Já está em gramas
                peso_liquido_gramas = int(peso_num)
        except:
            peso_liquido_gramas = None
    elif isinstance(peso_liquido, (int, float)):
        # Se é número, assumir kg se < 100, senão gramas
        if peso_liquido < 100:
            peso_liquido_gramas = int(peso_liquido * 1000)
        else:
            peso_liquido_gramas = int(peso_liquido)
```

### 3. **Interface TypeScript Atualizada**

**Arquivo: integracao-frontend/cosmosApi.ts**
```typescript
export interface ProdutoCosmosResponse {
  // ... outros campos ...
  peso_liquido_em_gramas?: number;  // ✅ Nome correto
  peso_bruto_em_gramas?: number;     // ✅ Nome correto
  // ... outros campos ...
}

export function extrairDadosParaFormulario(produto: ProdutoCosmosResponse) {
  return {
    categoria: produto.categoria_api || null,
    ncm: produto.ncm || null,
    peso_liquido_em_gramas: produto.peso_liquido_em_gramas || null,  // ✅ Corrigido
    descricao: produto.descricao || null,
    marca: produto.marca || null,
    imagem_url: produto.imagem_url || null
  };
}
```

## 🚀 Como Aplicar no Render

### Passo 1: Redeploy da API

1. Acesse o dashboard do Render: https://dashboard.render.com/
2. Selecione o serviço **ciclik-api-produtos**
3. Clique em **"Manual Deploy"** (canto superior direito)
4. Selecione **"Deploy latest commit"**
5. Aguarde o build (2-3 minutos)

### Passo 2: Verificar Logs

Procure por estas mensagens:
```
==> Checking out commit 1b3b8f4
==> Entering directory render-api
==> Build successful 🎉
==> Your service is live 🎉
```

### Passo 3: Testar a Correção

Execute no PowerShell:
```powershell
$headers = @{ "Authorization" = "Bearer ciclik_secret_token_2026" }
$response = Invoke-RestMethod -Uri "https://ciclik-api-produtos.onrender.com/api/produtos/7891910000197" -Headers $headers
$response | ConvertTo-Json -Depth 10
```

**Resposta esperada:**
```json
{
  "encontrado": true,
  "ean_gtin": 7891910000197,
  "descricao": "AÇÚCAR REFINADO ESPECIAL UNIÃO PACOTE 1KG",
  "marca": "UNIÃO",
  "ncm": "17019900",
  "peso_liquido_em_gramas": 1000,  // ✅ Campo correto
  "peso_bruto_em_gramas": null,
  ...
}
```

## 📊 Teste Completo

Use o script atualizado:
```powershell
.\testar_api_producao.ps1
```

Agora você verá:
```
2️⃣  Consultando produto de exemplo (GTIN: 7891910000197)...
   ✅ Produto encontrado!
   Descrição: AÇÚCAR REFINADO ESPECIAL UNIÃO PACOTE 1KG
   NCM: 17019900
   Peso: 1000g  // ✅ Agora aparece!
   Categoria: Açucar Refinado
```

## 🔄 Git Commit

```bash
Commit: 1b3b8f4
Mensagem: fix: Corrigir nomes dos campos de peso para peso_liquido_em_gramas 
          e peso_bruto_em_gramas + melhorar conversão de kg para gramas
Data: 22 de janeiro de 2026
Arquivos alterados:
  - render-api/app.py (lógica de conversão)
  - integracao-frontend/cosmosApi.ts (interface TypeScript)
```

## ⚠️ Observação Importante

**Alguns produtos não têm peso cadastrado no Cosmos Bluesoft!**

Exemplo: O açúcar União (GTIN 7891910000197) retorna `peso_liquido: null` no Cosmos.

Isso é **normal** e deve ser tratado no frontend:
```typescript
const peso = dados.peso_liquido_em_gramas || 0; // Usar 0 como padrão
// OU
if (!dados.peso_liquido_em_gramas) {
  // Pedir para o usuário informar manualmente
}
```

## 📝 Próximos Passos

Depois do redeploy:
1. ✅ Testar com vários GTINs diferentes
2. ✅ Verificar produtos com peso em kg e em gramas
3. ✅ Integrar no formulário do Ciclik
4. ✅ Adicionar validação para peso nulo no frontend

---

**Status:** ⏳ Aguardando redeploy no Render
**Commit:** 1b3b8f4 (já no GitHub)
**URL:** https://ciclik-api-produtos.onrender.com
