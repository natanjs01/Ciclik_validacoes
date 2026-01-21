import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Registrar o Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nova versão disponível. Atualizando...');
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  },
  onRegistered(registration) {
    console.log('Service Worker registrado com sucesso');
    // Verificar atualizações a cada hora
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('Erro ao registrar Service Worker:', error);
  },
  immediate: true
});

// Suprimir avisos desnecessários do console
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Filtrar avisos do React DevTools e manifest
  if (
    message.includes('Download the React DevTools') ||
    message.includes('React DevTools') ||
    message.includes('icon from the Manifest')
  ) {
    return;
  }
  originalWarn(...args);
};

// Suprimir erros não críticos do manifest
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  if (
    message.includes('icon from the Manifest') ||
    message.includes('Download error or resource isn\'t a valid image')
  ) {
    return;
  }
  originalError(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
