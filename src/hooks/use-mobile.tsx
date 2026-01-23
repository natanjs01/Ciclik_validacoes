import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Verificar apenas uma vez no mount para evitar re-renders desnecessários
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
    };
    
    // Executar verificação inicial
    checkMobile();
    
    // Throttle para evitar múltiplos triggers em mobile (barra de endereço, teclado, etc)
    let timeout: NodeJS.Timeout;
    const onChange = () => {
      clearTimeout(timeout);
      timeout = setTimeout(checkMobile, 150); // Debounce de 150ms
    };
    
    mql.addEventListener("change", onChange);
    
    return () => {
      clearTimeout(timeout);
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return !!isMobile;
}
