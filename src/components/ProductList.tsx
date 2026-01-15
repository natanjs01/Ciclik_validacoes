import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Package, Recycle, AlertCircle } from 'lucide-react';
import { confrontarProduto } from '@/utils/confrontarProduto';
import { ProdutoCiclik, TIPOS_EMBALAGEM_LABELS } from '@/types/produtos';

interface ProductItem {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  reciclavel: boolean;
  gtin?: string;
  produto_ciclik?: ProdutoCiclik;
  produto_cadastrado?: boolean;
}

interface ProductListProps {
  items: ProductItem[];
  onChange: (items: ProductItem[]) => void;
  numeroNota?: string;
  onNumeroNotaChange?: (value: string) => void;
  cnpj?: string;
  onCnpjChange?: (value: string) => void;
  dataCompra?: string;
  onDataCompraChange?: (value: string) => void;
}

export default function ProductList({ items, onChange, numeroNota, onNumeroNotaChange, cnpj, onCnpjChange, dataCompra, onDataCompraChange }: ProductListProps) {
  const [cnpjError, setCnpjError] = useState<string>('');

  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara: 00.000.000/0000-00
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (numbers.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(numbers.charAt(i)) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (digito1 !== parseInt(numbers.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(numbers.charAt(i)) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (digito2 !== parseInt(numbers.charAt(13))) return false;
    
    return true;
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    onCnpjChange?.(formatted);
    
    // Valida CNPJ apenas se tiver 14 dígitos
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.length === 14) {
      if (!validateCNPJ(formatted)) {
        setCnpjError('CNPJ inválido');
      } else {
        setCnpjError('');
      }
    } else {
      setCnpjError('');
    }
  };
  const addItem = () => {
    onChange([
      ...items,
      {
        nome: '',
        quantidade: 1,
        preco_unitario: 0,
        preco_total: 0,
        reciclavel: false,
        gtin: '',
        produto_cadastrado: false,
      },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = async (index: number, field: keyof ProductItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate preco_total when quantidade or preco_unitario changes
    if (field === 'quantidade' || field === 'preco_unitario') {
      newItems[index].preco_total = newItems[index].quantidade * newItems[index].preco_unitario;
    }
    
    // Confrontar produto quando GTIN é digitado
    if (field === 'gtin' && value && value.length >= 8) {
      const result = await confrontarProduto(value);
      if (result.found && result.produto) {
        newItems[index].produto_cadastrado = true;
        newItems[index].produto_ciclik = result.produto;
        newItems[index].nome = result.produto.descricao;
        newItems[index].reciclavel = result.produto.reciclavel;
      } else {
        newItems[index].produto_cadastrado = false;
        newItems[index].produto_ciclik = undefined;
      }
    }
    
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Dados da Nota Fiscal</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor="product-list-numero">Número da Nota</Label>
          <Input
            id="product-list-numero"
            value={numeroNota || ''}
            onChange={(e) => onNumeroNotaChange?.(e.target.value)}
            placeholder="000000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-list-cnpj">CNPJ do Estabelecimento</Label>
          <Input
            id="product-list-cnpj"
            value={cnpj || ''}
            onChange={(e) => handleCNPJChange(e.target.value)}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className={cnpjError ? 'border-destructive' : ''}
          />
          {cnpjError && (
            <p className="text-xs text-destructive">{cnpjError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-list-data">Data da Compra</Label>
          <Input
            id="product-list-data"
            type="date"
            value={dataCompra || ''}
            onChange={(e) => onDataCompraChange?.(e.target.value)}
          />
        </div>
      </div>

      <Label className="text-sm font-semibold">Produtos</Label>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum produto adicionado. Use o OCR para extrair automaticamente ou adicione manualmente.
        </p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-full">
            <div className="space-y-2 p-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg bg-card">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 mb-2">
                    {item.produto_cadastrado && item.produto_ciclik ? (
                      <>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Package className="h-3 w-3 mr-1" />
                          Produto Cadastrado
                        </Badge>
                        <Badge variant="secondary">
                          {TIPOS_EMBALAGEM_LABELS[item.produto_ciclik.tipo_embalagem]}
                        </Badge>
                        {item.produto_ciclik.reciclavel && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Recycle className="h-3 w-3 mr-1" />
                            {item.produto_ciclik.percentual_reciclabilidade}%
                          </Badge>
                        )}
                      </>
                    ) : item.gtin && item.gtin.toUpperCase() === 'SEM GTIN' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Material sem viabilidade de reciclagem
                      </Badge>
                    ) : item.gtin && item.gtin.length >= 8 ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Produto Não Cadastrado
                      </Badge>
                    ) : null}
                  </div>

                  {/* Product fields */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    {/* CAMPO GTIN OCULTO - Mantido para uso interno */}
                    {/*
                    <div className="md:col-span-2">
                      <Label className="text-xs mb-1 block">GTIN</Label>
                      <Input
                        value={item.gtin || ''}
                        onChange={(e) => updateItem(index, 'gtin', e.target.value)}
                        placeholder="7891234567890"
                        className="w-full"
                      />
                    </div>
                    */}
                    <div className="md:col-span-9">
                      <Label className="text-xs mb-1 block">Produto</Label>
                      <Input
                        value={item.nome}
                        onChange={(e) => updateItem(index, 'nome', e.target.value)}
                        placeholder="Nome do produto"
                        className="w-full"
                        disabled={item.produto_cadastrado}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs mb-1 block">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 1)}
                        placeholder="1"
                        className="w-full"
                      />
                    </div>
                    {/* CAMPOS DE VALORES OCULTOS - TODO: Melhorar visualização
                    <div className="md:col-span-2">
                      <Label className="text-xs mb-1 block">Preço Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco_unitario}
                        onChange={(e) => updateItem(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs mb-1 block">Total</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco_total}
                        onChange={(e) => updateItem(index, 'preco_total', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    */}
                    <div className="md:col-span-1">
                      <Label className="text-xs mb-1 block">Recicl.</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={item.reciclavel}
                          onCheckedChange={(checked) => updateItem(index, 'reciclavel', checked)}
                          disabled={true}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="w-full md:w-auto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional product info */}
                  {item.produto_ciclik && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex gap-4">
                        <span><strong>NCM:</strong> {item.produto_ciclik.ncm}</span>
                        {item.produto_ciclik.observacoes && (
                          <span><strong>Obs:</strong> {item.produto_ciclik.observacoes}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
