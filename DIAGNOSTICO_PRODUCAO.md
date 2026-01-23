# 🔍 DIAGNÓSTICO: Loops Infinitos Persistindo em Produção

## 📅 Data: 23/01/2026
## 🎯 Situação: Correções aplicadas mas erro persiste

---

## ✅ Correções Já Aplicadas

### 1. useTermosPendentes.ts (Commit 77ad22c)
```tsx
// ❌ ANTES
useEffect(() => {
  if (autoCheck) verificar();
}, [autoCheck, verificar]); // ← verificar causava loop

// ✅ DEPOIS
useEffect(() => {
  if (autoCheck) verificar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoCheck, user?.id]); // ← Apenas primitivos
```

### 2. Index.tsx (Commit 77ad22c)
```tsx
// ❌ ANTES
useEffect(() => {
  const timer = setTimeout(() => navigate('/apresentacao'), 100);
  return () => clearTimeout(timer);
}, [navigate]); // ← navigate causava loop

// ✅ DEPOIS
useEffect(() => {
  const timer = setTimeout(() => navigate('/apresentacao'), 100);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← Executar apenas ao montar
```

### 3. InvestorPresentation.tsx (Commit 21030bd)
```tsx
// ❌ ANTES
const [hasAnimated, setHasAnimated] = useState(false);
useEffect(() => {
  setHasAnimated(true); // ← Causa re-render
}, [hasAnimated]); // ← Loop!

// ✅ DEPOIS
const hasAnimated = useRef(false);
useEffect(() => {
  hasAnimated.current = true; // ← Não causa re-render
}, [isInView, end]); // ← Sem hasAnimated
```

---

## 🚨 POSSÍVEIS CAUSAS ADICIONAIS

### 1. **Cache do Service Worker (PWA)**

#### Problema:
O Service Worker pode ter cacheado a versão **antiga** do código com bugs:

```typescript
// vite.config.ts - Service Worker está ativo em produção
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst', // ← Pode estar retornando cache antigo
        networkTimeoutSeconds: 10
      }
    ]
  }
})
```

**Sintomas:**
- Correções no código não aparecem em produção
- Comportamento inconsistente entre sessões
- "Hard refresh" (Ctrl+Shift+R) resolve temporariamente

**Como Verificar:**
1. Abra DevTools no site em produção
2. Vá em Application → Service Workers
3. Veja se há um Service Worker ativo
4. Clique em "Unregister" ou "Update"

#### Solução:
```javascript
// No navegador, forçar atualização do Service Worker:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});

// Limpar todos os caches:
caches.keys().then(function(names) {
  for (let name of names) caches.delete(name);
});

// Recarregar a página:
window.location.reload();
```

### 2. **GitHub Actions Cache**

#### Problema:
O GitHub Pages pode estar servindo uma versão antiga do build:

```yaml
# .github/workflows/deploy.yml
# Se o cache não for invalidado, pode servir build antigo
```

**Como Verificar:**
1. Acessar: https://github.com/natanjs01/Ciclik_validacoes/actions
2. Ver se o último deploy (commit 544d2a9) foi concluído com sucesso
3. Verificar timestamp do deploy vs timestamp dos commits

#### Solução:
- Aguardar deploy completo (2-5 minutos)
- Se necessário, disparar novo deploy manualmente
- Verificar no GitHub Actions se não há erros

### 3. **Browser Cache (LocalStorage/SessionStorage)**

#### Problema:
Estados ruins salvos no localStorage podem persistir:

```typescript
// Exemplo de dados ruins persistindo:
localStorage: {
  'points_cache_<user_id>': '...',
  'tour_completed_user_dashboard': true,
  'supabase.auth.token': '...'
}
```

**Como Verificar:**
1. Abra DevTools → Application → Local Storage
2. Verifique se há estados antigos/corrompidos
3. Limpe tudo e recarregue

#### Solução:
```javascript
// Limpar todos os caches do navegador:
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### 4. **Outros Hooks com Problemas Similares**

Vou procurar por outros padrões problemáticos que podem ter sido esquecidos:

#### Padrões Perigosos:
```tsx
// ❌ Padrão 1: Objeto inteiro nas dependências
useEffect(() => {
  fetchData();
}, [user]); // ← user muda sempre

// ❌ Padrão 2: Função criada com useCallback nas dependências
const myFunc = useCallback(() => {}, [someDep]);
useEffect(() => {
  myFunc();
}, [myFunc]); // ← myFunc muda quando someDep muda

// ❌ Padrão 3: State que se auto-atualiza
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
}, [count]); // ← Loop infinito clássico

// ❌ Padrão 4: Navegação sem dependências controladas
useEffect(() => {
  if (condition) navigate('/somewhere');
}, [condition, navigate]); // ← navigate pode causar loop
```

### 5. **React Router + Base Path**

#### Problema:
Diferença de base path entre dev e prod pode causar loops de navegação:

```typescript
// vite.config.ts
base: mode === 'production' ? '/Ciclik_validacoes/' : '/',

// src/App.tsx
<BrowserRouter 
  basename={import.meta.env.MODE === 'production' ? '/Ciclik_validacoes' : '/'}
>
```

**Sintomas:**
- Navegação funciona em dev mas não em prod
- Redirecionamentos 404 em prod
- Loops de redirecionamento

**Como Verificar:**
1. Verificar se URLs em produção têm `/Ciclik_validacoes/` no path
2. Verificar se não há `/Ciclik_validacoes/Ciclik_validacoes/` (duplicação)
3. Ver no Network tab se requests estão no path correto

### 6. **AuthContext Token Refresh**

#### Problema:
O Supabase faz refresh de tokens a cada ~55 minutos, e isso pode disparar `onAuthStateChange`:

```tsx
// AuthContext.tsx
supabase.auth.onAuthStateChange((event, newSession) => {
  // ⚠️ Se não ignorar TOKEN_REFRESHED, pode causar reloads
  const ignoredEvents = ['TOKEN_REFRESHED', 'INITIAL_SESSION'];
  if (ignoredEvents.includes(event)) return; // ✅ Já está correto
  
  // ...resto do código
})
```

**Como Verificar:**
1. Abrir DevTools → Console
2. Deixar a página aberta por 5-10 minutos
3. Ver se aparecem logs de `onAuthStateChange`
4. Ver se página recarrega sozinha

### 7. **Realtime Subscriptions Não Limpas**

#### Problema:
Subscriptions do Supabase acumulando sem cleanup:

```tsx
// ❌ ERRADO
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', ..., () => {
      loadData(); // ← Pode disparar infinitamente
    })
    .subscribe();
  
  // ❌ FALTANDO: return () => supabase.removeChannel(channel);
}, []);
```

**Como Verificar:**
1. Abrir DevTools → Network → WS (WebSocket)
2. Ver se há múltiplas conexões abertas
3. Ver se há mensagens sendo enviadas/recebidas infinitamente

#### Solução:
```tsx
// ✅ CORRETO
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', ..., () => {
      loadData();
    })
    .subscribe();
  
  // ✅ Cleanup adequado
  return () => supabase.removeChannel(channel);
}, []);
```

---

## 🔬 PLANO DE DIAGNÓSTICO

### Etapa 1: Verificar Service Worker e Cache
```javascript
// Cole isso no Console do navegador (DevTools) na página de produção:

// 1. Verificar Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers ativos:', registrations.length);
  registrations.forEach(reg => {
    console.log('SW:', reg.scope);
    console.log('Estado:', reg.active?.state);
  });
});

// 2. Listar todos os caches
caches.keys().then(cacheNames => {
  console.log('Caches existentes:', cacheNames);
});

// 3. Verificar versão do código
console.log('Base URL:', window.location.origin);
console.log('Path:', window.location.pathname);
console.log('Build time:', document.querySelector('meta[name="build-time"]')?.content || 'N/A');
```

### Etapa 2: Limpar Tudo e Recarregar
```javascript
// Cole isso no Console do navegador:

// 1. Desregistrar Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// 2. Limpar todos os caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// 3. Limpar localStorage e sessionStorage
localStorage.clear();
sessionStorage.clear();

// 4. Recarregar página (hard refresh)
window.location.reload(true);
```

### Etapa 3: Monitorar Network e Console
1. Abrir DevTools → Network
2. Filtrar por "Fetch/XHR"
3. Verificar se há requests em loop
4. Anotar quais endpoints estão sendo chamados infinitamente

### Etapa 4: Verificar Console de Erros
1. Abrir DevTools → Console
2. Verificar se há erros de JavaScript
3. Verificar se há warnings do React
4. Anotar qualquer mensagem suspeita

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

### ✅ GitHub Actions
- [ ] Último commit (544d2a9) deployado com sucesso?
- [ ] Deploy completou sem erros?
- [ ] Timestamp do deploy corresponde ao commit?

### ✅ Service Worker
- [ ] Service Worker está ativo?
- [ ] Versão do Service Worker é a mais recente?
- [ ] Cache do Service Worker foi limpo?

### ✅ Browser
- [ ] Cache do navegador foi limpo (Ctrl+Shift+Delete)?
- [ ] localStorage foi limpo?
- [ ] sessionStorage foi limpo?
- [ ] Hard refresh foi feito (Ctrl+Shift+R)?

### ✅ Código
- [ ] Todas as correções estão no repositório?
- [ ] Build local funciona sem problemas?
- [ ] Não há warnings do React em desenvolvimento?

---

## 🚀 PRÓXIMOS PASSOS

### 1. **Usuário: Limpar Cache e Service Worker**
Execute os scripts acima no Console do navegador na página de produção.

### 2. **Desenvolvedor: Verificar GitHub Actions**
Confirmar que o deploy do commit 544d2a9 foi concluído com sucesso.

### 3. **Desenvolvedor: Adicionar Meta Tag de Build**
Para identificar qual versão está em produção:

```tsx
// src/index.html ou src/App.tsx
<meta name="build-time" content={new Date().toISOString()} />
<meta name="commit-hash" content="544d2a9" />
```

### 4. **Desenvolvedor: Adicionar Logging de Diagnóstico**
Adicionar console.log temporário para identificar loops:

```tsx
// src/hooks/useTermosPendentes.ts
useEffect(() => {
  console.log('🔍 [DEBUG] useTermosPendentes - useEffect disparado', { 
    autoCheck, 
    userId: user?.id,
    timestamp: new Date().toISOString()
  });
  
  if (autoCheck) verificar();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoCheck, user?.id]);
```

### 5. **Usuário: Testar em Modo Anônimo**
Abrir o site em uma janela anônima/privada para garantir que não há cache do navegador.

---

## 📊 RESULTADO ESPERADO

Após seguir todos os passos acima:
- ✅ Service Worker atualizado para a versão mais recente
- ✅ Cache limpo (browser + SW + storage)
- ✅ Código com correções deployado
- ✅ Navegação fluida sem loops
- ✅ Páginas não recarregam infinitamente

---

## 📞 COMUNICAÇÃO COM USUÁRIO

**Para o usuário:**
1. Abra o site: https://natanjs01.github.io/Ciclik_validacoes/
2. Abra o DevTools (F12)
3. Vá na aba "Console"
4. Cole e execute os scripts da **Etapa 2** acima
5. Aguarde a página recarregar
6. Teste a navegação: Home → Auth → Dashboard → Voltar
7. Relate se o problema persiste

**Se o problema persistir:**
- Capture screenshot do DevTools → Console (com erros)
- Capture screenshot do DevTools → Network (com requests em loop)
- Informe qual página específica está com problema
- Informe o navegador e versão (Chrome 120, Firefox 121, etc.)

---

## 🔍 HIPÓTESE PRINCIPAL

**Causa mais provável:** Service Worker cacheou a versão antiga do código antes das correções.

**Evidência:**
- Correções funcionam localmente (`npm run dev`)
- Correções estão no código (commits confirmados)
- Problema persiste **apenas** em produção
- Service Worker é ativo apenas em produção

**Teste Definitivo:**
1. Desregistrar Service Worker
2. Limpar todos os caches
3. Hard refresh
4. Se funcionar → Era cache do SW
5. Se não funcionar → Há outro problema no código

---

**Status:** 🔴 Aguardando teste do usuário após limpeza de cache
