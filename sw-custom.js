// Service Worker customizado para ignorar requisições de extensões
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Ignorar requisições de extensões do navegador
  if (
    url.includes('chrome-extension://') ||
    url.includes('moz-extension://') ||
    url.includes('ms-browser-extension://') ||
    url.includes('/proxy?sessionId=') ||  // Tactiq extension
    url.includes('tactiq-extension') ||
    url.includes('appName=tactiq')
  ) {
    // Não interceptar - deixar o navegador lidar
    return;
  }
  
  // Para todas as outras requisições, continuar normalmente
  // O Workbox injetará seu código aqui
});
