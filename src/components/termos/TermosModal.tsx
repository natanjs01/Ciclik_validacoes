/**
 * Modal de Termos de Uso
 * Modal não-fechável que bloqueia acesso até aceite
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, FileText, AlertTriangle } from 'lucide-react';
import type { TermoParaExibicao } from '@/types/termos';
import { TermosPDFViewer } from './TermosPDFViewer';
import { TermosContent } from './TermosContent';

interface TermosModalProps {
  termos: TermoParaExibicao[];
  onAceitar: (termoIds: string[]) => Promise<void>;
  onLogout: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Modal de Aceite de Termos
 * 
 * - Não pode ser fechado (backdrop disabled, ESC disabled)
 * - Usuário deve aceitar todos os termos obrigatórios
 * - Opção de logout para cancelar
 * - Visualização de PDF inline
 * - Scroll individual por termo
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { termosPendentes } = useTermosPendentes();
 *   const { registrar, loading } = useRegistrarAceite();
 *   
 *   return (
 *     <TermosModal
 *       termos={termosPendentes}
 *       onAceitar={registrar}
 *       onLogout={handleLogout}
 *       loading={loading}
 *     />
 *   );
 * }
 * ```
 */
export function TermosModal({
  termos,
  onAceitar,
  onLogout,
  loading = false,
  error = null,
}: TermosModalProps) {
  const [aceitosMap, setAceitosMap] = useState<Record<string, boolean>>({});
  const [termoAtualIndex, setTermoAtualIndex] = useState(0);
  const [mostrarPDF, setMostrarPDF] = useState(false);

  // Se não há termos, não mostra modal
  if (termos.length === 0) {
    return null;
  }

  const termoAtual = termos[termoAtualIndex];
  const totalTermos = termos.length;
  const termosObrigatorios = termos.filter(t => t.obrigatorio);
  
  // Verificar se todos obrigatórios foram aceitos
  const todosObrigatoriosAceitos = termosObrigatorios.every(
    termo => aceitosMap[termo.id] === true
  );

  // Verificar se termo atual foi aceito
  const termoAtualAceito = aceitosMap[termoAtual.id] === true;

  /**
   * Toggle aceite de um termo
   */
  const handleToggleAceite = (termoId: string, aceito: boolean) => {
    setAceitosMap(prev => ({
      ...prev,
      [termoId]: aceito,
    }));
  };

  /**
   * Navega para próximo termo
   */
  const handleProximo = () => {
    if (termoAtualIndex < totalTermos - 1) {
      setTermoAtualIndex(prev => prev + 1);
      setMostrarPDF(false);
    }
  };

  /**
   * Navega para termo anterior
   */
  const handleAnterior = () => {
    if (termoAtualIndex > 0) {
      setTermoAtualIndex(prev => prev - 1);
      setMostrarPDF(false);
    }
  };

  /**
   * Finaliza aceite de todos os termos
   */
  const handleAceitarTodos = async () => {
    // IDs dos termos aceitos
    const idsAceitos = Object.entries(aceitosMap)
      .filter(([_, aceito]) => aceito)
      .map(([id]) => id);

    // Registrar aceites
    await onAceitar(idsAceitos);
  };

  return (
    <Dialog open={true} modal>
      <DialogContent
        className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()} // Bloqueia fechar clicando fora
        onEscapeKeyDown={(e) => e.preventDefault()} // Bloqueia ESC
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Termos e Políticas - Leitura Obrigatória
          </DialogTitle>
          <DialogDescription>
            Para continuar usando a plataforma, você deve ler e aceitar os termos abaixo.
            {totalTermos > 1 && ` (${termoAtualIndex + 1} de ${totalTermos})`}
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo do termo atual - COM SCROLL */}
        <ScrollArea className="flex-1 overflow-y-auto pr-6">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{termoAtual.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {termoAtual.tipoLabel} • Versão {termoAtual.versao}
                    {termoAtual.obrigatorio && (
                      <span className="ml-2 text-destructive font-medium">
                        * Obrigatório
                      </span>
                    )}
                  </p>
                  {termoAtual.resumo && (
                    <p className="text-sm mt-2 text-foreground/80">
                      {termoAtual.resumo}
                    </p>
                  )}
                </div>

                {/* Botão visualizar PDF */}
                {termoAtual.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarPDF(!mostrarPDF)}
                  >
                    {mostrarPDF ? 'Ocultar' : 'Ver'} PDF
                  </Button>
                )}
              </div>
            </div>

            {/* Conteúdo do termo - SEM ScrollArea interno */}
            <div>
              {mostrarPDF && termoAtual.pdf_url ? (
                <TermosPDFViewer
                  pdfUrl={termoAtual.pdf_url}
                  titulo={termoAtual.titulo}
                />
              ) : (
                <div className="border rounded-lg">
                  <TermosContent termo={termoAtual} />
                </div>
              )}
            </div>

            {/* Checkbox de aceite - DENTRO DO SCROLL */}
            <div className="p-4 border rounded-lg bg-card">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={termoAtualAceito}
                  onCheckedChange={(checked) =>
                    handleToggleAceite(termoAtual.id, checked === true)
                  }
                  disabled={loading}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {termoAtual.obrigatorio ? (
                      <>Li e aceito {termoAtual.tipoLabel}</>
                    ) : (
                      <>Li e aceito {termoAtual.tipoLabel} (opcional)</>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {termoAtual.obrigatorio
                      ? 'É necessário aceitar este termo para continuar'
                      : 'Este termo é opcional, mas recomendado'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </ScrollArea>

        {/* Mensagem de erro - FORA DO SCROLL */}
        {error && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progresso */}
        {totalTermos > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${((termoAtualIndex + 1) / totalTermos) * 100}%`,
                }}
              />
            </div>
            <span className="whitespace-nowrap">
              {termoAtualIndex + 1} de {totalTermos}
            </span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0">
          {/* Botão Logout */}
          <Button
            variant="ghost"
            onClick={onLogout}
            disabled={loading}
            className="sm:mr-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>

          {/* Navegação entre termos */}
          {totalTermos > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAnterior}
                disabled={termoAtualIndex === 0 || loading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleProximo}
                disabled={termoAtualIndex === totalTermos - 1 || loading}
              >
                Próximo
              </Button>
            </div>
          )}

          {/* Botão Aceitar Todos */}
          <Button
            onClick={handleAceitarTodos}
            disabled={!todosObrigatoriosAceitos || loading}
            className="min-w-[150px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>Aceitar e Continuar</>
            )}
          </Button>
        </DialogFooter>

        {/* Aviso sobre termos obrigatórios */}
        {!todosObrigatoriosAceitos && (
          <div className="text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Você deve aceitar todos os termos obrigatórios para continuar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
