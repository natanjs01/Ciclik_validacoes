/**
 * Página de Detalhes do Termo
 * Visualização completa de um termo com suas informações
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarTermoPorId } from '@/services/termosUsoService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  BarChart, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Users,
  Shield
} from 'lucide-react';
import type { TermoUso } from '@/types/termos';

const LABELS_TIPO: Record<string, string> = {
  termos_uso: 'Termos de Uso',
  politica_privacidade: 'Política de Privacidade',
  termo_lgpd: 'LGPD',
  contrato_cooperado: 'Contrato Cooperado',
  contrato_investidor: 'Contrato Investidor',
  outros: 'Outro',
};

const LABELS_ROLES: Record<string, string> = {
  cooperado: 'Cooperado',
  investidor: 'Investidor',
  operador_logistico: 'Operador Logístico',
  parceiro: 'Parceiro',
  admin: 'Administrador',
};

export default function DetalhesTermoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [termo, setTermo] = useState<TermoUso | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/admin/termos');
      return;
    }

    carregarTermo();
  }, [id]);

  const carregarTermo = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await buscarTermoPorId(id!);
      
      if (!dados) {
        setError('Termo não encontrado');
        return;
      }
      
      setTermo(dados);
    } catch (err) {
      console.error('Erro ao carregar termo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar termo');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVoltar = () => {
    navigate('/admin/termos');
  };

  const handleEditar = () => {
    navigate(`/admin/termos/${id}/editar`);
  };

  const handleRelatorio = () => {
    navigate(`/admin/termos/${id}/relatorio`);
  };

  const handleDownloadPDF = () => {
    if (termo?.pdf_url) {
      window.open(termo.pdf_url, '_blank');
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Carregando detalhes do termo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Erro
  if (error || !termo) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Termo não encontrado'}</AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={handleVoltar}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Termo</h1>
            <p className="text-muted-foreground">
              Visualização completa do termo de uso
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {termo.ativo && (
            <Button variant="outline" onClick={handleEditar}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={handleRelatorio}>
            <BarChart className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          {termo.pdf_url && (
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Informações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Título</Label>
              <p className="text-base font-medium">{termo.titulo}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Tipo</Label>
                <p className="text-base">{LABELS_TIPO[termo.tipo]}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Versão</Label>
                <Badge variant="outline" className="text-sm">
                  v{termo.versao}
                </Badge>
              </div>
            </div>

            {termo.resumo && (
              <div>
                <Label className="text-sm text-muted-foreground">Resumo</Label>
                <p className="text-sm">{termo.resumo}</p>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                {termo.obrigatorio ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">
                  {termo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {termo.ativo ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">
                  {termo.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aplicabilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Aplicabilidade
            </CardTitle>
            <CardDescription>
              Tipos de usuários que devem aceitar este termo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Perfis Selecionados
              </Label>
              <div className="flex flex-wrap gap-2">
                {termo.roles_aplicaveis && termo.roles_aplicaveis.length > 0 ? (
                  termo.roles_aplicaveis.map((role) => (
                    <Badge key={role} variant="secondary" className="text-sm">
                      {LABELS_ROLES[role]}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aplicável para todos os usuários
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Criado em</Label>
              <p className="text-sm">{formatarData(termo.criado_em)}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">
                Última atualização
              </Label>
              <p className="text-sm">{formatarData(termo.atualizado_em)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Arquivo PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Caminho do PDF</Label>
              <p className="text-sm font-mono break-all">{termo.pdf_path}</p>
            </div>

            {termo.pdf_url && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo HTML (se existir) */}
      {termo.conteudo_html && (
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo HTML</CardTitle>
            <CardDescription>
              Versão HTML do termo (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: termo.conteudo_html }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
