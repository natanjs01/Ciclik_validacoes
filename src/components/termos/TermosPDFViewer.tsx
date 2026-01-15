/**
 * Visualizador de PDF para Termos de Uso
 * Usa react-pdf para renderizar PDFs inline
 */

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Configurar worker do react-pdf LOCAL (evita problemas de CORS com service worker)
// Usa import.meta.env.BASE_URL para funcionar corretamente no GitHub Pages
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

interface TermosPDFViewerProps {
  pdfUrl: string;
  titulo: string;
  onDownload?: () => void;
}

/**
 * Componente para visualizar PDFs de termos
 * 
 * Features:
 * - Navegação entre páginas
 * - Zoom responsivo
 * - Download opcional
 * - Loading state
 * - Error handling
 * 
 * @example
 * ```tsx
 * <TermosPDFViewer
 *   pdfUrl="https://..."
 *   titulo="Termos de Uso v1.0"
 *   onDownload={handleDownload}
 * />
 * ```
 */
export function TermosPDFViewer({
  pdfUrl,
  titulo,
  onDownload,
}: TermosPDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Callback quando PDF é carregado com sucesso
   */
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  /**
   * Callback quando há erro ao carregar PDF
   */
  function onDocumentLoadError(error: Error) {
    console.error('Erro ao carregar PDF:', error);
    setError('Não foi possível carregar o PDF. Tente novamente mais tarde.');
    setLoading(false);
  }

  /**
   * Navega para próxima página
   */
  const handleProximaPagina = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(prev => prev + 1);
    }
  };

  /**
   * Navega para página anterior
   */
  const handlePaginaAnterior = () => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  };

  /**
   * Faz download do PDF
   */
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Download padrão via link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${titulo.replace(/\s+/g, '_')}.pdf`;
      link.click();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header com controles */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-muted/50">
        {/* Navegação de páginas */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaginaAnterior}
            disabled={pageNumber <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {loading ? (
              'Carregando...'
            ) : error ? (
              'Erro'
            ) : (
              `${pageNumber} / ${numPages || '?'}`
            )}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleProximaPagina}
            disabled={!numPages || pageNumber >= numPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão Download */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={loading || !!error}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {/* Conteúdo do PDF */}
      <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
        {error ? (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Carregando PDF...
                </p>
              </div>
            }
            error={
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar o PDF. Verifique sua conexão.
                </AlertDescription>
              </Alert>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
              width={Math.min(window.innerWidth * 0.8, 800)}
            />
          </Document>
        )}
      </div>

      {/* Footer com info */}
      <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground text-center">
        {titulo}
      </div>
    </div>
  );
}
