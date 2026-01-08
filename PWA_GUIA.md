# 📱 PWA - Progressive Web App Ciclik

## ✅ Funcionalidades Implementadas

### 🎯 O que foi adicionado:

1. **Manifest.json** (`/public/manifest.json`)
   - Configuração do app como PWA
   - Ícones e cores do tema
   - Nome curto e descrição
   - Modo standalone (fullscreen)

2. **Service Worker** (`/public/service-worker.js`)
   - Cache de assets estáticos
   - Funcionalidade offline básica
   - Atualização automática de cache

3. **Componente PWAInstallPrompt** (`/src/components/PWAInstallPrompt.tsx`)
   - Banner de instalação personalizado
   - Aparece automaticamente quando possível
   - Pode ser dispensado pelo usuário
   - Design responsivo com shadcn/ui

4. **Hook usePWA** (`/src/hooks/usePWA.ts`)
   - Hook reutilizável para PWA
   - Estados: isInstallable, isInstalled
   - Método: installApp()

5. **Meta tags HTML** (atualizadas no `index.html`)
   - Theme color
   - Apple touch icon
   - Mobile web app capable

---

## 🚀 Como Funciona

### Instalação Automática:
1. O usuário acessa o site no Chrome/Edge/Safari
2. O navegador detecta que é um PWA
3. Um banner aparece no canto inferior direito
4. O usuário clica em "Instalar"
5. O app é instalado na tela inicial

### Instalação Manual:
- **Chrome/Edge**: Menu (⋮) → "Instalar aplicativo"
- **Safari iOS**: Compartilhar → "Adicionar à Tela de Início"
- **Android**: Menu (⋮) → "Adicionar à tela inicial"

---

## 📋 Requisitos para PWA Funcionar

### ✅ Checklist de Produção:

1. **HTTPS Obrigatório** ⚠️
   - PWA só funciona em HTTPS (ou localhost)
   - Certifique-se que o domínio tem SSL/TLS

2. **Service Worker Registrado**
   - Automático ao carregar o app
   - Verifica no DevTools → Application → Service Workers

3. **Manifest.json Válido**
   - Ícones no mínimo 192x192 e 512x512
   - Nome e descrição preenchidos
   - Theme color definida

4. **Ícones Corretos**
   - Certifique-se que `/favicon.png` existe
   - Ideal: criar ícones específicos para PWA

---

## 🎨 Customização

### Alterar Cores:
```json
// public/manifest.json
{
  "theme_color": "#8CC63F",  // Cor da barra de status
  "background_color": "#ffffff"  // Cor de fundo do splash
}
```

### Alterar Ícones:
Substitua os ícones em:
- `/public/favicon.png` (512x512 recomendado)
- `/public/ciclik-logo-full.png` (para splash screen)

### Alterar Comportamento do Prompt:
```tsx
// src/components/PWAInstallPrompt.tsx
// Linha 90: Customizar design do card
// Linha 105: Alterar texto e botões
```

---

## 🧪 Como Testar

### Desenvolvimento (localhost):
```bash
npm run dev
```
- Abra `http://localhost:8080`
- O PWA funcionará mesmo sem HTTPS

### Produção:
1. Faça deploy com HTTPS
2. Acesse pelo mobile
3. Aguarde o prompt de instalação aparecer

### Verificar no DevTools:
1. Abra DevTools (F12)
2. Vá em "Application" ou "Aplicativo"
3. Verifique:
   - ✅ Manifest
   - ✅ Service Workers
   - ✅ Cache Storage

---

## 📱 Experiência do Usuário

### Quando Instalado:
- ✅ Ícone na tela inicial
- ✅ Sem barra de URL
- ✅ Tela cheia (standalone)
- ✅ Splash screen automático
- ✅ Funciona offline (parcial)

### Comportamento Offline:
O Service Worker atual faz cache de:
- Página inicial
- Ícones e imagens estáticas
- Assets do Vite (quando acessados)

⚠️ **Nota**: Requisições ao Supabase ainda precisam de internet

---

## 🔧 Melhorias Futuras (Opcional)

### 1. Cache Mais Agressivo:
```js
// service-worker.js - Adicionar mais rotas ao cache
const urlsToCache = [
  '/',
  '/index.html',
  '/user',
  '/missions',
  // ... outras rotas
];
```

### 2. Notificações Push:
- Implementar Web Push API
- Requer servidor de notificações

### 3. Background Sync:
- Sincronizar dados quando voltar online
- Requer lógica adicional

### 4. Offline Fallback:
- Página customizada quando offline
- Melhor experiência para usuário

---

## 🐛 Troubleshooting

### Prompt não aparece:
- ✅ Certifique-se que está em HTTPS
- ✅ Limpe cache do navegador
- ✅ Desinstale versões anteriores do app
- ✅ Verifique se o manifest.json está acessível

### Service Worker não registra:
```js
// Verificar no console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### App não instala no iOS:
- iOS Safari requer adicionar manualmente
- Não mostra prompt automático
- Use: Compartilhar → "Adicionar à Tela de Início"

---

## 📚 Recursos

- [MDN - Progressive Web Apps](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)

---

## ✅ Status da Implementação

- ✅ Manifest.json configurado
- ✅ Service Worker implementado
- ✅ Meta tags PWA adicionadas
- ✅ Componente de instalação criado
- ✅ Hook usePWA disponível
- ✅ Integrado ao App.tsx
- ⚠️ **Requer HTTPS em produção**
- ⚠️ **Ícones podem ser otimizados**

---

**Desenvolvido para Ciclik - Recicle e Ganhe** 🌱
