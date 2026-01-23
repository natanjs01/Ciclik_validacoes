# 🐛 BUG REAL ENCONTRADO - Conflito Service Worker + Extensão Tactiq

## 📊 Evidências no Network Tab

Analisando as 3 capturas de tela do DevTools Network:

### ⚠️ Padrão Identificado

```
❌ proxy?sessionId=5155356798&appName=tactiq-extension&environment=default
   Status: (cancelled)
   Iniciador: Ciclik_validacoes/service-worker.js:19

❌ proxy?sessionId=5155356798&appName=tactiq-extension&environment=default  
   Status: (cancelled)
   Iniciador: Ciclik_validacoes/service-worker.js:56

❌ proxy?sessionId=5155356798&appName=tactiq-extension&environment=default
   Status: (cancelled)
   Iniciador: content.js:77
```

### 📈 Estatísticas

- **1ª Captura**: 213 requests / 1.912 kB transferido / Finish: 37.46s
- **2ª Captura**: 276 requests / 1.914 kB transferido / Finish: 50.35s  
- **3ª Captura**: 470 requests / 1.057 kB transferido / Finish: **1.6 min** / Load: **1.6 min**

**Centenas de requisições canceladas em poucos segundos!**

---

## 🔍 Análise do Problema

### O Que Está Acontecendo

1. **Service Worker Ativo**: `Ciclik_validacoes/service-worker.js` está interceptando requisições
2. **Extensão Tactiq**: Tentando fazer proxy de sessões (`proxy?sessionId=`)
3. **Conflito**: Service Worker e Tactiq entram em **loop infinito**:
   - Service Worker intercepta requisição da extensão
   - Extensão tenta novamente
   - Service Worker intercepta de novo
   - **Loop infinito!** 🔄

### Por Que Não Aconteceu no Primeiro Carregamento?

- **1º acesso**: Service Worker estava **inativo** ou ainda não registrado
- **Após F5**: Service Worker **ativa completamente** e começa a interceptar TUDO
- **Tactiq detecta**: Começa a tentar suas requisições
- **Conflito inicia**: Loop infinito começa

---

## ✅ Soluções Aplicadas

### 1️⃣ Correção do `start_url` (Commit anterior)

```typescript
// ANTES (ERRADO)
start_url: '/Ciclik_validacoes/?source=pwa'

// DEPOIS (CORRETO)  
start_url: '/Ciclik_validacoes/'
```

Isso resolveu **parte do problema**, mas não o loop infinito.

### 2️⃣ Desabilitação Temporária do PWA (Commit atual)

Para diagnosticar o conflito com a extensão Tactiq, desabilitamos temporariamente todo o PWA:

```typescript
// plugins: [
//   react(),
//   VitePWA({ ... }) // COMENTADO TEMPORARIAMENTE
// ]
```

---

## 🧪 Testes a Realizar

### Teste 1: Sem Extensão Tactiq

1. Desabilitar extensão Tactiq no navegador
2. Acessar site em produção
3. Apertar F5 várias vezes
4. ✅ Deve funcionar perfeitamente

### Teste 2: Modo Anônimo (sem extensões)

1. Abrir Chrome em modo anônimo (Ctrl+Shift+N)
2. Acessar site em produção  
3. Apertar F5 várias vezes
4. ✅ Deve funcionar perfeitamente

### Teste 3: Com Build Sem PWA (após deploy atual)

1. Aguardar deploy do GitHub Actions (~2-3 min)
2. Limpar cache (Ctrl+Shift+Delete)
3. Acessar site em produção (mesmo com Tactiq ativa)
4. Apertar F5 várias vezes
5. ✅ Deve funcionar (sem Service Worker = sem conflito)

---

## 🎯 Soluções Definitivas (a implementar)

Se o Teste 3 confirmar que é a extensão Tactiq:

### Opção A: Filtrar Requisições de Extensões no Service Worker

Criar Service Worker customizado que ignora requisições de extensões:

```javascript
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Ignorar requisições de extensões
  if (
    url.includes('chrome-extension://') ||
    url.includes('/proxy?sessionId=') ||
    url.includes('tactiq-extension')
  ) {
    return; // Não interceptar
  }
  
  // Continuar normalmente para outras requisições
});
```

### Opção B: Documentar Conflito com Extensões

Adicionar aviso na documentação:

> ⚠️ **Conflito Conhecido**: A extensão Tactiq pode causar loops infinitos quando o PWA está ativo. 
> Recomendamos desabilitar Tactiq ou usar em modo anônimo.

### Opção C: Implementar Detecção e Aviso

Detectar conflito e exibir toast:

```typescript
if (navigator.serviceWorker?.controller) {
  // Detectar requisições canceladas repetidas
  let cancelCount = 0;
  
  // Se > 10 cancelamentos em 5s, avisar usuário
  if (cancelCount > 10) {
    toast.warning('Detectado conflito com extensão do navegador. Considere desabilitá-la.');
  }
}
```

---

## 📝 Próximos Passos

1. ✅ **Deploy realizado** - Aguardar GitHub Actions
2. 🧪 **Testar** - Verificar se sem PWA o problema some
3. 🔧 **Decidir** - Reimplementar PWA com filtros ou deixar sem PWA?
4. 📄 **Documentar** - Adicionar nota sobre extensões conflitantes

---

## 🎓 Lições Aprendidas

1. **Service Workers são poderosos**, mas podem conflitar com extensões
2. **Network Tab com "Preserve log"** é essencial para debug
3. **Requisições canceladas em loop** indicam conflito de interceptação
4. **PWA não é obrigatório** - pode ser opcional se causar problemas

---

**Data**: 23/01/2026  
**Status**: 🔬 Em diagnóstico  
**Confiança**: 95% - Evidências claras do conflito Service Worker + Tactiq
