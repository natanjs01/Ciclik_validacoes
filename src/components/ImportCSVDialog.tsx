import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Papa from 'papaparse';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { TipoEmbalagem, TIPOS_EMBALAGEM_LABELS } from '@/types/produtos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CSVRow {
  gtin: string;
  ncm: string;
  descricao: string;
  tipo_embalagem: string;
  reciclavel: string;
  percentual_reciclabilidade: string;
  observacoes?: string;
}

interface ValidationResult {
  valid: CSVRow[];
  invalid: Array<{ row: number; data: CSVRow; errors: string[] }>;
}

const productSchema = z.object({
  gtin: z.string().trim().min(8, 'GTIN deve ter no mínimo 8 dígitos').max(14, 'GTIN deve ter no máximo 14 dígitos'),
  ncm: z.string().trim().length(8, 'NCM deve ter exatamente 8 dígitos'),
  descricao: z.string().trim().min(3, 'Descrição deve ter no mínimo 3 caracteres').max(200, 'Descrição muito longa'),
  tipo_embalagem: z.enum(['vidro', 'plastico', 'papel', 'papelao', 'aluminio', 'laminado', 'misto'] as const),
  reciclavel: z.enum(['sim', 'nao', 'true', 'false', '1', '0', 'Sim', 'Não', 'SIM', 'NÃO'] as const),
  percentual_reciclabilidade: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Percentual deve ser entre 0 e 100'
  ),
  observacoes: z.string().trim().max(500, 'Observações muito longas').optional(),
});

export default function ImportCSVDialog({ open, onOpenChange, onSuccess }: ImportCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      'gtin,ncm,descricao,tipo_embalagem,reciclavel,percentual_reciclabilidade,observacoes',
      '7891234567890,12345678,Garrafa PET 2L,plastico,sim,85,Embalagem reciclável',
      '7891234567891,12345679,Caixa de Papelão,papelao,sim,95,',
      '7891234567892,12345680,Lata de Alumínio,aluminio,sim,100,100% reciclável'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_produtos_ciclik.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const normalizeBoolean = (value: string): boolean => {
    const normalized = value.toLowerCase().trim();
    return ['sim', 'true', '1', 'yes'].includes(normalized);
  };

  const validateCSV = (data: CSVRow[]): ValidationResult => {
    const valid: CSVRow[] = [];
    const invalid: Array<{ row: number; data: CSVRow; errors: string[] }> = [];

    data.forEach((row, index) => {
      const errors: string[] = [];

      try {
        // Validar com zod
        productSchema.parse(row);

        // Validações adicionais
        if (!/^\d+$/.test(row.gtin)) {
          errors.push('GTIN deve conter apenas números');
        }
        if (!/^\d{8}$/.test(row.ncm)) {
          errors.push('NCM deve ter 8 dígitos numéricos');
        }

        if (errors.length === 0) {
          valid.push(row);
        } else {
          invalid.push({ row: index + 2, data: row, errors });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            errors.push(`${err.path.join('.')}: ${err.message}`);
          });
        }
        invalid.push({ row: index + 2, data: row, errors });
      }
    });

    return { valid, invalid };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo CSV',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast({
            title: 'Arquivo vazio',
            description: 'O arquivo CSV não contém dados',
            variant: 'destructive'
          });
          return;
        }

        const result = validateCSV(results.data);
        setValidationResult(result);

        if (result.invalid.length > 0) {
          toast({
            title: 'Erros de validação',
            description: `${result.invalid.length} produto(s) com erro. Revise antes de importar.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Validação concluída',
            description: `${result.valid.length} produto(s) validado(s) com sucesso`,
          });
        }
      },
      error: (error) => {
        toast({
          title: 'Erro ao ler arquivo',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      const products = validationResult.valid.map(row => ({
        gtin: row.gtin.trim(),
        ncm: row.ncm.trim(),
        descricao: row.descricao.trim(),
        tipo_embalagem: row.tipo_embalagem as TipoEmbalagem,
        reciclavel: normalizeBoolean(row.reciclavel),
        percentual_reciclabilidade: parseFloat(row.percentual_reciclabilidade),
        observacoes: row.observacoes?.trim() || null
      }));

      // Importar em lotes de 50
      const batchSize = 50;
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('produtos_ciclik')
          .insert(batch);

        if (error) {
          // Se houver erro de duplicação, tentar inserir um por um
          if (error.code === '23505') {
            for (const product of batch) {
              const { error: singleError } = await supabase
                .from('produtos_ciclik')
                .insert([product]);
              
              if (singleError) {
                errors.push(`GTIN ${product.gtin}: ${singleError.message}`);
              } else {
                imported++;
              }
            }
          } else {
            throw error;
          }
        } else {
          imported += batch.length;
        }

        setProgress(Math.round((i + batch.length) / products.length * 100));
      }

      toast({
        title: 'Importação concluída',
        description: `${imported} produto(s) importado(s) com sucesso${errors.length > 0 ? `. ${errors.length} erro(s) encontrado(s)` : ''}`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: error.message || 'Não foi possível importar os produtos',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Produtos via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados dos produtos Ciclik
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Baixe o template CSV com o formato correto</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setValidationResult(null);
                  }}
                  disabled={importing}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Label>Importando produtos...</Label>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{progress}%</p>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && !importing && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <Alert className="flex-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>{validationResult.valid.length}</strong> produto(s) válido(s)
                  </AlertDescription>
                </Alert>
                
                {validationResult.invalid.length > 0 && (
                  <Alert className="flex-1" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{validationResult.invalid.length}</strong> produto(s) com erro(s)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Valid Products Preview */}
              {validationResult.valid.length > 0 && (
                <div className="space-y-2">
                  <Label>Produtos Válidos (primeiros 5)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GTIN</TableHead>
                          <TableHead>NCM</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Reciclável</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.valid.slice(0, 5).map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{product.gtin}</TableCell>
                            <TableCell className="font-mono text-sm">{product.ncm}</TableCell>
                            <TableCell>{product.descricao}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {TIPOS_EMBALAGEM_LABELS[product.tipo_embalagem as TipoEmbalagem]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {normalizeBoolean(product.reciclavel) ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Sim ({product.percentual_reciclabilidade}%)
                                </Badge>
                              ) : (
                                <Badge variant="outline">Não</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {validationResult.valid.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      + {validationResult.valid.length - 5} produto(s) adicionais
                    </p>
                  )}
                </div>
              )}

              {/* Invalid Products */}
              {validationResult.invalid.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-destructive">Produtos com Erros</Label>
                  <div className="border border-destructive rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                    {validationResult.invalid.map((item, index) => (
                      <div key={index} className="border-b pb-2 last:border-0">
                        <p className="text-sm font-semibold">Linha {item.row}</p>
                        <p className="text-sm text-muted-foreground">
                          GTIN: {item.data.gtin} | {item.data.descricao}
                        </p>
                        <ul className="text-sm text-destructive list-disc list-inside">
                          {item.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!validationResult || validationResult.valid.length === 0 || importing}
          >
            {importing ? (
              <>Importando...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar {validationResult?.valid.length || 0} Produto(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Missing Input import
import { Input } from '@/components/ui/input';
