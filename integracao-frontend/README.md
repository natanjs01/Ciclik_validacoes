# 📂 INTEGRACAO-FRONTEND

**⚠️ ATENÇÃO: Esta pasta contém EXEMPLOS de código!**

Estes arquivos **NÃO** são para rodar diretamente. São **exemplos de referência** para você copiar e adaptar no seu projeto React.

---

## 📁 ARQUIVOS DISPONÍVEIS

### **1. `cosmosApi.ts`** ⭐
**O que é:** Serviço completo para consultar a API Render  
**Copiar para:** `src/services/cosmosApi.ts`  
**Contém:**
- Função `consultarProdutoCosmos(gtin)`
- Validação de GTIN
- Cache automático (1 hora)
- Tratamento de erros
- Health check da API

### **2. `useConsultaProduto.ts`** 🪝
**O que é:** Hook React para gerenciar estado  
**Copiar para:** `src/hooks/useConsultaProduto.ts`  
**Contém:**
- Estados de loading/error/dados
- Função `consultar(gtin)`
- Função `limpar()`

### **3. `BotaoConsultarCosmos.tsx`** 🧩
**O que é:** Componente de botão pronto  
**Copiar para:** `src/components/BotaoConsultarCosmos.tsx`  
**Contém:**
- Botão estilizado
- Loading indicator
- Mensagens de erro/sucesso

### **4. `ExemploIntegracao.tsx`** 📄
**O que é:** Exemplo completo de uso  
**Usar como:** Referência para sua página de produtos pendentes  
**Mostra:**
- Como listar produtos do Supabase
- Como consultar a API Cosmos
- Como preencher formulário automaticamente
- Como salvar no banco

---

## 🚀 COMO USAR

### **PASSO 1: Copiar os arquivos**

```bash
# No seu projeto React
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/components

# Copiar arquivos (ajustar caminhos)
cp integracao-frontend/cosmosApi.ts src/services/
cp integracao-frontend/useConsultaProduto.ts src/hooks/
cp integracao-frontend/BotaoConsultarCosmos.tsx src/components/
```

### **PASSO 2: Ajustar imports**

Cada arquivo tem comentários indicando os imports que você precisa ajustar:

```typescript
// cosmosApi.ts - Já está pronto! ✅

// useConsultaProduto.ts - Ajustar import:
import { consultarProdutoComCache } from '../services/cosmosApi'; // ← Ajuste

// BotaoConsultarCosmos.tsx - Ajustar imports:
import { useConsultaProduto } from '../hooks/useConsultaProduto'; // ← Ajuste
import { extrairDadosParaFormulario } from '../services/cosmosApi'; // ← Ajuste
```

### **PASSO 3: Configurar URL da API**

No arquivo `cosmosApi.ts`, linha 11, altere para a URL real do Render:

```typescript
// Mudar de:
const RENDER_API_URL = 'https://ciclik-api-produtos.onrender.com';

// Para sua URL real:
const RENDER_API_URL = 'https://ciclik-api-produtos-xxxxx.onrender.com';
```

### **PASSO 4: Usar no componente**

```tsx
import { useConsultaProduto } from '@/hooks/useConsultaProduto';

function MeuComponente() {
  const { dados, loading, erro, consultar } = useConsultaProduto();

  async function handleBuscar(gtin: string) {
    await consultar(gtin);
    
    if (dados) {
      console.log('Categoria:', dados.categoria_api);
      console.log('NCM:', dados.ncm);
    }
  }

  return (
    <button onClick={() => handleBuscar('7891910000197')}>
      Buscar Dados
    </button>
  );
}
```

---

## ⚠️ ERROS DE COMPILAÇÃO

Se você ver erros como:
```
Não é possível localizar o módulo '../services/cosmosApi'
```

**É NORMAL!** Esses arquivos são exemplos. Os erros desaparecem quando você copia para a estrutura correta do seu projeto React.

---

## 🎯 ESTRUTURA RECOMENDADA NO SEU PROJETO

```
seu-projeto-react/
├── src/
│   ├── services/
│   │   └── cosmosApi.ts           ← Copiar daqui
│   ├── hooks/
│   │   └── useConsultaProduto.ts  ← Copiar daqui
│   ├── components/
│   │   └── BotaoConsultarCosmos.tsx ← Copiar daqui (opcional)
│   └── pages/
│       └── ProdutosPendentes.tsx  ← Criar baseado no exemplo
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Integração com Supabase:** `INTEGRACAO_BASE_DADOS_CICLIK.md`
- **Deploy da API:** `GUIA_RENDER_PUBLIC_REPOSITORY.md`
- **Resumo geral:** `RESUMO_EXECUTIVO_API.md`

---

## 🆘 PRECISA DE AJUDA?

1. Leia o arquivo `INTEGRACAO_BASE_DADOS_CICLIK.md`
2. Veja o exemplo completo em `ExemploIntegracao.tsx`
3. Consulte os comentários dentro de cada arquivo

---

**Última atualização:** 22/01/2026  
**Versão:** 1.0.0
