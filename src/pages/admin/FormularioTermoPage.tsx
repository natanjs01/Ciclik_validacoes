/**
 * Formulário de Criação/Edição de Termos
 * Interface administrativa para gerenciar termos de uso
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTermos } from '@/hooks/useAdminTermos';
import { uploadPDF } from '@/services/termosStorageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft, AlertCircle, Upload, FileText } from 'lucide-react';
import type { NovoTermo, TipoTermo, RoleUsuario } from '@/types/termos';

const TIPOS_TERMO: { value: TipoTermo; label: string }[] = [
  { value: 'termos_uso' as TipoTermo, label: 'Termos de Uso' },
  { value: 'politica_privacidade' as TipoTermo, label: 'Política de Privacidade' },
  { value: 'termo_lgpd' as TipoTermo, label: 'LGPD' },
  { value: 'contrato_cooperado' as TipoTermo, label: 'Contrato Cooperado' },
  { value: 'contrato_investidor' as TipoTermo, label: 'Contrato Investidor' },
  { value: 'outros' as TipoTermo, label: 'Outro' },
];

const ROLES_DISPONIVEIS: { value: RoleUsuario; label: string }[] = [
  { value: 'cooperado' as RoleUsuario, label: 'Cooperado' },
  { value: 'investidor' as RoleUsuario, label: 'Investidor' },
  { value: 'operador_logistico' as RoleUsuario, label: 'Operador Logístico' },
  { value: 'parceiro' as RoleUsuario, label: 'Parceiro' },
  { value: 'admin' as RoleUsuario, label: 'Administrador' },
];

export default function FormularioTermoPage() {
  const navigate = useNavigate();
  const { id: termoId } = useParams<{ id: string }>();
  const { criar, loading: salvando, error } = useAdminTermos();
  
  const isEdicao = !!termoId;
  
  // Estados do formulário
  const [tipo, setTipo] = useState<TipoTermo>('termos_uso' as TipoTermo);
  const [versao, setVersao] = useState<string>('1.0.0');
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [conteudoHtml, setConteudoHtml] = useState<string>('');
  const [obrigatorio, setObrigatorio] = useState<boolean>(true);
  const [ativo, setAtivo] = useState<boolean>(true);
  const [rolesAplicaveis, setRolesAplicaveis] = useState<RoleUsuario[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  
  // Validação
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);

  /**
   * Validar formulário
   */
  const validarFormulario = (): boolean => {
    const erros: string[] = [];

    if (!titulo.trim()) {
      erros.push('O título é obrigatório');
    }

    if (!versao.trim()) {
      erros.push('A versão é obrigatória');
    }

    if (!pdfFile && !pdfUrl) {
      erros.push('É necessário fazer upload de um PDF ou fornecer uma URL');
    }

    if (rolesAplicaveis.length === 0) {
      erros.push('Selecione pelo menos um tipo de usuário (role)');
    }

    setErrosValidacao(erros);
    return erros.length === 0;
  };

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      let urlPDF = pdfUrl;

      // Se houver arquivo PDF, fazer upload primeiro
      if (pdfFile) {
        const resultadoUpload = await uploadPDF(pdfFile, tipo, versao);
        
        if (!resultadoUpload.success) {
          setErrosValidacao([resultadoUpload.error || 'Erro ao fazer upload do PDF']);
          return;
        }

        urlPDF = resultadoUpload.pdf_url || '';
      }

      // Validar se temos URL do PDF
      if (!urlPDF) {
        setErrosValidacao(['É necessário fornecer um PDF']);
        return;
      }

      // Preparar dados
      const novoTermo: NovoTermo = {
        tipo,
        versao,
        titulo,
        pdf_url: urlPDF,
        descricao: descricao || undefined,
        conteudo_html: conteudoHtml || undefined,
        obrigatorio,
        roles_aplicaveis: rolesAplicaveis.length > 0 ? rolesAplicaveis : [],
        ativo,
      };

      const termoCriado = await criar(novoTermo);
      
      if (termoCriado) {
        navigate('/admin/termos');
      }
    } catch (err) {
      console.error('Erro ao salvar termo:', err);
      setErrosValidacao([err instanceof Error ? err.message : 'Erro ao salvar termo']);
    }
  };

  /**
   * Toggle role
   */
  const toggleRole = (role: RoleUsuario) => {
    setRolesAplicaveis(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  /**
   * Handle file upload
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setErrosValidacao(prev => prev.filter(e => !e.includes('PDF')));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/termos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdicao ? 'Editar Termo' : 'Novo Termo de Uso'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdicao 
              ? 'Atualize as informações do termo existente'
              : 'Preencha os dados para criar um novo termo'}
          </p>
        </div>
      </div>

      {/* Erros de validação */}
      {errosValidacao.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errosValidacao.map((erro, idx) => (
                <li key={idx}>{erro}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Erro da API */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do termo de uso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Termo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoTermo)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_TERMO.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título e Versão */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Termos de Uso da Plataforma Ciclik"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versao">Versão *</Label>
                <Input
                  id="versao"
                  value={versao}
                  onChange={(e) => setVersao(e.target.value)}
                  placeholder="Ex: 1.0.0"
                  required
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descrição do que este termo abrange..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Será exibida como prévia para os usuários
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload de PDF */}
        <Card>
          <CardHeader>
            <CardTitle>Documento PDF *</CardTitle>
            <CardDescription>
              Faça upload do arquivo PDF ou forneça uma URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload */}
            <div className="space-y-2">
              <Label htmlFor="pdf">Upload de Arquivo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {pdfFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {pdfFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* URL alternativa */}
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">Ou forneça uma URL</Label>
              <Input
                id="pdfUrl"
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://exemplo.com/documento.pdf"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo HTML (Opcional) */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo HTML (Opcional)</CardTitle>
            <CardDescription>
              Versão HTML do termo para exibição inline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={conteudoHtml}
              onChange={(e) => setConteudoHtml(e.target.value)}
              placeholder="<h1>Título</h1><p>Conteúdo...</p>"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Se fornecido, será exibido ao invés do PDF na interface
            </p>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Defina como e para quem o termo será aplicado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="obrigatorio">Aceite Obrigatório</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários devem aceitar para usar a plataforma
                  </p>
                </div>
                <Switch
                  id="obrigatorio"
                  checked={obrigatorio}
                  onCheckedChange={setObrigatorio}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ativo">Termo Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Termo será exibido para novos usuários
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
              </div>
            </div>

            {/* Roles aplicáveis */}
            <div className="space-y-3">
              <Label>Aplicável para (deixe vazio para todos)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ROLES_DISPONIVEIS.map(role => (
                  <label
                    key={role.value}
                    className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={rolesAplicaveis.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Se nenhum for selecionado, o termo será aplicável para todos os usuários
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/termos')}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando} size="lg">
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdicao ? 'Atualizar Termo' : 'Criar Termo'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
