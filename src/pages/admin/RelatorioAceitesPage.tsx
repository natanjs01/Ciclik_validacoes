/**
 * Relatório de Aceites de um Termo
 * Visualização de estatísticas e lista de aceites
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEstatisticasTermo, useRelatorioAceites } from '@/hooks/useAdminTermos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, Loader2, Users, CheckCircle, TrendingUp } from 'lucide-react';

export default function RelatorioAceitesPage() {
  const navigate = useNavigate();
  const { id: termoId } = useParams<{ id: string }>();
  
  // Hook para estatísticas e aceites do termo específico
  const { stats, aceites, loading, error, refetch } = useEstatisticasTermo(termoId || null);
  
  // Hook para exportação de relatórios
  const { exportarCSV } = useRelatorioAceites();

  const handleExportar = () => {
    // Usar o hook de exportação CSV
    exportarCSV();
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/termos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Relatório de Aceites</h1>
            <p className="text-muted-foreground mt-1">
              Estatísticas e histórico de aceites do termo
            </p>
          </div>
        </div>
        <Button onClick={handleExportar}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Aceites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_aceites}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_usuarios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa de Aceite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.percentual_aceites ? `${stats.percentual_aceites.toFixed(1)}%` : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Aceites */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Aceites</CardTitle>
          <CardDescription>
            Lista de todos os usuários que aceitaram este termo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aceites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum aceite registrado ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Data do Aceite</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aceites.map((aceite) => (
                  <TableRow key={aceite.id}>
                    <TableCell>{aceite.user_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{aceite.versao_aceita}</Badge>
                    </TableCell>
                    <TableCell>{formatarData(aceite.aceito_em)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {aceite.ip_aceite || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
