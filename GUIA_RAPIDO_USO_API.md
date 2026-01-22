# 🚀 Guia Rápido - Uso da API Cosmos

## 📋 Informações Essenciais

```
URL:   https://ciclik-api-produtos.onrender.com
Token: ciclik_secret_token_2026
```

---

## 💻 Exemplos Práticos

### 1. Consultar Produto (PowerShell)

```powershell
$headers = @{ "Authorization" = "Bearer ciclik_secret_token_2026" }
$gtin = "7891910000197"
$url = "https://ciclik-api-produtos.onrender.com/api/produtos/$gtin"
Invoke-RestMethod -Uri $url -Headers $headers | ConvertTo-Json
```

### 2. Consultar Produto (JavaScript/TypeScript)

```typescript
async function consultarProduto(gtin: string) {
  const response = await fetch(
    `https://ciclik-api-produtos.onrender.com/api/produtos/${gtin}`,
    {
      headers: {
        'Authorization': 'Bearer ciclik_secret_token_2026'
      }
    }
  );
  
  return await response.json();
}

// Uso
const dados = await consultarProduto('7891910000197');
console.log(dados);
```

### 3. Consultar Produto (cURL)

```bash
curl -X GET \
  "https://ciclik-api-produtos.onrender.com/api/produtos/7891910000197" \
  -H "Authorization: Bearer ciclik_secret_token_2026"
```

### 4. Health Check

```powershell
Invoke-RestMethod -Uri "https://ciclik-api-produtos.onrender.com/health"
```

---

## 📦 Estrutura da Resposta

### Produto Encontrado

```json
{
  "encontrado": true,
  "ean_gtin": 7891910000197,
  "descricao": "AÇÚCAR REFINADO ESPECIAL UNIÃO PACOTE 1KG",
  "marca": "UNIÃO",
  "fabricante": "UNIÃO",
  "categoria_api": "Açucar Refinado",
  "ncm": "17019900",
  "ncm_completo": "17019900 - Outros",
  "preco_medio": 8.22,
  "peso_liquido_em_gramas": null,
  "peso_bruto_em_gramas": null,
  "imagem_url": "https://cdn-cosmos.bluesoft.com.br/products/7891910000197",
  "mensagem": "Produto encontrado com sucesso"
}
```

### Produto Não Encontrado

```json
{
  "encontrado": false,
  "ean_gtin": "9999999999999",
  "mensagem": "Produto não encontrado na base Cosmos"
}
```

---

## ⚠️ Códigos de Erro

| Código | Significado | Solução |
|--------|-------------|---------|
| **400** | GTIN inválido | Verificar se GTIN tem 13 dígitos numéricos |
| **401** | Token inválido | Verificar Bearer Token no header |
| **404** | Produto não encontrado | Produto não existe no Cosmos |
| **500** | Erro interno | Verificar logs no Render |

---

## 🔧 Integração com React

### Hook Pronto para Usar

```typescript
import { useConsultaProduto } from '@/hooks/useConsultaProduto';

function MeuComponente() {
  const { dados, loading, erro, consultar } = useConsultaProduto();
  
  const handleBuscar = async () => {
    await consultar('7891910000197');
    
    if (dados?.encontrado) {
      console.log('Produto:', dados.descricao);
      console.log('NCM:', dados.ncm);
      console.log('Peso:', dados.peso_liquido_em_gramas);
    }
  };
  
  return (
    <div>
      <button onClick={handleBuscar} disabled={loading}>
        {loading ? 'Buscando...' : 'Consultar Cosmos'}
      </button>
      {erro && <p>Erro: {erro}</p>}
      {dados && <p>Descrição: {dados.descricao}</p>}
    </div>
  );
}
```

---

## 📊 Campos Disponíveis

| Campo | Tipo | Descrição | Pode ser null? |
|-------|------|-----------|----------------|
| `encontrado` | boolean | Se o produto foi encontrado | Não |
| `ean_gtin` | number | Código GTIN | Não |
| `descricao` | string | Nome do produto | Sim |
| `marca` | string | Marca do produto | Sim |
| `fabricante` | string | Fabricante do produto | Sim |
| `categoria_api` | string | Categoria do Cosmos | Sim |
| `ncm` | string | NCM (8 dígitos) | Sim |
| `ncm_completo` | string | NCM + descrição | Sim |
| `preco_medio` | number | Preço médio em R$ | Sim |
| `peso_liquido_em_gramas` | number | Peso líquido em gramas | Sim |
| `peso_bruto_em_gramas` | number | Peso bruto em gramas | Sim |
| `imagem_url` | string | URL da imagem | Sim |
| `mensagem` | string | Mensagem de status | Não |

---

## 🎯 Casos de Uso Comuns

### 1. Auto-preencher Formulário

```typescript
const dadosCosmos = await consultarProdutoCosmos(gtin);

if (dadosCosmos?.encontrado) {
  // Preencher campos do formulário
  setCategoria(dadosCosmos.categoria_api || '');
  setNCM(dadosCosmos.ncm || '');
  setPeso(dadosCosmos.peso_liquido_em_gramas || 0);
  setDescricao(dadosCosmos.descricao || '');
  setMarca(dadosCosmos.marca || '');
  setImagemURL(dadosCosmos.imagem_url || '');
}
```

### 2. Atualizar Produto no Supabase

```typescript
const dadosCosmos = await consultarProdutoCosmos(gtin);

if (dadosCosmos?.encontrado) {
  await supabase
    .from('produtos_em_analise')
    .update({
      categoria: dadosCosmos.categoria_api,
      ncm: dadosCosmos.ncm,
      peso_liquido_em_gramas: dadosCosmos.peso_liquido_em_gramas,
      descricao: dadosCosmos.descricao,
      marca: dadosCosmos.marca,
      imagem_url: dadosCosmos.imagem_url,
      status: 'revisao'
    })
    .eq('gtin', gtin);
}
```

### 3. Validar Campos Obrigatórios

```typescript
const dadosCosmos = await consultarProdutoCosmos(gtin);

// Verificar quais campos estão faltando
const camposFaltantes = [];

if (!dadosCosmos.categoria_api) camposFaltantes.push('Categoria');
if (!dadosCosmos.ncm) camposFaltantes.push('NCM');
if (!dadosCosmos.peso_liquido_em_gramas) camposFaltantes.push('Peso');

if (camposFaltantes.length > 0) {
  alert(`Campos não encontrados no Cosmos: ${camposFaltantes.join(', ')}\nPreencha manualmente.`);
}
```

---

## ⏱️ Performance

| Cenário | Tempo Esperado |
|---------|----------------|
| **Primeira requisição** (cold start) | 30-50 segundos |
| **Requisições normais** | 1-3 segundos |
| **Após 15 min de inatividade** | 30-50 segundos (hibernação) |

### Dica: Avisar o Usuário

```typescript
const [coldStart, setColdStart] = useState(false);

const handleConsultar = async () => {
  setColdStart(true);
  
  try {
    const dados = await consultarProdutoCosmos(gtin);
    // ... processar dados
  } finally {
    setColdStart(false);
  }
};

// No JSX
{coldStart && (
  <p className="text-yellow-600">
    ⚠️ Primeira consulta pode levar até 50 segundos...
  </p>
)}
```

---

## 🧪 Testar Localmente

### Script de Teste PowerShell

```powershell
# Baixar o script
# Está em: C:\Users\glaydsonrodrigo\Desktop\ciclik-projeto\testar_api_producao.ps1

# Executar
.\testar_api_producao.ps1
```

### Testar Produto Específico

```powershell
# Substitua o GTIN pelo que deseja testar
$gtin = "7891910000197"
$headers = @{ "Authorization" = "Bearer ciclik_secret_token_2026" }
$response = Invoke-RestMethod -Uri "https://ciclik-api-produtos.onrender.com/api/produtos/$gtin" -Headers $headers
$response | ConvertTo-Json -Depth 10
```

---

## 📝 Checklist de Integração

Ao integrar no seu componente:

- [ ] Importar o hook `useConsultaProduto`
- [ ] Adicionar botão "Consultar Cosmos"
- [ ] Implementar estado de loading
- [ ] Tratar erros (mostrar mensagem ao usuário)
- [ ] Auto-preencher campos do formulário
- [ ] Validar campos obrigatórios
- [ ] Permitir edição manual após preenchimento
- [ ] Atualizar status do produto no Supabase
- [ ] Testar com vários GTINs diferentes
- [ ] Testar cold start (avisar usuário)

---

## 🔗 Links Úteis

- **Dashboard Render:** https://dashboard.render.com/
- **URL da API:** https://ciclik-api-produtos.onrender.com
- **Health Check:** https://ciclik-api-produtos.onrender.com/health
- **Repositório GitHub:** https://github.com/natanjs01/Ciclik_validacoes

---

## 💡 Dicas Importantes

1. **Sempre valide campos null**: Muitos produtos não têm todos os dados no Cosmos
2. **Implemente timeout**: Já configurado em 30s no código TypeScript
3. **Use cache**: Hook já implementa cache de 1 hora para reduzir requisições
4. **Monitore o Render**: Verifique logs em caso de problemas
5. **Upgrade quando necessário**: Plano Free tem limitações de tempo ativo

---

## ❓ Solução de Problemas

### Problema: API não responde

**Solução:** Provavelmente em cold start. Aguarde até 50 segundos.

### Problema: Erro 401

**Solução:** Verificar se o Bearer Token está correto no header.

### Problema: Campos vazios (null)

**Solução:** Normal! Nem todos os produtos têm todos os dados no Cosmos. Permitir preenchimento manual.

### Problema: Erro 400

**Solução:** GTIN inválido. Deve ter exatamente 13 dígitos numéricos.

---

**Pronto para usar! 🚀**
