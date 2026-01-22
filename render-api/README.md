# 🚀 API Ciclik - Consulta de Produtos

API REST hospedada no Render para consulta de produtos via Cosmos Bluesoft.

## 📋 **Pré-requisitos**

- Conta no [Render.com](https://render.com)
- Token da API Cosmos Bluesoft
- Python 3.11+

---

## 🔧 **Configuração no Render**

### **1. Criar Web Service**

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `natanjs01/Ciclik_validacoes`
4. Configure:
   - **Name:** `ciclik-api-produtos`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Root Directory:** `render-api`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** `Free` (para testes)

### **2. Configurar Variáveis de Ambiente**

No painel do Render, vá em **"Environment"** e adicione:

| Key | Value |
|-----|-------|
| `COSMOS_TOKEN` | `uptGgat1OvUO_fkHKD1pYQ` |
| `API_TOKEN` | `ciclik_secret_token_2026` |
| `PYTHON_VERSION` | `3.11.0` |

### **3. Deploy**

- Clique em **"Create Web Service"**
- Aguarde o deploy (3-5 minutos)
- Anote a URL gerada: `https://ciclik-api-produtos.onrender.com`

---

## 🧪 **Testando a API**

### **1. Health Check**

```bash
curl https://ciclik-api-produtos.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-22"
}
```

### **2. Consultar Produto (Açúcar União)**

```bash
curl -X GET "https://ciclik-api-produtos.onrender.com/api/produtos/7891910000197" \
  -H "Authorization: Bearer ciclik_secret_token_2026" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "encontrado": true,
  "ean_gtin": "7891910000197",
  "descricao": "AÇÚCAR REFINADO ESPECIAL UNIÃO PACOTE 1KG",
  "marca": "UNIÃO",
  "categoria_api": "Açúcar Refinado",
  "ncm": "17019900",
  "peso_liquido": 1000,
  "imagem_url": "https://...",
  "mensagem": "Produto encontrado com sucesso"
}
```

### **3. Produto Não Encontrado**

```bash
curl -X GET "https://ciclik-api-produtos.onrender.com/api/produtos/9999999999999" \
  -H "Authorization: Bearer ciclik_secret_token_2026"
```

**Resposta esperada:**
```json
{
  "encontrado": false,
  "ean_gtin": "9999999999999",
  "mensagem": "Produto não encontrado na base Cosmos"
}
```

### **4. GTIN Inválido**

```bash
curl -X GET "https://ciclik-api-produtos.onrender.com/api/produtos/123" \
  -H "Authorization: Bearer ciclik_secret_token_2026"
```

**Resposta esperada:**
```json
{
  "erro": "GTIN inválido",
  "mensagem": "GTIN deve ter 13 dígitos (recebido: 3)"
}
```

---

## 📡 **Integração com Ciclik**

### **No Frontend (React/TypeScript)**

```typescript
// services/cosmosApi.ts

const RENDER_API_URL = 'https://ciclik-api-produtos.onrender.com';
const API_TOKEN = 'ciclik_secret_token_2026';

interface ProdutoCosmosResponse {
  encontrado: boolean;
  ean_gtin: string;
  descricao?: string;
  marca?: string;
  categoria_api?: string;
  ncm?: string;
  peso_liquido?: number;
  imagem_url?: string;
  mensagem: string;
}

export async function consultarProdutoCosmos(gtin: string): Promise<ProdutoCosmosResponse> {
  const response = await fetch(`${RENDER_API_URL}/api/produtos/${gtin}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }
  
  return await response.json();
}
```

### **Exemplo de Uso**

```typescript
// Ao analisar produto pendente
async function analisarProdutoPendente(gtin: string) {
  try {
    const dados = await consultarProdutoCosmos(gtin);
    
    if (dados.encontrado) {
      console.log('✅ Produto encontrado!');
      console.log(`Categoria: ${dados.categoria_api}`);
      console.log(`NCM: ${dados.ncm}`);
      
      // Preencher formulário automaticamente
      preencherFormulario({
        categoria: dados.categoria_api,
        ncm: dados.ncm,
        peso: dados.peso_liquido
      });
    } else {
      console.log('❌ Produto não encontrado na base');
    }
  } catch (error) {
    console.error('Erro ao consultar API:', error);
  }
}
```

---

## 🔒 **Segurança**

- ✅ Autenticação via Bearer Token
- ✅ CORS configurado
- ✅ Validação de GTIN
- ✅ Rate limiting (via Render)
- ✅ HTTPS obrigatório

---

## 📊 **Monitoramento**

### **Logs no Render**

```bash
# Ver logs em tempo real no dashboard:
https://dashboard.render.com/web/[seu-service-id]/logs
```

### **Métricas**

- Tempo de resposta médio: < 2s
- Disponibilidade: 99%+
- Rate limit: 100 req/min (plano free)

---

## 🆘 **Troubleshooting**

### **Erro 401 - Token Inválido**
- Verifique se o header `Authorization: Bearer {token}` está correto
- Confirme que o token é `ciclik_secret_token_2026`

### **Erro 404 - Produto Não Encontrado**
- Normal para GTINs inexistentes
- Retorna status 200 com `encontrado: false`

### **Erro 500 - Timeout**
- API Cosmos pode estar lenta
- Render free tier hiberna após 15min de inatividade
- Primeira requisição pode demorar ~30s (cold start)

---

## 📞 **Suporte**

- GitHub: [@natanjs01](https://github.com/natanjs01)
- Repositório: [Ciclik_validacoes](https://github.com/natanjs01/Ciclik_validacoes)

---

## 📝 **Changelog**

### v1.0.0 (2026-01-22)
- ✅ Endpoint GET /api/produtos/{gtin}
- ✅ Integração com Cosmos Bluesoft
- ✅ Autenticação via Bearer Token
- ✅ Formatação de dados para padrão Ciclik
- ✅ NCM com 8 dígitos (sem descrição)
- ✅ Peso em gramas
- ✅ Tratamento de erros completo
