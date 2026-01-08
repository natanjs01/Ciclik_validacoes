import { useState, useEffect, useCallback } from 'react';

interface UseTourProps {
  tourKey: string;
  autoStart?: boolean;
}

export const useTour = ({ tourKey, autoStart = true }: UseTourProps) => {
  const [run, setRun] = useState(false);
  const storageKey = `tour_completed_${tourKey}`;

  useEffect(() => {
    if (autoStart) {
      const hasSeenTour = localStorage.getItem(storageKey);
      if (!hasSeenTour) {
        // Delay para garantir que a página está totalmente carregada
        const timer = setTimeout(() => {
          setRun(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart, storageKey]);

  // Apenas inicia o tour (sem resetar localStorage) - para botão "ver novamente"
  const startTour = useCallback(() => {
    setRun(true);
  }, []);

  // Reseta localStorage E inicia tour (para debug/admin)
  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRun(true);
  }, [storageKey]);

  // Marca como completo e para o tour
  const completeTour = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setRun(false);
  }, [storageKey]);

  return {
    run,
    startTour,
    resetTour,
    completeTour,
    setRun
  };
};
