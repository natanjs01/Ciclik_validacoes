/**
 * Lista de Checkboxes para Termos
 * Permite aceite individual de múltiplos termos
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, AlertCircle } from 'lucide-react';
import type { TermoParaExibicao } from '@/types/termos';

interface TermosCheckboxListProps {
  termos: TermoParaExibicao[];
  aceitosMap: Record<string, boolean>;
  onToggle: (termoId: string, aceito: boolean) => void;
  disabled?: boolean;
  mostrarPDF?: (termo: TermoParaExibicao) => void;
}

/**
 * Lista de termos com checkboxes individuais
 * 
 * @example
 * ```tsx
 * function MeuComponente() {
 *   const [aceitos, setAceitos] = useState({});
 *   
 *   return (
 *     <TermosCheckboxList
 *       termos={termosPendentes}
 *       aceitosMap={aceitos}
 *       onToggle={(id, valor) => setAceitos(prev => ({ ...prev, [id]: valor }))}
 *     />
 *   );
 * }
 * ```
 */
export function TermosCheckboxList({
  termos,
  aceitosMap,
  onToggle,
  disabled = false,
  mostrarPDF,
}: TermosCheckboxListProps) {
  if (termos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum termo pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {termos.map((termo) => {
        const aceito = aceitosMap[termo.id] === true;

        return (
          <Card
            key={termo.id}
            className={`transition-all ${
              aceito ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">
                      {termo.titulo}
                    </CardTitle>
                    {termo.obrigatorio && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {termo.tipoLabel} • Versão {termo.versao}
                  </CardDescription>
                </div>

                {/* Botão Ver PDF */}
                {termo.pdf_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mostrarPDF?.(termo)}
                    disabled={disabled}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Resumo se disponível */}
              {termo.resumo && (
                <p className="text-sm text-muted-foreground mb-3">
                  {termo.resumo}
                </p>
              )}

              {/* Checkbox de aceite */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={aceito}
                  onCheckedChange={(checked) =>
                    onToggle(termo.id, checked === true)
                  }
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Li e aceito este termo
                  </p>
                  {termo.obrigatorio && (
                    <p className="text-xs text-muted-foreground mt-1">
                      É necessário aceitar este termo para continuar
                    </p>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Sumário de aceites
 * Mostra progresso e validação
 */
interface TermosSumarioProps {
  termos: TermoParaExibicao[];
  aceitosMap: Record<string, boolean>;
}

export function TermosSumario({ termos, aceitosMap }: TermosSumarioProps) {
  const totalTermos = termos.length;
  const termosObrigatorios = termos.filter(t => t.obrigatorio);
  const totalObrigatorios = termosObrigatorios.length;

  const totalAceitos = Object.values(aceitosMap).filter(Boolean).length;
  const obrigatoriosAceitos = termosObrigatorios.filter(
    t => aceitosMap[t.id] === true
  ).length;

  const todosObrigatoriosAceitos = obrigatoriosAceitos === totalObrigatorios;
  const percentual = (totalAceitos / totalTermos) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progresso de Aceite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progresso */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium">
              {totalAceitos} de {totalTermos}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* Status obrigatórios */}
        {totalObrigatorios > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            {todosObrigatoriosAceitos ? (
              <>
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Todos os termos obrigatórios foram aceitos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode continuar
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Faltam termos obrigatórios
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {obrigatoriosAceitos} de {totalObrigatorios} aceitos
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Lista de termos não aceitos */}
        {totalAceitos < totalTermos && (
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">Termos pendentes:</p>
            <ul className="space-y-1 list-disc list-inside">
              {termos
                .filter(t => !aceitosMap[t.id])
                .map(t => (
                  <li key={t.id}>
                    {t.titulo}
                    {t.obrigatorio && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Botão de Aceitar Todos
 * Marca todos os termos como aceitos de uma vez
 */
interface AceitarTodosButtonProps {
  termos: TermoParaExibicao[];
  onAceitarTodos: () => void;
  disabled?: boolean;
}

export function AceitarTodosButton({
  termos,
  onAceitarTodos,
  disabled = false,
}: AceitarTodosButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onAceitarTodos}
      disabled={disabled || termos.length === 0}
      className="w-full"
    >
      <FileText className="h-4 w-4 mr-2" />
      Marcar Todos como Lidos
    </Button>
  );
}
