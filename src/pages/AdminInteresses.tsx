import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, TrendingUp } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InteresseAgrupado {
  estado: string | null;
  cidade: string | null;
  funcionalidade: string;
  total: number;
}

const FUNCIONALIDADES_LABELS: Record<string, string> = {
  'nota_fiscal': 'Nota Fiscal (SEFAZ)',
};

export default function AdminInteresses() {
  const navigate = useNavigate();
  const [interesses, setInteresses] = useState<InteresseAgrupado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroFuncionalidade, setFiltroFuncionalidade] = useState<string>('todas');

  useEffect(() => {
    loadInteresses();
  }, []);

  const loadInteresses = async () => {
    try {
      const { data, error } = await supabase
        .from('interesses_funcionalidades')
        .select('estado, cidade, funcionalidade');

      if (error) throw error;

      // Agrupar por estado, cidade e funcionalidade
      const agrupados: Record<string, InteresseAgrupado> = {};
      
      data?.forEach((item) => {
        const key = `${item.estado || 'N/A'}-${item.cidade || 'N/A'}-${item.funcionalidade}`;
        if (!agrupados[key]) {
          agrupados[key] = {
            estado: item.estado,
            cidade: item.cidade,
            funcionalidade: item.funcionalidade,
            total: 0,
          };
        }
        agrupados[key].total++;
      });

      // Ordenar por total (maior primeiro)
      const lista = Object.values(agrupados).sort((a, b) => b.total - a.total);
      setInteresses(lista);
    } catch (error) {
      console.error('Erro ao carregar interesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const interessesFiltrados = filtroFuncionalidade === 'todas' 
    ? interesses 
    : interesses.filter(i => i.funcionalidade === filtroFuncionalidade);

  const totalGeral = interessesFiltrados.reduce((sum, i) => sum + i.total, 0);
  const estadosUnicos = new Set(interessesFiltrados.map(i => i.estado)).size;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Interesses por Funcionalidade
              </h1>
              <p className="text-sm text-muted-foreground">
                Demanda de usuários por estado e cidade
              </p>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Interesses</p>
                  <p className="text-2xl font-bold">{totalGeral}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estados com Demanda</p>
                  <p className="text-2xl font-bold">{estadosUnicos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maior Demanda</p>
                  <p className="text-lg font-bold truncate">
                    {interessesFiltrados[0]?.estado || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Filtrar por:</span>
                <Select value={filtroFuncionalidade} onValueChange={setFiltroFuncionalidade}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Funcionalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="nota_fiscal">Nota Fiscal (SEFAZ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demanda por Localidade</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : interessesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum interesse registrado ainda.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Funcionalidade</TableHead>
                      <TableHead className="text-right">Interessados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interessesFiltrados.map((interesse, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {interesse.estado || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {interesse.cidade || 'Não informada'}
                        </TableCell>
                        <TableCell>
                          {FUNCIONALIDADES_LABELS[interesse.funcionalidade] || interesse.funcionalidade}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-primary/10 text-primary border-0">
                            {interesse.total}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
