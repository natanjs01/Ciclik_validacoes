/**
 * Componentes de Termos de Uso
 * Exports centralizados para facilitar importação
 */

// Componentes principais
export { TermosModal } from './TermosModal';
export { TermosPDFViewer } from './TermosPDFViewer';
export { TermosContent, TermosResumo, TermosHTML } from './TermosContent';

// Componentes auxiliares
export {
  TermosCheckboxList,
  TermosSumario,
  AceitarTodosButton,
} from './TermosCheckboxList';

// Proteção e guards
export {
  TermosGuard,
  useTermosStatus,
  TermosPendentesBadge,
} from './TermosGuard';

// Re-exports de tipos úteis
export type { TermoParaExibicao } from '@/types/termos';
