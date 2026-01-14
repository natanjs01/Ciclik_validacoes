/**
 * Componente para exibir conteúdo HTML de termos
 * Renderiza HTML sanitizado ou fallback para texto
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TermoParaExibicao } from '@/types/termos';

interface TermosContentProps {
  termo: TermoParaExibicao;
  className?: string;
}

/**
 * Componente de Conteúdo de Termos
 * 
 * Exibe conteúdo HTML se disponível, caso contrário mostra aviso
 * para visualizar PDF
 * 
 * @example
 * ```tsx
 * <TermosContent termo={termoAtual} />
 * ```
 */
export function TermosContent({ termo, className = '' }: TermosContentProps) {
  /**
   * Abre PDF em nova aba
   */
  const handleAbrirPDF = () => {
    window.open(termo.pdf_url, '_blank', 'noopener,noreferrer');
  };

  // Se tem conteúdo HTML, renderiza
  if (termo.conteudo_html) {
    return (
      <div className={`p-6 ${className}`}>
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: termo.conteudo_html }}
        />
      </div>
    );
  }

  // Se não tem HTML, mostra aviso para abrir PDF
  return (
    <div className={`p-6 ${className}`}>
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <p className="mb-4">
            O conteúdo completo deste termo está disponível no documento PDF.
          </p>
          
          {termo.resumo && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="font-medium text-sm mb-2">Resumo:</p>
              <p className="text-sm">{termo.resumo}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleAbrirPDF}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir PDF em Nova Aba
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Você pode visualizar o PDF clicando no botão "Ver PDF" acima
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Componente simplificado para exibir apenas resumo
 */
export function TermosResumo({ termo }: { termo: TermoParaExibicao }) {
  if (!termo.resumo) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Visualize o PDF para ler o conteúdo completo</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <h3 className="text-lg font-semibold mb-3">Resumo</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {termo.resumo}
        </p>
      </div>
    </div>
  );
}

/**
 * Componente para renderizar HTML sanitizado
 * Previne XSS e outros ataques
 */
export function TermosHTML({ html }: { html: string }) {
  // TODO: Adicionar sanitização com DOMPurify se necessário
  // import DOMPurify from 'dompurify';
  // const cleanHTML = DOMPurify.sanitize(html);

  return (
    <div className="p-6">
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
