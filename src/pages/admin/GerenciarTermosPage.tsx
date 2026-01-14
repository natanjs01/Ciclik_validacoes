/**
 * Página de Gerenciamento de Termos (Admin)
 * Dashboard completo para CRUD de termos de uso
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminTermos } from '@/hooks/useAdminTermos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  BarChart,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import type { TermoUso } from '@/types/termos';

export default function GerenciarTermosPage() {
  const navigate = useNavigate();
  const { termos, loading, desativar, ativar } = useAdminTermos();
  
  // Estados de filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  
  // Estado do modal de exclusão
  const [termoParaDesativar, setTermoParaDesativar] = useState<TermoUso | null>(null);
  const [processandoDesativar, setProcessandoDesativar] = useState(false);

  /**
   * Filtrar termos
   */
  const termosFiltrados = termos.filter(termo => {
    // Filtro de texto (busca em título e resumo)
    if (filtroTexto) {
      const textoLower = filtroTexto.toLowerCase();
      const matchTexto = 
        termo.titulo.toLowerCase().includes(textoLower) ||
        termo.resumo?.toLowerCase().includes(textoLower);
      if (!matchTexto) return false;
    }

    // Filtro de tipo
    if (filtroTipo !== 'todos' && termo.tipo !== filtroTipo) {
      return false;
    }

    // Filtro de status
    if (filtroStatus === 'ativos' && !termo.ativo) return false;
    if (filtroStatus === 'inativos' && termo.ativo) return false;

    return true;
  });

  /**
   * Desativar termo com confirmação
   */
  const handleDesativar = async () => {
    if (!termoParaDesativar) return;

    setProcessandoDesativar(true);
    try {
      await desativar(termoParaDesativar.id);
      setTermoParaDesativar(null);
    } catch (error) {
      console.error('Erro ao desativar termo:', error);
    } finally {
      setProcessandoDesativar(false);
    }
  };

  /**
   * Reativar termo
   */
  const handleReativar = async (termoId: string) => {
    try {
      await ativar(termoId);
    } catch (error) {
      console.error('Erro ao reativar termo:', error);
    }
  };

  /**
   * Navegar para criação
   */
  const handleNovo = () => {
    navigate('/admin/termos/novo');
  };

  /**
   * Navegar para edição
   */
  const handleEditar = (termoId: string) => {
    navigate(`/admin/termos/${termoId}/editar`);
  };

  /**
   * Ver detalhes do termo
   */
  const handleVisualizar = (termoId: string) => {
    navigate(`/admin/termos/${termoId}`);
  };

  /**
   * Ver relatório de aceites
   */
  const handleRelatorio = (termoId: string) => {
    navigate(`/admin/termos/${termoId}/relatorio`);
  };

  /**
   * Download do PDF
   */
  const handleDownloadPDF = (termo: TermoUso) => {
    if (termo.pdf_url) {
      window.open(termo.pdf_url, '_blank');
    }
  };

  /**
   * Formatar data
   */
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Obter badge de status
   */
  const getBadgeStatus = (termo: TermoUso) => {
    if (!termo.ativo) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  /**
   * Obter label do tipo
   */
  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      termos_uso: 'Termos de Uso',
      politica_privacidade: 'Política de Privacidade',
      lgpd: 'LGPD',
      contrato: 'Contrato',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header com botão de voltar */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Gerenciar Termos de Uso</h1>
          <p className="text-muted-foreground mt-2">
            Crie, edite e gerencie os termos de uso da plataforma
          </p>
        </div>
        <Button onClick={handleNovo} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Novo Termo
        </Button>
      </div>

      {/* Card de estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Termos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{termos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Termos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termos.filter(t => t.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obrigatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termos.filter(t => t.obrigatorio).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termos.filter(t => !t.ativo).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca por texto */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por tipo */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="termos_uso">Termos de Uso</SelectItem>
                <SelectItem value="politica_privacidade">Política de Privacidade</SelectItem>
                <SelectItem value="lgpd">LGPD</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por status */}
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Apenas Ativos</SelectItem>
                <SelectItem value="inativos">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contador de resultados */}
          {(filtroTexto || filtroTipo !== 'todos' || filtroStatus !== 'todos') && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {termosFiltrados.length} de {termos.length} termo(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de termos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Termos</CardTitle>
          <CardDescription>
            Gerencie todos os termos de uso cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : termosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {filtroTexto || filtroTipo !== 'todos' || filtroStatus !== 'todos'
                  ? 'Nenhum termo encontrado com os filtros aplicados'
                  : 'Nenhum termo cadastrado ainda'}
              </p>
              {!filtroTexto && filtroTipo === 'todos' && filtroStatus === 'todos' && (
                <Button onClick={handleNovo} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Termo
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termosFiltrados.map((termo) => (
                    <TableRow key={termo.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{termo.titulo}</div>
                          {termo.resumo && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {termo.resumo}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoLabel(termo.tipo)}
                          {termo.obrigatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{termo.versao}</Badge>
                      </TableCell>
                      <TableCell>{getBadgeStatus(termo)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatarData(termo.criado_em)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleVisualizar(termo.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            
                            {termo.ativo && (
                              <DropdownMenuItem onClick={() => handleEditar(termo.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleRelatorio(termo.id)}>
                              <BarChart className="h-4 w-4 mr-2" />
                              Relatório de Aceites
                            </DropdownMenuItem>
                            
                            {termo.pdf_url && (
                              <DropdownMenuItem onClick={() => handleDownloadPDF(termo)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {!termo.ativo ? (
                              <DropdownMenuItem onClick={() => handleReativar(termo.id)}>
                                Reativar Termo
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setTermoParaDesativar(termo)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de desativação */}
      <AlertDialog
        open={!!termoParaDesativar}
        onOpenChange={(open) => !open && setTermoParaDesativar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar termo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o termo "<strong>{termoParaDesativar?.titulo}</strong>"?
              <br /><br />
              Termos desativados não serão exibidos para novos usuários, mas os aceites
              existentes serão mantidos. Você pode reativar o termo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processandoDesativar}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesativar}
              disabled={processandoDesativar}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processandoDesativar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
